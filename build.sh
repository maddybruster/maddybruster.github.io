#!/bin/bash

# Run image rename before compression
node rename-feed-images.js

# Compress images
node compress-feed-images.js

# Run Hugo build
hugo build
