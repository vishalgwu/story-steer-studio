import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultStory,
  defaultConfig,
  buildMessages,
  optionsFor,
  heuristicScores,
  safeStory,
  completedPrefix,
  parseJSON,
  branchAt,
} from "../dist/core.js";
test("cursor branching keeps the prefix and preserves the original draft", () => {
  const s = defaultStory(),
    p = s.paragraphs[0];
  s.paragraphs.push({ id: "future", text: "Unwritten future.", scores: [] });
  s.boxes = [
    { pid: p.id, start: 0, end: 5, text: "There", weight: 2 },
    { pid: "future", start: 0, end: 9, text: "Unwritten", weight: 2 },
  ];
  const branched = branchAt(s, { pid: p.id, offset: 25 });
  assert.equal(branched.paragraphs.length, 1);
  assert.equal(branched.paragraphs[0].text, p.text.slice(0, 25).trimEnd());
  assert.equal(branched.boxes.length, 1);
  assert.equal(s.paragraphs.length, 2);
  assert.equal(s.paragraphs[0].text, p.text);
});
test("pace offers six distinct directions that reach the prompt", () => {
  const options = optionsFor("pace", "");
  assert.equal(options.length, 6);
  assert.ok(options.includes("urgent"));
  assert.ok(options.includes("breakneck"));
  const s = defaultStory();
  s.vectors = [{ kind: "pace", label: "flowing", strength: 70 }];
  assert.match(
    buildMessages(s, defaultConfig)[1].content,
    /pace: flowing \(70%\)/,
  );
});
import {
  parseSSE,
  streamModel,
  validateEndpoint,
  verifyParagraph,
} from "../dist/providers.js";
test("exact selected text, pin strengths and all vector strengths reach the model", () => {
  const s = defaultStory();
  s.boxes = [{ text: "hidden clearing", weight: 2.51 }];
  s.pins = [{ word: "forest", strength: 85 }];
  s.vectors = [{ kind: "tone", label: "tender", strength: 79 }];
  const body = JSON.parse(buildMessages(s, defaultConfig)[1].content);
  assert.deepEqual(body.steering.attention, [
    { exact_text: "hidden clearing", weight: 2.51 },
  ]);
  assert.equal(body.steering.pins[0], "forest (85%)");
  assert.equal(body.steering.vectors[0], "tone: tender (79%)");
});
test("focus derives names from story instead of hardcoded characters", () => {
  const opts = optionsFor(
    "focus",
    "Mira met Joren. Mira followed Joren into the harbor.",
  );
  assert.ok(opts.includes("Mira"));
  assert.ok(opts.includes("Joren"));
  assert.ok(opts.includes("narrator"));
  assert.ok(!opts.includes("Elara"));
});
test("realized score is independent of requested strength", () => {
  const a = heuristicScores("A gentle hand held her with warm care.", [
    { kind: "tone", label: "tender", strength: 20 },
  ]);
  const b = heuristicScores("A gentle hand held her with warm care.", [
    { kind: "tone", label: "tender", strength: 99 },
  ]);
  assert.equal(a[0].score, b[0].score);
  assert.ok(a[0].score > 0);
  assert.equal(
    heuristicScores("The bus arrived.", [
      { kind: "tone", label: "tender", strength: 99 },
    ])[0].score,
    0,
  );
});
test("stream parser handles split UTF-8, CRLF, usage and a missing final newline", async () => {
  const data =
    'data: {"choices":[{"delta":{"content":"Forêt "}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"whispers."}}]}\n\ndata: {"choices":[],"usage":{"completion_tokens":4}}\n\ndata: [DONE]';
  const bytes = new TextEncoder().encode(data);
  let i = 0;
  const stream = new ReadableStream({
    pull(c) {
      if (i >= bytes.length) {
        c.close();
        return;
      }
      c.enqueue(bytes.slice(i, i + 7));
      i += 7;
    },
  });
  let out = "",
    usage;
  for await (const part of parseSSE(stream.getReader())) {
    out += part.text;
    if (part.usage) usage = part.usage;
  }
  assert.equal(out, "Forêt whispers.");
  assert.equal(usage.completion_tokens, 4);
});
test("provider preserves 401 and 429 details", async () => {
  const original = global.fetch;
  try {
    for (const status of [401, 429]) {
      global.fetch = async () =>
        new Response(
          JSON.stringify({ error: { message: "account quota detail" } }),
          { status },
        );
      await assert.rejects(
        async () => {
          for await (const c of streamModel(
            { ...defaultConfig, provider: "hf" },
            [],
            new AbortController().signal,
          )) {
          }
        },
        new RegExp(`HTTP ${status}.*account quota detail`),
      );
    }
  } finally {
    global.fetch = original;
  }
});
test("checker is a separate call without target percentages", async () => {
  const original = global.fetch;
  let body;
  try {
    global.fetch = async (_u, req) => {
      body = JSON.parse(req.body);
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  scores: [
                    {
                      kind: "tone",
                      label: "tender",
                      score: 42,
                      evidence: "Some warmth.",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    };
    const result = await verifyParagraph(
      { ...defaultConfig, provider: "hf" },
      "A hand reached out.",
      [{ kind: "tone", label: "tender", strength: 88 }],
      new AbortController().signal,
    );
    assert.equal(result[0].score, 42);
    assert.ok(!body.messages[1].content.includes("88"));
  } finally {
    global.fetch = original;
  }
});
test("abort cancels a live stream", async () => {
  const a = new AbortController();
  a.abort();
  const stream = new ReadableStream({
    start(c) {
      c.close();
    },
  });
  await assert.rejects(
    async () => {
      for await (const part of parseSSE(stream.getReader(), a.signal)) {
      }
    },
    { name: "AbortError" },
  );
});
test("imports cannot inject credentials or arbitrary settings", () => {
  const s = safeStory({
    title: "Imported",
    paragraphs: [{ text: "<img src=x onerror=alert(1)>" }],
    apiKey: "secret",
    vectors: [{ kind: "tone", label: "x" }],
  });
  assert.equal(s.apiKey, undefined);
  assert.equal(s.vectors.length, 0);
  assert.equal(s.paragraphs[0].text, "<img src=x onerror=alert(1)>");
  assert.throws(() => safeStory({ paragraphs: "bad" }));
});
test("live steering preserves complete sentences only", () => {
  assert.equal(
    completedPrefix("She opened the gate. Beyond it, a sha"),
    "She opened the gate. ",
  );
  assert.equal(completedPrefix("A partial sentence"), "");
});
test("endpoint validation rejects insecure remote URLs and embedded credentials", () => {
  assert.throws(() => validateEndpoint("http://remote.test/chat"));
  assert.throws(() => validateEndpoint("https://key:secret@example.com/chat"));
  assert.equal(
    validateEndpoint("http://localhost:11434/v1/chat/completions"),
    "http://localhost:11434/v1/chat/completions",
  );
});
test("structured model output accepts JSON fenced text", () => {
  assert.deepEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
});
test("import round-trip preserves valid attention anchors and steering", () => {
  const s = defaultStory();
  const p = s.paragraphs[0];
  s.boxes = [
    {
      id: "b",
      pid: p.id,
      start: 0,
      end: 5,
      text: "wrong cached text",
      weight: 2.51,
    },
  ];
  s.pins = [{ word: "forest", strength: 85 }];
  s.vectors = [{ kind: "tone", label: "tender", strength: 79 }];
  const imported = safeStory(JSON.parse(JSON.stringify(s)));
  assert.equal(imported.boxes[0].pid, imported.paragraphs[0].id);
  assert.equal(imported.boxes[0].text, p.text.slice(0, 5));
  assert.equal(imported.pins[0].strength, 85);
  assert.equal(imported.vectors[0].label, "tender");
});
test("streamed provider errors do not silently become an empty success", async () => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(
        new TextEncoder().encode(
          'data: {"error":{"message":"stream quota exceeded"}}\n\n',
        ),
      );
      c.close();
    },
  });
  await assert.rejects(async () => {
    for await (const part of parseSSE(stream.getReader())) {
    }
  }, /stream quota exceeded/);
});
