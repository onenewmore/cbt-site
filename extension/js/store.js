// Tiny storage wrapper: chrome.storage.local in the extension, localStorage elsewhere (dev/test).
const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export async function get(key, def) {
  try {
    if (hasChrome) {
      const r = await chrome.storage.local.get(key);
      return r[key] === undefined ? def : r[key];
    }
    const v = localStorage.getItem('cbt_' + key);
    return v == null ? def : JSON.parse(v);
  } catch {
    return def;
  }
}

export async function set(key, val) {
  try {
    if (hasChrome) await chrome.storage.local.set({ [key]: val });
    else localStorage.setItem('cbt_' + key, JSON.stringify(val));
  } catch { /* ignore */ }
}
