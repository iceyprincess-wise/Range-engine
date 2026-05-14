const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("🚀 TASK 16: INITIATING VITE OPTIMIZATION PROTOCOL 🚀");
console.log("=======================================================\n");

const vitePath = path.join(process.cwd(), 'vite.config.ts');
const pkgPath = path.join(process.cwd(), 'package.json');

// 1. Update vite.config.ts
let viteContent = fs.readFileSync(vitePath, 'utf-8');

const newBuildBlock = `build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide')) return 'vendor-icons';
            return 'vendor-core';
          }
        }
      }
    }
  },`;

// Safe regex to replace the old basic build block
viteContent = viteContent.replace(/build:\s*\{[^}]+\},/, newBuildBlock);

fs.writeFileSync(vitePath, viteContent, 'utf-8');
console.log("✅ SUCCESS: vite.config.ts injected with Rollup Chunking.");

// 2. Update package.json
let pkgContent = fs.readFileSync(pkgPath, 'utf-8');
let pkg = JSON.parse(pkgContent);

// Force Node to garbage collect before Render's 512MB OS limit
pkg.scripts.build = "NODE_OPTIONS=--max-old-space-size=400 vite build";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
console.log("✅ SUCCESS: package.json build script fortified with Memory Limits.");

console.log("\n=======================================================");
console.log("🛡️ OPTIMIZATION COMPLETE. SYSTEM READY FOR RENDER. 🛡️");
console.log("=======================================================\n");
