#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const feedDir = path.join(__dirname, 'content', 'life');

async function convertHeic() {
    if (!fs.existsSync(feedDir)) {
        console.log('Feed directory not found, skipping HEIC conversion');
        return;
    }

    const files = fs.readdirSync(feedDir).filter(f =>
        /\.(heic|heif)$/i.test(path.extname(f))
    );

    if (files.length === 0) {
        console.log('✓ No HEIC files to convert.');
        return;
    }

    for (const file of files) {
        const inputPath = path.join(feedDir, file);
        const outputName = path.basename(file, path.extname(file)) + '.jpg';
        const outputPath = path.join(feedDir, outputName);

        try {
            await sharp(inputPath)
                .withMetadata()
                .toFormat('jpeg', { quality: 95 })
                .toFile(outputPath);

            fs.unlinkSync(inputPath);
            console.log(`✓ Converted: ${file} → ${outputName}`);
        } catch (err) {
            console.error(`✗ Failed to convert ${file}: ${err.message}`);
        }
    }
}

convertHeic().catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
});
