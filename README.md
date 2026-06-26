# Hopiku

**Hop Higher. Dream Bigger.**

Phase 1 MVP — a one-tap vertical bamboo stacker built for **YouTube Playables** (mobile web, touch-first, SFX + haptics).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

The YouTube Playables SDK runs as a no-op locally. Use the [YouTube Playables test suite](https://developers.google.com/youtube/gaming/playables) before submitting.

## Build for YouTube Playables upload

```bash
npm run build:playable
```

This creates `playable-package/` with `index.html` at the root. Zip **the contents** of that folder (not the folder itself):

```powershell
Compress-Archive -Path "playable-package\*" -DestinationPath "hopiku-playable.zip" -Force
```

Upload the zip to the YouTube Playables developer portal.

### YouTube integration included

| Requirement | Implementation |
|-------------|----------------|
| SDK loaded first | `https://www.youtube.com/game_api/v1` in `index.html` |
| `firstFrameReady()` | Called when loading screen shows |
| `gameReady()` | Called when start screen is interactable |
| `onPause` / `onResume` | Pauses game loop + shows pause UI |
| Audio mute | Respects `ytgame.system.isAudioEnabled()` |
| Cloud save | `loadData` / `saveData` for high score in Playables env |
| `sendScore` | Syncs best score to YouTube |

### Bundle size notes

YouTube recommends initial load under **30 MiB** (ideally 15 MiB) and individual files under **512 KiB**. Background PNGs are large — compress to WebP or lower resolution before final certification if needed.

## Biome progression

Backgrounds change every **18 logs** climbed:

| Logs | Zone |
|------|------|
| 0–17 | Bamboo Grove |
| 18–35 | Misty Peaks |
| 36–53 | Cloud Realm |
| 54+ | Sacred Summit |

Replace biome art in `public/assets/images/`:

- `background.png`, `background-mist.png`, `background-clouds.png`, `background-summit.png`

## Replace placeholder art

Drop your files into `public/assets/images/` using the same names:

- `background.png`
- `panda.png`
- `panda-dead.png`
- `bamboo-platform.png`
- `bamboo-stump.png`

Use **PNG with real alpha** (not green screen) for sprites to avoid chroma-key artifacts.

## Game controls

- **Tap canvas** — start / jump / restart after game over
- **Pause** — top-left during play
- **Home / Restart / Share** — game over screen

High score is saved via YouTube cloud save in Playables, or `localStorage` (`hopiku-save`) when running locally.
