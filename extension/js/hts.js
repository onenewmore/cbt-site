import { fetchJson } from './dom.js';

// Shared, cached access to the official USITC HTS search API.
const API = 'https://hts.usitc.gov/reststop/search?keyword=';
const cache = new Map();

export async function htsSearch(keyword) {
  if (cache.has(keyword)) return cache.get(keyword);
  const data = await fetchJson(API + encodeURIComponent(keyword), { timeout: 15000 });
  const list = Array.isArray(data) ? data : (data && data.results) || [];
  cache.set(keyword, list);
  return list;
}

export const htsLink = (code) => `https://hts.usitc.gov/search?query=${encodeURIComponent(code)}`;
export const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
