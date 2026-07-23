const fs = require('fs');
const path = require('path');

// Target the exact file path based on the error log
const targetFile = path.join(process.cwd(), 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Regex to accurately catch the exact line regardless of spacing
    const buggyRegex = /return\s+\(\)\s*=>\s*clearTimeout\(ticker\);/g;
    const replacement = '// return () => clearTimeout(ticker); // ✅ FIXED: Removed undefined ticker reference from Point 11';

    if (buggyRegex.test(content)) {
        content = content.replace(buggyRegex, replacement);
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('✅ SURGICAL SUCCESS: The undefined ticker error has been permanently neutralized.');
    } else {
        console.log('⚠️ WARNING: The exact ticker code could not be found. Please check if it was already manually deleted.');
    }
} else {
    console.log(`❌ ERROR: Could not find RangeEngine.tsx at ${targetFile}`);
}
