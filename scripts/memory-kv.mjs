// In-memory stand-in for a Cloudflare KV namespace (get / put / delete / list with TTL). Used by tests and the local dev server.
export class MemoryKV {
  constructor(clock = () => Date.now()) { this.m = new Map(); this.clock = clock; }
  _live(k) {
    const e = this.m.get(k);
    if (!e) return null;
    if (e.exp && e.exp <= this.clock()) { this.m.delete(k); return null; }
    return e;
  }
  async get(key, type) {
    const e = this._live(key);
    if (!e) return null;
    return type === 'json' ? JSON.parse(e.v) : e.v;
  }
  async put(key, value, opts = {}) {
    let exp = 0;
    if (opts.expirationTtl) exp = this.clock() + opts.expirationTtl * 1000;
    else if (opts.expiration) exp = opts.expiration * 1000;
    this.m.set(key, { v: String(value), exp });
  }
  async delete(key) { this.m.delete(key); }
  async list({ prefix = '', cursor, limit = 1000 } = {}) {
    const keys = [...this.m.keys()].filter((k) => k.startsWith(prefix) && this._live(k)).sort();
    const start = cursor ? keys.findIndex((k) => k > cursor) : 0;
    const slice = start < 0 ? [] : keys.slice(start, start + limit);
    const done = start < 0 || start + limit >= keys.length;
    return { keys: slice.map((name) => ({ name })), list_complete: done, cursor: done ? undefined : slice[slice.length - 1] };
  }
}
