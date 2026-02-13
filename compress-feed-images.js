#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const feedDir = path.join(__dirname, 'content', 'feed');

// Marker file to track which images have been compressed
const compressionMarker = path.join(feedDir, '.compression-mark');

function getCompressionMark() {
    if (!fs.existsSync(compressionMarker)) {
        return [];
    }
    const content = fs.readFileSync(compressionMarker, 'utf8');
    return content.trim().split('\n').filter(line => line.length > 0);
}

function saveCompressionMark(compressed) {
    fs.writeFileSync(compressionMarker, compressed.join('\n'));
}

async function compressImages() {
    try {
        // Dynamically require sharp
        const sharp = require('sharp');
        
        if (!fs.existsSync(feedDir)) {
            console.log('Feed directory not found, skipping compression');
            return;
        }

        const files = fs.readdirSync(feedDir);
        const compressed = getCompressionMark();
        const newlyCompressed = [];
        
        for (const file of files) {
            const filePath = path.join(feedDir, file);
            const stat = fs.statSync(filePath);
            
            // Skip directories, marker file, and _index.md
            if (stat.isDirectory() || file === '.compression-mark' || file === '_index.md') {
                continue;
            }
            
            const ext = path.extname(file).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                continue;
            }

            // Skip if already compressed
            if (compressed.includes(file)) {
                continue;
            }

            try {
                console.log(`⏳ Compressing: ${file}`);
                
                // Resize to max 1200px width, compress quality to 80%
                // .rotate() automatically handles EXIF orientation
                await sharp(filePath)
                    .rotate()
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 80, progressive: true })
                    .toFile(filePath + '.tmp');
                
                // Replace original with compressed version
                fs.renameSync(filePath + '.tmp', filePath);
                newlyCompressed.push(file);
                
                const newSize = fs.statSync(filePath).size;
                const newSizeMB = (newSize / (1024 * 1024)).toFixed(2);
                console.log(`✓ Compressed: ${file} (${newSizeMB}MB)`);
            } catch (err) {
                console.error(`✗ Error compressing ${file}:`, err.message);
            }
        }

        // Update compression mark
        const updated = [...compressed, ...newlyCompressed];
        if (updated.length > 0) {
            saveCompressionMark(updated);
            console.log(`\n✓ Compression complete. ${newlyCompressed.length} images optimized.`);
        }
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('⚠️  sharp not installed. Install with: npm install sharp');
            console.log('Skipping image compression...');
        } else {
            throw err;
        }
    }
}

compressImages().catch(err => {
    console.error('Compression failed:', err);
    process.exit(1);
});
