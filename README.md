# Precinct 84: Case I — *Blue Velvet* (Anna OS `xterm.js` Edition)

An illustrated Sierra-style EGA/VGA half-block detective and beat-cop parser game packaged as an Anna OS `static-spa` application (`required_executas: []`) running inside a locally bundled `xterm.js` terminal session.

## Architecture & Packaging

- **Pure Static-SPA Manifest (`manifest.json`, `app.json`):** Configured for Anna OS with `format: "static-spa"`, `required_executas: []`, `external_origins: []`, and `csp_overrides: {}`.
- **Vendored `xterm.js` (`bundle/vendor/`):** Built locally via `esbuild` from `@xterm/xterm` (`Terminal`) and `@xterm/addon-fit` (`FitAddon`) into `bundle/vendor/xterm.bundle.js` and `bundle/vendor/xterm.css` so strict CSP allows zero external CDN requests.
- **Code-Drawn `480x270` SVGA Canvas + `96x96` Expressive Portraits (`bundle/gfx/`):** Above the `xterm.js` log console sits a proportional `16:9` SVGA canvas featuring articulated anatomical actors, `96x96` talking-head facial portraits with mood expressions, weather/lighting compositors, and a custom Neo-Noir Cover splash (`bundle/assets/title-noir.jpg`) on the startup selector.
- **300+ Asset Catalog (`bundle/assets/`):** Comprises `163` scene definitions (`precinct`, streets, apartments, bedrooms, penthouses, garages, docks), `60` expressive character profiles, `40` procedural looping AdLib/Web Audio BGM tracks (`[F3]` toggle) plus a dedicated Main Menu cop synth theme (`bgm_main_menu_cop_theme`, excluded from LLM asset rolls), and `45` synthesized SFX cues (`[F2]` toggle).
- **Verified Dual-Layer Saves + Story Vault (`bundle/storage.js`, `storage-kv.js`):** Writes synchronously to `localStorage` and retries + read-back verifies Anna APS KV (`rt.storage`), heals stale cloud copies automatically, backs up compiled AI blueprints in a dedicated Story Vault so zero credits are wasted on transient disconnects, and displays live sync status in the header badge.
- **Cross-Tier Parity (`Tier 1`, `Tier 2`, `Tier 3`):**
  - **Optional Story Theme (`Theme:` input):** Accepts an optional user thematic suggestion (sanitized & capped to 80 chars) woven cleanly into **Tier 1** (`Ask Claire`/interrogations/Case II), **Tier 2** dramatizations, and **Tier 3** AI episodes + Story Bible.
  - **Tier 1 (Co-Pilot):** Authored Case I + `"Ask Claire"` hints + Case II AI sequel on victory (`Gen` mode applies once unlocked).
  - **Tier 2 (Intermissions):** Authored Case I + AI between-calls dramatizations using unique rolled asset pools, honoring `Gen: 1-by-1` (compiles each act transition on demand) vs `Gen: Full 3-Act` (upfront bundle) + Story Bible continuity.
  - **Tier 3 (Full AI Director):** 100% AI campaign from Turn 1, honoring `Gen: Ch x Ch` (1-call episodic Ch.1 + `+1 Ch` continuation) vs `Gen: Full Case` (Outline + 3 chapters upfront).
- **Free Gendered TTS & Auto-Play (`bundle/audio/tts-speaker.js`, `bundle/engine/auto-player.js`):** Uses zero-credit browser `speechSynthesis` with male/female voice assignment across all 60 characters, non-cutting sentence queue (`Pause` / `Resume` finishes the active sentence before holding), and **Auto-Play** (`Auto: Seq` zero-LLM sequential option cycling vs `Auto: AI` LLM-guided choices) across all 3 tiers.
- **Persistent Story Library + JSON Export/Import (`bundle/storage-library.js`, `story-modal.js`):** Archives every compiled Tier 2 & Tier 3 story across APS KV and `localStorage` (`Stories` button), with Export JSON, file/paste Import JSON, and **`+1 Ch`** continuation from any saved/imported Tier 3 JSON via `Story Bible` continuity (`bundle/engine/story-bible.js`).
- **Live LLM Progress & Demo Verbose Error Diagnostics (`bundle/engine/anna-ai.js`, `app.js`):** Displays streaming progress (`stage`, model, elapsed seconds, chars received) in both the top status bar and `<canvas>` overlay, and surfaces full diagnostic error traces (`DEMO_VERBOSE_ERRORS = true`) directly in `#error-panel` and the case log.
- **Interactive `xterm.js` Session (`bundle/ui/xterm-session.js`):** Renders the truecolor (`▀`) high-res EGA framebuffer, handles alternate screen mode (`\x1b[?1049h`), SGR mouse & scaled pointer clicks on toolbar/chip hitboxes, `Tab` completion, command history (`Up`/`Down`), and `F1`/`F2`/`F5`/`F9`/`Esc` hotkeys.
- **Web Audio API Synth (`bundle/engine/audio.js`):** Procedurally synthesizes 22.05 kHz mono PCM cues (`siren`, `squelch`, `tick`, `cuff`, `shot`, `hazard`, `point`, `gameover`, `victory`) directly through `AudioContext`.
- **Anna APS KV Saves (`bundle/storage.js`, `bundle/game/state.js`):** Persists save slots (`quicksave`, `save <slot>`, `restore <slot>`, `save and quit`) to Anna APS KV (`rt.storage.get` / `rt.storage.set` / `rt.storage.delete`) with automatic `localStorage` fallback in standalone mode.
- **Responsive Mobile & Touch Dock (`bundle/index.html`, `bundle/styles.css`, `bundle/app.js`):** Adapts to `window.visualViewport` resize events and provides clickable command chips and a quick-entry prompt below the `xterm.js` stage.

## Build, Validate & Run Locally

```bash
cd /workspace/precinct-84-anna
npm run build:vendor         # Re-bundle local xterm.js & xterm.css via esbuild
anna-app validate --strict   # Validate Anna manifest, CSP & bundle rules
anna-app dev                 # Launch local Anna OS harness
npm run test:e2e             # Run full E2E test suite
```

To stage or publish to your Anna developer account later:

```bash
cd /workspace/precinct-84-anna
anna-app publish             # Push working draft & cut v0.1.0 (stays in DRAFT)
```
