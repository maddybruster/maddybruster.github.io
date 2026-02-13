#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const feedDir = path.join(__dirname, 'content', 'feed');

// Pattern to match already renamed files (YY-MM-DD format)
const renamedPattern = /^\d{2}-\d{2}-\d{2}(-\d+)?\.[a-zA-Z0-9]+$/;

function formatDate(date) {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renameImages() {
    if (!fs.existsSync(feedDir)) {
        console.log('Feed directory not found, skipping rename');
        return;
    }

    const files = fs.readdirSync(feedDir);
    const dateMap = {}; // Track how many files per date
    
    files.forEach(file => {
        const filePath = path.join(feedDir, file);
        const stat = fs.statSync(filePath);
        
        // Skip directories and already renamed files
        if (stat.isDirectory() || renamedPattern.test(file)) {
            return;
        }
        
        // Skip _index.md and other non-image files
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            return;
        }

        // Get modification date
        const modDate = new Date(stat.mtimeMs);
        const dateStr = formatDate(modDate);
        
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
            return;
        }
        
        // Rename the file
        fs.renameSync(filePath, newPath);
        console.log(`✓ Renamed: ${file} → ${newName}`);
    });
}

renameImages();
