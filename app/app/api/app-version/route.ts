export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latestVersion: '2.1.0',
    minRequiredVersion: '2.1.0',
    versionCode: 2,
    forceUpdate: true,
    releaseDate: new Date().toISOString().split('T')[0],
    downloadUrl: '/downloads/LaEconomica.apk',
    releaseNotes: 'Modo Offline-First por defecto, estabilidad mejorada en redes celulares y sincronización confiable.',
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
