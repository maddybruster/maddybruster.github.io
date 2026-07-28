# maddybruster.github.io

Hugo site source.

## Life photo pipeline

Photos dropped into `content/life/` (including `.HEIC`/`.HEIF` straight from
an iPhone) go through a few Node scripts before the Hugo build. Run them from
the repo root, in this order:

```sh
node convert-heic.js          # HEIC/HEIF -> JPG, preserving EXIF
node rename-feed-images.js    # rename to YY-MM-DD(-N).ext based on EXIF date
node compress-feed-images.js  # resize to max 1200px, compress to JPG q80
```

Or just run the whole thing with:

```sh
./build.sh
```

which runs all three scripts and then `hugo build`.

Notes:
- `compress-feed-images.js` tracks completed files in
  `content/life/.compression-mark` so re-running it only processes new
  images. Don't delete that file unless you want everything recompressed.
- `compress-feed-images.js` also does its own HEIC→JPG conversion and
  EXIF-based renaming as a fallback, so it's safe to run on its own if you
  skip the first two steps.
- These same three steps are wired up as VS Code tasks in
  `.vscode/tasks.json` (used by the "hugo build"/"hugo server" tasks).
