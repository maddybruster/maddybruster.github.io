#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const feedDir = path.join(__dirname, 'content', 'life');

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

function cleanupStaleMarks(currentFiles) {
    // Remove entries from compression mark that don't exist in the directory
    const compressed = getCompressionMark();
    const filtered = compressed.filter(file => currentFiles.includes(file));
    if (filtered.length !== compressed.length) {
        saveCompressionMark(filtered);
    }
    return filtered;
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
        let compressed = cleanupStaleMarks(files);
        const newlyCompressed = [];
        
        for (const file of files) {
            const filePath = path.join(feedDir, file);
            
            // Skip if already compressed
            if (compressed.includes(file)) {
                continue;
            }
            
            // Check if file exists before trying to stat it
            if (!fs.existsSync(filePath)) {
                continue;
            }
            
            const stat = fs.statSync(filePath);
            
            // Skip directories, marker file, and _index.md
            if (stat.isDirectory() || file === '.compression-mark' || file === '_index.md') {
                continue;
            }
            
            const ext = path.extname(file).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].includes(ext)) {
                continue;
            }

            try {
                console.log(`⏳ Compressing: ${file}`);
                
                let processedPath = filePath;
                let recordedFilename = file;
                let baseName = file.slice(0, -ext.length);
                
                // Convert HEIC/HEIF to JPG using ImageMagick first
                if (['.heic', '.heif'].includes(ext)) {
                    const jpgPath = path.join(feedDir, baseName + '.jpg');
                    console.log(`  Converting HEIC to JPG...`);
                    try {
                        execSync(`convert "${filePath}" -quality 80 "${jpgPath}"`);
                        fs.unlinkSync(filePath); // Delete original HEIC
                        processedPath = jpgPath;
                        recordedFilename = baseName + '.jpg'; // Update filename for tracking
                    } catch (convErr) {
                        console.error(`✗ ImageMagick conversion failed:`, convErr.message);
                        throw convErr;
                    }
                }
                
                // Resize to max 1200px width, compress quality to 80%
                // .rotate() automatically handles EXIF orientation
                await sharp(processedPath)
                    .rotate()
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .withMetadata()
                    .jpeg({ quality: 80, progressive: true })
                    .toFile(processedPath + '.tmp');
                
                // Replace original with compressed version
                fs.renameSync(processedPath + '.tmp', processedPath);
                newlyCompressed.push(recordedFilename);
                
                const newSize = fs.statSync(processedPath).size;
                const newSizeMB = (newSize / (1024 * 1024)).toFixed(2);
                console.log(`✓ Compressed: ${recordedFilename} (${newSizeMB}MB)`);
            } catch (err) {
                console.error(`✗ Error compressing ${file}:`, err.message);
                // Clean up temporary files if they exist
                try {
                    if (fs.existsSync(filePath + '.tmp')) {
                        fs.unlinkSync(filePath + '.tmp');
                    }
                    // Also clean up temp file at processedPath if different
                    if (processedPath && processedPath !== filePath && fs.existsSync(processedPath + '.tmp')) {
                        fs.unlinkSync(processedPath + '.tmp');
                    }
                } catch (cleanupErr) {
                    // Ignore cleanup errors
                }
                // Don't add to compression mark if processing failed
                continue;
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
