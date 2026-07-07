# VibeDrama

A vertical short-drama app (ReelShort/DramaBox style) built with Expo + React Native, with an
AI pipeline that generates new drama episodes automatically.

## App

- **For You** — TikTok-style vertical swipe feed of episodes
- **Discover** — series catalog grid
- **Series page** — episode grid with lock states, resume watching
- **Coin paywall** — first 3 episodes free, then coins to unlock (purchases simulated)
- **Profile** — coin balance, sign in (local mock auth)

Episodes come in two flavors:
- **Video episodes** — bundled demo series using sample mp4s
- **AI motion-comic episodes** — generated scenes (image + voiceover + captions) fetched from a remote catalog

### Run (development build)

```bash
npm install --legacy-peer-deps
npx expo run:ios      # or: npx expo run:android
```

### TestFlight

```bash
eas build --platform ios --profile production --auto-submit
```

## AI episode generator

`generator/` produces episodes into `content/`:

1. **Script** — Claude (`claude-opus-4-8`) writes series concepts + episode scripts as structured JSON
   (scenes with narration, on-screen caption, and image prompt)
2. **Images** — OpenAI `gpt-image-1` per scene (falls back to placeholder photos without a key)
3. **Voiceover** — OpenAI TTS per scene (skipped without a key; scenes show silently)
4. Output — `content/catalog.json` + per-scene assets, consumed by the app at runtime

### Run locally

```bash
cd generator
npm install
ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... node src/index.ts --episodes 1
```

Both keys are optional — without them the pipeline still runs end-to-end using template
scripts and placeholder images, which is useful for testing.

## Making it fully automatic

1. Push this repo to GitHub.
2. In the repo settings → Secrets and variables → Actions, add:
   - `ANTHROPIC_API_KEY` (required for real AI scripts)
   - `OPENAI_API_KEY` (optional, for real images + voiceover)
3. The included workflow (`.github/workflows/generate.yml`) runs **daily at 09:00 UTC**,
   generates one new episode, and commits it to `content/`.
4. Point the app at the hosted content by setting `expo.extra.contentBaseUrl` in `app.json`:

   ```json
   "contentBaseUrl": "https://raw.githubusercontent.com/<your-username>/<repo>/main/content"
   ```

5. Rebuild the app once. From then on it picks up every new episode automatically on launch
   (with an AsyncStorage cache for offline startup).

### Costs (approx.)

- Script per episode: a few cents (Claude Opus 4.8, ~1–2K output tokens)
- Images: ~7 scenes/episode via gpt-image-1 — tens of cents per episode depending on quality setting
- TTS: ~1 minute of audio per episode — about a cent

One episode per day lands around **$5–15/month** with real images, or near-free in placeholder mode.
