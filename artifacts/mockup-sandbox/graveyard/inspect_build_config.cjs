const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("🛠️ TASK 16 PIVOT: VITE & BUILD CONFIG INSPECTION 🛠️");
console.log("=======================================================\n");

const vitePath = path.join(process.cwd(), 'vite.config.ts');
const pkgPath = path.join(process.cwd(), 'package.json');

if (fs.existsSync(vitePath)) {
    console.log("✅ FOUND: vite.config.ts");
    console.log("--- Content Preview ---");
    console.log(fs.readFileSync(vitePath, 'utf-8'));
    console.log("-----------------------\n");
} else {
    console.log("⚠️ WARNING: vite.config.ts not found at root.\n");
}

if (fs.existsSync(pkgPath)) {
    console.log("✅ FOUND: package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    console.log("--- Build Scripts Preview ---");
    console.log(JSON.stringify(pkg.scripts, null, 2));
    console.log("-----------------------------\n");
}

console.log("=======================================================");
console.log("✅ INSPECTION COMPLETE. AWAITING OUTPUT.");
console.log("=======================================================\n");
