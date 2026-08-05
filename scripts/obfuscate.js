const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('🔒 Starting Full JavaScript Obfuscation for ALL Project Files...\n');

const filesToObfuscate = [
    { src: 'public/js/script.js', backup: 'public/js/script.src.js', copies: ['js/script.js'] },
    { src: 'public/js/data.js', backup: 'public/js/data.src.js', copies: [] },
    { src: 'api/index.js', backup: 'api/index.src.js', copies: [] },
    { src: 'server.js', backup: 'server.src.js', copies: [] },
    { src: 'scripts/update-prices.js', backup: 'scripts/update-prices.src.js', copies: [] }
];

filesToObfuscate.forEach(fileInfo => {
    const targetPath = path.join(__dirname, '..', fileInfo.src);
    const backupPath = path.join(__dirname, '..', fileInfo.backup);

    if (!fs.existsSync(targetPath)) {
        console.log(`⚠️ Warning: ${fileInfo.src} not found, skipping.`);
        return;
    }

    let sourceCode;
    if (fs.existsSync(backupPath)) {
        sourceCode = fs.readFileSync(backupPath, 'utf8');
        console.log(`📄 Using original source from ${fileInfo.backup}`);
    } else {
        sourceCode = fs.readFileSync(targetPath, 'utf8');
        fs.writeFileSync(backupPath, sourceCode, 'utf8');
        console.log(`💾 Backup created: ${fileInfo.backup}`);
    }

    try {
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: false,
            simplify: true,
            splitStrings: true,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
        });

        const obfuscatedCode = obfuscationResult.getObfuscatedCode();
        fs.writeFileSync(targetPath, obfuscatedCode, 'utf8');
        console.log(`🔒 Obfuscated: ${fileInfo.src}`);

        fileInfo.copies.forEach(copyRelPath => {
            const copyPath = path.join(__dirname, '..', copyRelPath);
            fs.writeFileSync(copyPath, obfuscatedCode, 'utf8');
            console.log(`📋 Copied obfuscated code to: ${copyRelPath}`);
        });

    } catch (err) {
        console.error(`❌ Failed to obfuscate ${fileInfo.src}:`, err.message);
    }

    console.log('--------------------------------------------------');
});

console.log('\n🎉 ALL JavaScript files obfuscated & protected successfully!');
