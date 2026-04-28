#!/bin/bash

# Convert any HEIC/HEIF files to JPG (preserving EXIF)
node convert-heic.js

# Run image rename before compression
node rename-feed-images.js

# Compress images
node compress-feed-images.js

# Run Hugo build
hugo
