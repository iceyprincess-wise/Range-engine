const fs = require('fs');
const path = require('path');

// Target directories (covering React Frontend and Potential Python Backend)
const DIRS_TO_SCAN = ['./src', './components', './pages', './backend', './api', './server'];
// Keywords related to Task 13 directives
const KEYWORDS = ['live', 'basketapi', 'recodx', 'stall', 'history', 'sync', 'possession'];

console.log("=================================================");
console.log("🔬 INITIATING DEEP ROOT AST & TEXT SCAN");
console.log("=================================================");

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        // Skip dependencies and build folders
        if (stat.isDirectory() && !fullPath.match(/(node_modules|\.git|\.next|dist|build|venv|__pycache__)/)) {
            scanDir(fullPath);
        } else if (stat.isFile() && /\.(tsx|ts|jsx|js|py|env|json)$/.test(fullPath)) {
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        let fileLogged = false;

        lines.forEach((line, index) => {
            const lowerLine = line.toLowerCase();
            KEYWORDS.forEach(keyword => {
                if (lowerLine.includes(keyword.toLowerCase())) {
                    // Filter out generic noise
                    if (lowerLine.includes('console.log') || lowerLine.includes('eslint')) return;
                    
                    if (!fileLogged) {
                        console.log(`\n📂 TARGET ACQUIRED: ${filePath}`);
                        fileLogged = true;
                    }
                    // Truncate to avoid massive terminal dumps while keeping context
                    console.log(`   [Line ${index + 1}] -> ${line.trim().substring(0, 150)}`);
                }
            });
        });
    } catch (err) {
        console.error(`Error reading ${filePath}: ${err.message}`);
    }
}

DIRS_TO_SCAN.forEach(dir => scanDir(dir));
console.log("\n✅ DEEP SCAN COMPLETE.");
