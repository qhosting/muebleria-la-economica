export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const latestVersion = process.env.LATEST_APP_VERSION || '2.2.1';
  const minRequiredVersion = process.env.MIN_REQUIRED_APP_VERSION || '2.2.0';
  const versionCode = parseInt(process.env.LATEST_APP_VERSION_CODE || '4', 10);
  const forceUpdate = process.env.FORCE_APP_UPDATE === 'true';
  const apkSizeMb = process.env.APP_APK_SIZE_MB || '8.2';
  const releaseNotes = process.env.APP_RELEASE_NOTES || 'Detección inteligente de Wi-Fi para actualización de APK sin consumo de datos y mejoras de sincronización.';

  return NextResponse.json({
    latestVersion,
    minRequiredVersion,
    versionCode,
    forceUpdate,
    apkSizeMb,
    releaseDate: new Date().toISOString().split('T')[0],
    downloadUrl: '/downloads/LaEconomica.apk',
    releaseNotes,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
