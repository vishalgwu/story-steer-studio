// Development-only transport fixture. Never included in dist or used by default.
import http from "node:http";
let requests = [];
http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:4173");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(requests));
      return;
    }
    let raw = "";
    for await (const part of req) raw += part;
    const body = JSON.parse(raw);
    requests.push(body);
    requests = requests.slice(-20);
    if (body.model === "fail-401" || body.model === "fail-429") {
      res.writeHead(body.model === "fail-401" ? 401 : 429, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify({
          error: {
            message:
              "Test fixture: invalid credential or exhausted daily quota.",
          },
        }),
      );
      return;
    }
    if (body.messages[0].content.includes("Independently assess")) {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  scores: [
                    {
                      kind: "tone",
                      label: "tender",
                      score: 47,
                      evidence: "Fixture assessment: a gentle hand.",
                    },
                    {
                      kind: "focus",
                      label: "narrator",
                      score: 36,
                      evidence: "Fixture assessment: environment detail.",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      );
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    let closed = false;
    res.on("close", () => (closed = true));
    const content =
      "A gentle hand brushed the old forest gate. The clearing answered with a silver glow. Beyond the trees, an unfamiliar voice whispered a name. Each step carried the traveler closer to the hidden history of this place.";
    for (const text of content.match(/\S+\s*/g)) {
      if (closed) break;
      res.write(
        "data: " +
          JSON.stringify({ choices: [{ delta: { content: text } }] }) +
          "\n\n",
      );
      await new Promise((r) => setTimeout(r, 180));
    }
    if (!closed) {
      res.write(
        "data: " +
          JSON.stringify({ choices: [], usage: { completion_tokens: 45 } }) +
          "\n\ndata: [DONE]\n\n",
      );
      res.end();
    }
  })
  .listen(4180, "127.0.0.1", () =>
    console.log(
      "Development-only fixture: http://127.0.0.1:4180/v1/chat/completions",
    ),
  );
