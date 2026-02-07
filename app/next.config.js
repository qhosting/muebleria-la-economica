const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración dinámica para build Nativo vs Web
  // Si BUILD_TARGET=capacitor, forzamos 'export' estático
  output: process.env.BUILD_TARGET === 'capacitor' ? 'export' : process.env.NEXT_OUTPUT_MODE,
  distDir: process.env.BUILD_TARGET === 'capacitor' ? 'out' : (process.env.NEXT_DIST_DIR || '.next'),

  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // Capacitor requiere trailing slash en exportación estática
  trailingSlash: process.env.BUILD_TARGET === 'capacitor',

  images: { unoptimized: true },
};

module.exports = nextConfig;
