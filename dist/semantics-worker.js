let extractorPromise;
const cache = new Map();
self.onmessage = async ({ data }) => {
  try {
    if (!extractorPromise)
      extractorPromise =
        import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js")
          .then(({ pipeline, env }) => {
            env.allowLocalModels = false;
            return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
              dtype: "q8",
              device: "wasm",
            });
          })
          .catch((e) => {
            extractorPromise = null;
            throw e;
          });
    const extractor = await extractorPromise;
    const candidates = [
      ...new Set(
        data.candidates
          .map((w) => String(w).toLowerCase())
          .filter((w) => w !== data.word.toLowerCase()),
      ),
    ].slice(0, 180);
    const strings = [data.word.toLowerCase(), ...candidates];
    const missing = strings.filter((s) => !cache.has(s));
    if (missing.length) {
      const tensor = await extractor(missing, {
        pooling: "mean",
        normalize: true,
      });
      const rows = tensor.tolist();
      missing.forEach((s, i) => cache.set(s, rows[i]));
    }
    const base = cache.get(strings[0]);
    const result = candidates
      .map((word) => ({
        word,
        similarity: Math.max(
          0,
          Math.min(
            100,
            Math.round(
              cache.get(word).reduce((sum, x, i) => sum + x * base[i], 0) * 100,
            ),
          ),
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    if (cache.size > 2500) cache.clear();
    self.postMessage({ id: data.id, result });
  } catch (e) {
    self.postMessage({ id: data.id, error: e.message });
  }
};
