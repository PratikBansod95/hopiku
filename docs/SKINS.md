# Panda skin assets

Each unlockable skin uses **fully illustrated PNG sprites** (not recolors):

```
public/assets/images/skins/
  panda-ninja.png          panda-dead-ninja.png
  panda-cloud.png          panda-dead-cloud.png
  panda-summit.png         panda-dead-summit.png
  panda-golden.png         panda-dead-golden.png
```

Classic Panda uses the base `panda.png` / `panda-dead.png`.

## Regenerating skins

1. Place new source art in `assets/` as `panda-{skin}-gen.png` and `panda-dead-{skin}-gen.png` (bright green `#00FF00` background).
2. Run:

```bash
npm run import:skins
```

This chroma-keys, crops, and writes processed sprites into `public/assets/images/skins/`.

The legacy overlay script `npm run generate:skins` remains for quick prototypes from the base panda only.
