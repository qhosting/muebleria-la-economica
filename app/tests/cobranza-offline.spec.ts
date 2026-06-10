import { test, expect } from '@playwright/test';

test.describe('Cobranza Offline E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Forward browser console logs to terminal
    page.on('console', msg => {
      console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`);
    });

    page.on('request', req => {
      console.log(`REQ: ${req.method()} ${req.url()}`);
    });
    page.on('response', res => {
      console.log(`RES: ${res.status()} ${res.url()}`);
    });

    // Mock the client-side session endpoint to return a standardized test-cobrador-id
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-cobrador-id',
            name: 'Test Cobrador',
            email: 'cobrador@test.com',
            role: 'cobrador',
          },
          expires: '2036-01-01T00:00:00.000Z',
        }),
      });
    });

    // Navigate to login page and perform standard authentication
    await page.goto('/login');
    await page.fill('input[type="email"]', 'ruta0@local.com');
    await page.fill('input[type="password"]', 'ruta123');
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Wait for the login to complete and redirect to mobile home or dashboard
    await page.waitForURL(url => url.pathname.includes('/mobile/home') || url.pathname.includes('/dashboard'));




    // Mock the initial synchronization endpoint to return empty data or sample offline clients
    await page.route('**/api/sync/clientes/**', async (route) => {
      const today = new Date().getDay();
      const diasMap = ['7', '1', '2', '3', '4', '5', '6'];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'client-test-1',
            nombreCompleto: 'Juan Pérez Test',
            saldoPendiente: 1000.55,
            montoAcordado: 150.35,
            telefono: '5551234',
            direccion: 'Calle Falsa 123',
            diaPago: diasMap[today],
            cobradorAsignadoId: 'test-cobrador-id',
            statusCuenta: 'activo',
            lastSync: Date.now(),
            syncStatus: 'synced'
          }
        ]),
      });
    });

    // Mock other sync endpoints
    await page.route('**/api/sync/!(clientes)/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock API pagos
    await page.route('**/api/pagos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });


  test('Debería cargar la interfaz de cobranza móvil y permitir registrar un pago offline con precisión matemática', async ({ page, context }) => {
    // Navigate to the mobile client view
    await page.goto('/dashboard/cobranza-mobile');

    // Wait for the sync to complete and loading to disappear
    await page.waitForSelector('text=Juan Pérez Test', { timeout: 10000 });


    // Now simulate going offline by denying all future requests or simulating network state
    await context.setOffline(true);
    console.log('Went offline successfully.');


    // Verify client is listed
    await expect(page.locator('text=Juan Pérez Test')).toBeVisible();

    // Open payment modal for client
    await page.click('text=Juan Pérez Test');
    await page.click('button:has-text("Cobrar"), button:has-text("Registrar Cobro")');

    // Verify modal is visible and shows correct initial values
    await expect(page.locator('text=Registrar Cobro')).toBeVisible();
    await expect(page.locator('text=$1,000.55').first()).toBeVisible(); // Saldo Actual

    // Test Case 1: Pago Regular de $150.35
    await page.fill('#monto', '150.35');
    // Verify math summary:
    // Saldo Anterior: 1000.55
    // Monto Total Cobrado: 150.35
    // Nuevo Saldo: 1000.55 - 150.35 = 850.20
    await expect(page.locator('text=Saldo Anterior: >> xpath=../..').first()).toContainText('$1,000.55');
    await expect(page.locator('text=Nuevo Saldo: >> xpath=../..').first()).toContainText('$850.20');

    // Test Case 2: Pago Regular de $150.35 con Moratorio de $50.00 (el moratorio se resta del abono a saldo regular)
    await page.fill('#montoMoratorio', '50.00');
    // Saldo Anterior: 1000.55
    // Monto Total Cobrado: 150.35
    // Moratorio: 50.00
    // Aplicado al saldo: 150.35 - 50.00 = 100.35
    // Nuevo Saldo: 1000.55 - 100.35 = 900.20
    await expect(page.locator('text=Nuevo Saldo: >> xpath=../..').first()).toContainText('$900.20');

    // Test Case 3: Cobro de Mora (Aumenta Saldo) de $100.25
    // If Select component is radix, let's trigger it
    const selectTrigger = page.locator('button:has-text("Pago Regular"), button:has-text("Abono"), button:has-text("Pago de Mora"), button:has-text("Cobro de Mora")').first();
    await selectTrigger.click();
    await page.click('role=option[name="Cobro de Mora (Aumenta Saldo)"]');
    await page.fill('#monto', '100.25');
    // Saldo Anterior: 1000.55
    // Nuevo Saldo: 1000.55 + 100.25 = 1100.80
    await expect(page.locator('text=Nuevo Saldo: >> xpath=../..').first()).toContainText('$1,100.80');

    // Test Case 4: Pago de Mora (Sin afectar saldo) de $75.50
    await selectTrigger.click();
    await page.click('role=option[name="Pago de Mora (Sin afectar saldo)"]');
    await page.fill('#montoMoratorio', '75.50');
    // Saldo Anterior: 1000.55
    // Nuevo Saldo: 1000.55 (No cambia)
    await expect(page.locator('text=Nuevo Saldo: >> xpath=../..').first()).toContainText('$1,000.55');

    // Set back to regular and record payment offline
    await selectTrigger.click();
    await page.click('role=option[name="Pago Regular"]');

    await page.fill('#monto', '150.35');
    await page.fill('#montoMoratorio', '0.00');

    // Disable automatic printing so it doesn't fail due to printer plugin not found mock
    const printSwitch = page.locator('button[role="switch"]');
    if (await printSwitch.count() > 0 && await printSwitch.getAttribute('aria-checked') === 'true' && !(await printSwitch.isDisabled())) {
      await printSwitch.click();
    }

    // Submit payment offline
    await page.click('button:has-text("Registrar")');

    // Toast: "Pago guardado offline"
    await expect(page.locator('text=Pago guardado offline')).toBeVisible();

    // Verify offline client list updated locally
    await expect(page.locator('text=Juan Pérez Test')).toBeVisible();
    // Verify client list reflects the updated balance: 1000.55 - 150.35 = 850.20
    await expect(page.locator('text=$850.20').first()).toBeVisible();

    // Reconnect network
    await context.setOffline(false);
    console.log('Went online successfully.');

    // Trigger sync status modal or wait for sync service
    // Sync should upload the offline payments to /api/pagos
  });
});
