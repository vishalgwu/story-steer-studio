# Story Steer Studio

A browser-only storytelling workspace inspired by the supplied video. Black canvas, white monospace story, attention rail, inline word inspector and text-anchored polar steering. No login, database, build step, or application server is required.

## Run

Requires Node.js 20+ for the optional development server and automated tests.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Or serve `dist/` using any static host. JavaScript modules and model workers require HTTP(S); opening the HTML with `file://` is unsupported.

## Real AI, without an API key

The default writing engine is **Browser AI**, powered by WebLLM. Press Generate next or open ⚙ → Connection → Load browser model. A lightweight Qwen instruction model is selected from the installed WebLLM model catalog, with a Llama fallback if unavailable. The first load downloads hundreds of MB, then the browser caches the model. Inference runs on the visitor's GPU. WebGPU support, available memory, and model-download connectivity are required. Small local models have weaker prose and steering fidelity than larger hosted models.

No inference credentials are bundled with this app. Model availability is not a promise of unlimited hosted inference. The offline engine is explicitly labeled **not AI** and is only a fallback or an intentional interface-testing mode.

## Other live engines

- **Hugging Face**: choose the preset, paste your own token with Inference Providers access, and select a supported model ID. Default endpoint: `https://router.huggingface.co/v1/chat/completions`. Model availability, billing and quota depend on the account/provider. An open model does not imply free hosted compute.
- **Ollama**: install Ollama separately, pull a model (default preset `llama3.2`), then run it with `OLLAMA_ORIGINS` set to the exact site origin. For local development, that origin is `http://127.0.0.1:4173`. Restart Ollama after setting the environment variable. Local-network browser permissions or HTTPS mixed-content restrictions may affect access from a deployed site. No token is needed for local Ollama.
- **Custom**: enter a complete browser-accessible OpenAI-compatible `/v1/chat/completions` endpoint, model ID, and optional key. Its CORS policy must allow the site origin. Remote endpoints must use HTTPS.

Keys are stored only in localStorage and sent only to the configured endpoint. They are excluded from exports and snapshots. Do not use a shared browser profile for a sensitive provider key. Clear a saved key by removing it from Setup and saving.

## Interactions

1. Generate a paragraph. Stop preserves written text.
2. Select words to create an attention box. The **exact text and numeric weight** are included in the next model request. Click its rail bracket or any underlined word to adjust weight. Click the inline × to remove that underline, or Clear attention to remove all boxes. Drag the bracket to a different story line to move its attention anchor.
3. Alt-drag a word upward to pin it (or click the word and choose Pin). Normal dragging always selects text. Distance sets 20–100% strength. The prompt carries `word (85%)` style constraints. Click a pin point to adjust or remove it.
4. Click a word to open its inspector directly below it. Three model-generated directions continue the story when clicked. Semantic neighbours can be measured locally using an ONNX MiniLM embedding model in a Web Worker. Cosine scores compare a bounded vocabulary; they are not probabilities or exhaustive nearest words. If model/embedding loading fails, fallback suggestions are explicitly identified as estimates.
5. Drag the ⊕ cursor backward or forward to a word. Later text dims but remains available until you generate; Generate next branches from that point and saves the previous version in Library. Arrow keys move through words, Home/End jump, and Return cursor to end restores the end position.
6. Open ⊕ Steer for exactly five dimensions: tension, pace, tone, focus and resolution. Angle chooses the label; radius sets strength. Tone offers airy, tender, somber and wondrous. Focus names are extracted from the current story plus narrator. Dials collapse into labeled red points connected to the story cursor.
7. Steer during generation: on committing changed controls, the current request is canceled; complete sentences are preserved, and the unfinished suffix is generated again with the new constraints. Existing HTTP streams cannot change their instructions in place. This is prompt-level incremental steering, not activation-level control of model internals.
8. Enable the branch scrubber in ⚙ → Story. Releasing it generates a fresh alternative to the last paragraph. Earlier versions remain in Library.

Setup contains the premise, starting text, engine, local library, JSON import/export, text download and scrubber setting. Ctrl/⌘ + Enter generates. Escape stops or dismisses the active control. Dials support arrow keys, + and −.

## Attention and verification: honest measurements

- Rail bars and weights are local relevance estimates derived from selected text, pinned terms and recent context. They are **not neural attention tensors**, nor a prediction guaranteed to describe future events.
- Local realized scores use lexical evidence in **only the new paragraph**, independent of requested strength. They can miss synonyms and subtle style.
- Enable the second model checker in Setup for an independent assessment. Its request withholds target percentages, preventing a trivial copy of requested strength. Each label exposes its method and evidence. Model judgments are still estimates.
- Stream metrics report time to first content, tokens/s and actual provider usage when supplied; otherwise token counts are explicitly marked estimated.
- Provider errors retain the HTTP status and message, including 401 and 429. A failed paragraph falls back to a labeled template engine. Stop, empty responses, split stream chunks and malformed checker JSON have explicit handling.

## Deploy

### Any static host / Vercel

Serve `dist/` as the output directory. There is no build command and no installation step. On Vercel choose **Other**, leave the build command empty and set Output Directory to `dist`. A `vercel.json` is included. Browser AI lets visitors generate without bringing an API key, subject to their hardware. BYOK engines remain available in Setup.

### Shared Hugging Face token in environment variables

A static browser app **cannot keep a shared `.env` secret private**. Never place a provider secret in public JavaScript, `VITE_*`, or static assets. To support a shared hosted token, add a separate server-side streaming endpoint with access controls, rate limiting and spending caps, keep the token in that endpoint's environment, and select the endpoint in Setup. This optional backend is not bundled because this version honors the no-server requirement. No `.env` file is needed for this app.

## Development and validation

```sh
npm run check
npm test
```

Tests cover exact steering payloads, story-derived characters, checker independence, split UTF-8 streams, 401/429 messages, cancellation, endpoint validation, import boundaries and prefix preservation. Browser testing covers the canvas, dials, selection, drag-to-pin, Stop, saved state and real no-key browser-model generation.

The application has no runtime npm dependencies. WebLLM and Transformers.js are version-pinned remote modules and load only when used; model assets come from their published model repositories. Fonts have system monospace fallbacks. Static UI and the template engine work if remote libraries cannot load. Library data remains in the current browser, with up to 60 snapshots; export important work.

## Sources

- [WebLLM streaming](https://webllm.mlc.ai/docs/user/basic_usage.html)
- [Hugging Face chat completions](https://huggingface.co/docs/inference-providers/tasks/chat-completion)
- [Ollama OpenAI compatibility](https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx)
- [Transformers.js feature extraction](https://huggingface.co/docs/transformers.js/v3.8.1/en/api/pipelines)

Pace now offers lingering, measured, flowing, brisk, urgent and breakneck. The cursor uses frame-synchronized dragging, edge auto-scroll and a smooth snap to the nearest word. Reduced-motion preferences are respected.
