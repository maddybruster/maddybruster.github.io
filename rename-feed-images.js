#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifReader = require('exif-reader');

const feedDir = path.join(__dirname, 'content', 'life');

// Pattern to match already renamed files (YY-MM-DD format)
const renamedPattern = /^\d{2}-\d{2}-\d{2}(-\d+)?\.[a-zA-Z0-9]+$/;

function formatDate(date) {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getExifDate(exifTags) {
    if (!exifTags) return null;

    const exif = exifTags.exif || {};
    const dateValue = exif.DateTimeOriginal || exif.CreateDate || exif.DateTimeDigitized;
    if (!dateValue) return null;

    if (dateValue instanceof Date && !isNaN(dateValue)) {
        return dateValue;
    }

    if (typeof dateValue === 'string') {
        const normalized = dateValue.replace(/^\d{4}:/, match => match.replace(':', '-')).replace(/:/g, '-');
        const parsed = new Date(normalized);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }

    return null;
}

async function getImageDate(filePath, fallbackDate) {
    try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.exif) {
            const tags = exifReader(metadata.exif);
            const exifDate = getExifDate(tags);
            if (exifDate) {
                return exifDate;
            }
        }
    } catch (err) {
        console.log(`⚠️  EXIF read failed for ${path.basename(filePath)}: ${err.message}`);
    }

    return fallbackDate;
}

async function renameImages() {
    if (!fs.existsSync(feedDir)) {
        console.log('Feed directory not found, skipping rename');
        return;
    }

    const files = fs.readdirSync(feedDir);
    const dateMap = {}; // Track how many files per date
    
    for (const file of files) {
        const filePath = path.join(feedDir, file);
        const stat = fs.statSync(filePath);
        
        // Skip directories and already renamed files
        if (stat.isDirectory() || renamedPattern.test(file)) {
            continue;
        }
        
        // Skip _index.md and other non-image files
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'].includes(ext)) {
            continue;
        }

        // Get EXIF date (fallback to modification time)
        const modDate = new Date(stat.mtimeMs);
        const imageDate = await getImageDate(filePath, modDate);
        const dateStr = formatDate(imageDate);
        
        // Track duplicates for this date
        if (!dateMap[dateStr]) {
            dateMap[dateStr] = 0;
        }
        dateMap[dateStr]++;
        
        // Generate new filename
        let newName;
        if (dateMap[dateStr] === 1) {
            newName = `${dateStr}${ext}`;
        } else {
            newName = `${dateStr}-${dateMap[dateStr] - 1}${ext}`;
        }
        
        const newPath = path.join(feedDir, newName);
        
        // Don't rename if target already exists
        if (fs.existsSync(newPath)) {
            console.log(`⚠️  Skipped ${file} (target ${newName} already exists)`);
            continue;
        }
        
        // Rename the file
        fs.renameSync(filePath, newPath);
        console.log(`✓ Renamed: ${file} → ${newName}`);
    }
}

renameImages().catch(err => {
    console.error('Rename failed:', err);
    process.exit(1);
});
