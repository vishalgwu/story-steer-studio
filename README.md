# Story Steer Studio

**A real-time AI storytelling workspace where the story is the interface.**

Generate a story, select the words that matter, and steer what happens next using text-anchored controls. Move the story cursor to explore a different continuation while keeping previous drafts in your local library.

[Open the live app](https://story-steer-studio-visha.vishalfulsundar2024.chatgpt.site/) · [Verification notes](VERIFICATION.md)

## What you can do

- **Write live:** stream a continuation with Generate next, stop it at any time, or rewrite the last paragraph.
- **Choose where to continue:** drag the ⊕ cursor backward or forward through the story. Future text dims until you generate a new branch; the previous draft stays in Library.
- **Direct attention:** select a phrase to send its exact text and weight with the next generation request. Remove the underline with its inline × or Clear attention.
- **Pin concepts:** Alt-drag a word upward to set its strength, or open its word inspector and choose Pin.
- **Shape the narrative:** adjust polar dials for tension, pace, tone, focus, and resolution. Closed dials become editable points below the story.
- **Explore meaning:** inspect semantic neighbours and choose from three suggested directions for the next continuation.
- **Check steering:** review realized scores and supporting explanations beside generated text.
- **Explore alternatives:** enable the branch scrubber in Setup to generate fresh versions of the last paragraph.
- **Keep your work:** save snapshots, restore earlier drafts, import/export JSON, or download plain text.

The workspace uses a black canvas, white monospace text, a compact relevance rail, and inline controls. Connection settings and the library stay behind **⚙ Setup**.

### Steering controls

| Dimension | Options |
| --- | --- |
| Tension | Relaxed, strained |
| Pace | Lingering, measured, flowing, brisk, urgent, breakneck |
| Tone | Airy, tender, somber, wondrous |
| Focus | Character names extracted from the current story, plus narrator |
| Resolution | Open-ended, resolved |

A dial's angle selects the quality; its radius sets the strength. Attention phrases, pins, and vector strengths are included in the model request.

## Quick start

### Use the hosted app

1. Open the [live app](https://story-steer-studio-visha.vishalfulsundar2024.chatgpt.site/).
2. Choose an engine in **⚙ → Connection**. Browser AI is the default and needs no API key.
3. Generate a paragraph, select words or set a steering dial, then generate again.

Browser AI downloads model files on first use. It requires WebGPU, sufficient GPU memory, and access to the model download hosts. Performance varies by device.

### Run locally

Install Node.js 20 or newer, then:

```sh
git clone https://github.com/vishalgwu/story-steer-studio.git
cd story-steer-studio
npm run dev
```

Open **http://127.0.0.1:4173**.

There is no build step or npm dependency installation required. The Node server is a local static-file server, not an inference backend. Serve the app over HTTP or HTTPS; opening `index.html` with `file://` is unsupported.

## Model connections

All engines are configured in **⚙ → Connection**.

| Engine | Where inference runs | Configuration |
| --- | --- | --- |
| Browser AI | Visitor's GPU through WebLLM | No API key; initial model download and WebGPU required |
| Hugging Face | Selected hosted inference provider | User-supplied token and supported model ID |
| Ollama | User's computer | Running local Ollama instance and an installed model |
| OpenAI-compatible endpoint | User-selected service | Chat completions URL, model ID, and optional API key |
| Offline draft | Browser template engine | No connection; explicitly labeled **not AI** |

### Browser AI

The app loads a lightweight Qwen instruction model from the version-pinned WebLLM catalog, with a supported Llama model as a fallback. Model files are cached by the browser after download. This version selects the browser model automatically; it does not yet include a browser-model picker.

Small local models provide a key-free option but may follow complex steering less reliably than larger hosted models.

### Hugging Face and compatible services

Use the Hugging Face preset or enter a complete OpenAI-compatible chat completions URL. Hosted model IDs are editable. Remote endpoints must use HTTPS and permit browser requests through CORS. Provider availability, token permissions, quotas, and charges apply; an open model does not imply free hosted compute.

### Ollama

Run Ollama separately, install a model matching the configured model ID, and allow the app's exact origin through `OLLAMA_ORIGINS`. The local preset uses `http://localhost:11434/v1/chat/completions` and `llama3.2`.

Restart Ollama after changing its environment settings. Local-network permissions and HTTPS-to-localhost restrictions depend on the browser. A visitor connects to their own Ollama instance, not the developer's computer.

## How live steering works

When you commit a steering change during generation, the app cancels the current request, preserves complete sentences, and regenerates the unfinished suffix using the updated controls.

This is **prompt-level incremental steering**. It does not modify an already-running HTTP request or directly manipulate a model's internal activations.

Dragging the story cursor selects a continuation point without immediately deleting later text. Generating from that point saves the previous version, keeps the selected prefix, and writes a new continuation.

## What the measurements mean

- **Rail bars and weights** estimate relevance to selected text, pinned terms, and recent context. They are not the model's internal neural attention or a guaranteed prediction of future events.
- **Semantic similarity** uses local MiniLM embeddings and cosine similarity over a bounded candidate vocabulary. Percentages are similarity scores, not probabilities. Estimated fallback suggestions are labeled.
- **Realized steering scores** assess the new paragraph. The independent model checker does not receive target percentages. If it fails, the app shows labeled local lexical heuristics, which can miss synonyms and subtle style.
- **Stream metrics** show first-content latency, generation speed, and provider-reported token usage when available. Otherwise, token counts are marked estimated.

Provider errors such as HTTP 401 or 429 retain their status and message. Failed generation falls back to a clearly labeled offline template paragraph. The offline engine is not presented as live AI.

## Privacy and storage

- API keys and connection settings stay in **localStorage in the current browser profile**.
- A configured key is sent only to the selected inference endpoint. Story text is sent to that provider when a hosted engine is used.
- Keys are excluded from story exports and saved story snapshots.
- Stories and up to 60 snapshots are stored locally. They do not automatically sync between devices or hosting domains.
- Browser AI and semantic lookup fetch libraries and model assets from external hosts; their inference runs on the device.

Export important drafts. Clearing browser storage can remove local stories and settings. Remove a saved API key in Setup and save to clear it. localStorage is accessible to scripts running on the same origin, so avoid saving sensitive keys in a shared browser profile.

## Deploy online

The app has **static hosting with dynamic browser behavior**. Hosting serves the files in `dist/`; streaming, steering, model loading, and local persistence run in the browser. No application server, database, or login system is bundled.

### Vercel

1. Import this GitHub repository into Vercel.
2. Select **Other** as the framework preset.
3. Set **Output Directory** to `dist`.
4. Leave the build command disabled and skip dependency installation.
5. Deploy.

The included `vercel.json` supplies the static output settings and basic response headers. Other HTTPS static hosts can serve the same `dist/` directory.

The existing live app uses ChatGPT Sites; moving to Vercel is optional. Visitors still need compatible hardware for Browser AI or their own hosted-model connection.

### Shared provider secrets

No `.env` file is required for the browser-only app. A static site cannot protect a shared provider secret: never embed one in public JavaScript, static assets, or client-exposed environment variables.

If you later want shared hosted inference for visitors, add a separate secured server endpoint with server-side secrets, access controls, rate limits, and spending limits. That backend is outside the current implementation.

Changing the hosting domain creates a different browser storage origin. Export drafts before moving and import them on the new domain.

## Keyboard and pointer controls

| Action | Control |
| --- | --- |
| Generate next | Ctrl/⌘ + Enter |
| Stop or dismiss the active control | Escape |
| Choose a continuation point | Drag ⊕ to a word |
| Navigate words with the cursor focused | Left/Right arrows; Home/End |
| Return to the story end | Return cursor to end, or double-click ⊕ |
| Select an attention phrase | Drag across text normally |
| Remove an attention phrase | Inline ×, or click its underline to edit/remove |
| Pin a word | Alt-drag upward, or word inspector → Pin |
| Change dial quality / strength | Arrow keys; + / − |

Cursor dragging includes edge scrolling and eased snapping. Reduced-motion preferences are respected.

## Development

```sh
npm run check
npm test
```

The suite includes 15 tests covering steering payloads, cursor branching, pace options, character extraction, stream parsing, error handling, cancellation, independent checking, imports, and prefix preservation. See [VERIFICATION.md](VERIFICATION.md) for browser validation and limitations.

```text
dist/
  index.html             Story canvas and setup overlay
  styles.css             Responsive layout and interaction styles
  app.js                 Editor, cursor, selection, dials, and history
  core.js                Story state, prompt construction, and scoring helpers
  providers.js           Streaming adapters and independent model checking
  semantics.js           Semantic worker client
  semantics-worker.js    Local embedding inference
tests/                   Automated tests and development-only HTTP fixture
server.mjs               Local static preview server
vercel.json              Static deployment configuration
```

WebLLM and Transformers.js load as version-pinned remote modules when needed. There are no runtime npm dependencies. The development HTTP fixture is not included in the deployed `dist/` output.

## Reference documentation

- [WebLLM](https://webllm.mlc.ai/docs/user/basic_usage.html)
- [Hugging Face chat completions](https://huggingface.co/docs/inference-providers/tasks/chat-completion)
- [Ollama OpenAI compatibility](https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx)
- [Transformers.js feature extraction](https://huggingface.co/docs/transformers.js/v3.8.1/en/api/pipelines)
