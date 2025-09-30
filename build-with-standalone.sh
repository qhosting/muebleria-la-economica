
#!/bin/sh

echo "🚀 Building Next.js app with standalone output..."

# Ensure we're in the app directory
cd /app || exit 1

# Force standalone output configuration
echo "🔧 Configuring Next.js for standalone output..."
node -e "
const fs = require('fs');
const path = require('path');

// Read current next.config.js
const configPath = './next.config.js';
let content = fs.readFileSync(configPath, 'utf8');

console.log('Original config output setting:', content.match(/output.*,/));

// Force standalone output
content = content.replace(
  /output:\s*process\.env\.NEXT_OUTPUT_MODE,?/g,
  'output: \\'standalone\\','
);

// Ensure standalone is set
if (!content.includes('output:')) {
  content = content.replace(
    'const nextConfig = {',
    'const nextConfig = {\n  output: \\'standalone\\','
  );
}

fs.writeFileSync(configPath, content);
console.log('✅ Next.js config updated for standalone output');
"

# Verify the configuration
echo "🔍 Verifying Next.js configuration..."
grep -n "output:" next.config.js || echo "⚠️ Output config not found"

# Run the build
echo "🏗️ Starting Next.js build..."
yarn build

# Verify standalone directory was created
if [ -d ".next/standalone" ]; then
    echo "✅ Standalone build successful! Directory created."
    ls -la .next/standalone
else
    echo "❌ ERROR: Standalone directory not created!"
    ls -la .next/
    exit 1
fi

echo "🎉 Build completed successfully with standalone output!"
