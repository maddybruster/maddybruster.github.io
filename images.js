const imageFiles = [
    '2.png',
    '5.png',
    '6.png',
    '65922278446__F2A6F6F9-0B44-449C-BC92-15C9C3E0624E.JPG',
    'Endzone-Hillside-3.jpg',
    'FmSYPxNXkAQl3t6.jpg',
    'IA_001.JPEG',
    'IA_003.gif',
    'PW_001.png',
    'PW_002.gif',
    'PW_003.png',
    'VAI_001.png',
    'VAI_002.gif',
    'VAI_003.png',
    'VAI_004.png',
    'brick-layer-Maddy!.png',
    'brick_1.png',
    'cereal-bowl.png',
    'dimepiece.co_(Mac).png',
    'idea for a piece_71.png',
    'powderhouse.png',
    'sj_001.png',
    'sj_002.gif',
    'strawberry-rhombus-lnmx.squarespace.com_(MacBook Air).png'
];

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load images after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('gallery');
    const shuffledImages = shuffleArray([...imageFiles]);
    
    shuffledImages.forEach(file => {
        const img = document.createElement('img');
        img.src = `_assets/${file}`;
        img.alt = file;
        
        // Check if image is vertical when it loads
        img.onload = function() {
            if (this.height > this.width) {
                this.style.width = '50vw';
            } else {
                this.style.width = '75vw';
            }
        };
        
        gallery.appendChild(img);
    });
});