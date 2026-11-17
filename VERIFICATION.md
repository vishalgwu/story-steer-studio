# Verification

## UI repair, November 17

15 automated tests pass, including new cursor-branch preservation and six-option pace tests. Browser checks confirmed draggable cursor navigation from word 1 to word 8, keyboard Home/End navigation, generating from the selected word, restoring the original 176-word draft from Library, normal reverse multiline selection without accidental pins, inline × underline removal, Clear attention, and all six pace labels. The cursor has pointer capture, frame-synchronized movement, edge scrolling and eased snapping. Pinning now uses Alt-drag or an explicit inspector action so it cannot intercept ordinary text selection.

Validated locally in the Codex in-app browser and with Node's built-in test runner.

## Automated

13 passing tests cover exact attention phrases and weights, pin percentages, vector payloads, dynamic character names, realization-score independence, split UTF-8/CRLF SSE parsing, usage events, streamed errors, 401/429 detail preservation, abort handling, independent checker payloads, prefix preservation, endpoint validation, and safe import round-trips.

`npm run check` validates JavaScript syntax. All static modules are served with the correct MIME type by the development server.

## Browser evidence

- Full-screen black story canvas, monospace text, line numbers, rail weights and bars; setup remains a modal behind one gear.
- Five-option inline menu and draggable polar dials. Label clicks, keyboard strength adjustment, collapse and reopening were exercised.
- Drag-selecting `hidden clearing,` created an attention box.
- Dragging `forest` upward created an 82% pin.
- A word lookup measured `forest` → `trees` 75%, `woodland` 70%, `leaf` 56% using MiniLM embeddings in a background worker. These are actual cosine similarities over the candidate vocabulary.
- Selecting a semantic neighbour added a pin.
- The real WebLLM model loaded and generated prose without an API key. Provider token usage and first-token latency populated the status bar. Performance varies by device and warm/cold loading.
- A real second model call returned an independent structured tone assessment and explanation. Target strength 80% was distinct from the assessed score; target percentages were not supplied to the checker. Judgment quality depends on model size.
- Stop preserved the text already written and restored the controls.
- A development-only HTTP fixture returned 401; the UI retained the exact status/detail and streamed a clearly labeled offline fallback paragraph.
- Captured fixture requests demonstrated a live restart: tone changed from 95% to 90%, the completed sentence was carried as the partial paragraph, and the follow-up request retained the exact attention phrase plus `forest (82%)` and `trees (75%)`.
- The branch scrubber initiated replacement generation; earlier drafts remained in Library. Restore returned the selected version.
- Reload restored the story and steering from localStorage.
- Narrow-screen inspection found and resolved an overflowing SVG. Dial placement clamps to viewport boundaries.

The local transport fixture is under `tests/` and is not part of `dist/` or the default app. Live Hugging Face and Ollama inference have not been exercised with user credentials or a running local Ollama model. Their transport follows documented OpenAI-compatible interfaces; quota, CORS, browser local-network policy and account permissions remain deployment-specific.

This is prompt-level steering. Rail bars are labeled relevance estimates rather than hidden model-attention measurements. Model checker scores are estimates, not calibrated probabilities.
