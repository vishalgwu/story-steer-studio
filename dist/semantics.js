let worker = null,
  serial = 0;
const pending = new Map();
export function semanticNeighbours(word, candidates) {
  if (!worker) {
    worker = new Worker(new URL("./semantics-worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(e.data.id);
      if (e.data.error) p.reject(Error(e.data.error));
      else p.resolve(e.data.result);
    };
    worker.onerror = () => {
      for (const p of pending.values()) {
        clearTimeout(p.timer);
        p.reject(Error("The local embedding model could not load."));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(Error("Local semantic lookup timed out."));
    }, 45000);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, word, candidates });
  });
}
