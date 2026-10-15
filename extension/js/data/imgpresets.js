// Marketplace image presets.
// These are REFERENCE values gathered from public seller guidelines and seller-community guides (as of 2026-10).
// Platforms change their rules often, so every value can be overridden by adding a custom preset in the tool.
//
// w/h  = output canvas in pixels          mb  = suggested file-size cap (decimal MB)
// min  = smallest recommended long side of the SOURCE picture (used for the "source too small" warning)

export const IMG_PRESETS_ASOF = '2026-10';

export const IMG_PLATFORMS = [
  {
    id: 'amazon', zh: '亚马逊 Amazon', en: 'Amazon',
    presets: [
      { id: 'amazon-2000', w: 2000, h: 2000, mb: 10, min: 1000, zh: '主图 / 副图（推荐）', en: 'Main / additional (recommended)',
        note: { zh: '主图需纯白背景（RGB 255），商品占画面 ≥85%；最长边 ≥1000px 才有放大镜，建议 2000px。', en: 'Main image: pure white (RGB 255) background, product ≥85% of the frame. ≥1000 px on the long side enables zoom; 2000 px recommended.' } },
      { id: 'amazon-1600', w: 1600, h: 1600, mb: 10, min: 1000, zh: '主图 / 副图（文件更小）', en: 'Main / additional (smaller files)',
        note: { zh: '靠近放大镜下限，文件更小，适合批量上传。', en: 'Close to the zoom threshold; smaller files for big batches.' } },
    ],
  },
  {
    id: 'walmart', zh: '沃尔玛 Walmart', en: 'Walmart',
    presets: [
      { id: 'walmart-2000', w: 2000, h: 2000, mb: 5, min: 1000, zh: '商品图（多数类目）', en: 'Product image (most categories)',
        note: { zh: '≥1000px 才有放大；主图建议白底、商品居中留约 5% 边距；不得含 Logo / 文字 / 水印。', en: '≥1000 px for zoom; white background recommended with ~5% margin; no logos, text or watermarks.' } },
      { id: 'walmart-fashion', w: 1500, h: 2000, mb: 5, min: 1500, zh: '服饰类目 · 3:4', en: 'Apparel · 3:4',
        note: { zh: '服饰类目要求 3:4，最小 1500×2000。', en: 'Apparel uses 3:4, minimum 1500×2000.' } },
    ],
  },
  {
    id: 'ebay', zh: 'eBay', en: 'eBay',
    presets: [
      { id: 'ebay-1600', w: 1600, h: 1600, mb: 12, min: 500, zh: '商品图', en: 'Listing photo',
        note: { zh: '最低 500px，建议最长边 ≥1600px 以启用放大；单张 ≤12MB。', en: 'Minimum 500 px; ≥1600 px on the long side enables zoom; ≤12 MB each.' } },
    ],
  },
  {
    id: 'temu', zh: 'Temu', en: 'Temu',
    presets: [
      { id: 'temu-1x1', w: 1600, h: 1600, mb: 3, min: 800, zh: '非服装 · 1:1', en: 'Non-apparel · 1:1',
        note: { zh: '非服装类目 1:1；Temu 也会自动补边（取四角底色），自己按尺寸出图更稳定。', en: 'Non-apparel is 1:1. Temu also auto-pads using the corner colour, but supplying the exact size is more predictable.' } },
      { id: 'temu-3x4', w: 1350, h: 1800, mb: 3, min: 800, zh: '服装 · 3:4', en: 'Apparel · 3:4',
        note: { zh: '服装类目 3:4。', en: 'Apparel is 3:4.' } },
    ],
  },
  {
    id: 'aliexpress', zh: '速卖通 AliExpress', en: 'AliExpress',
    presets: [
      { id: 'ali-1000', w: 1000, h: 1000, mb: 5, min: 800, zh: '主图 / 商品图', en: 'Main / product image',
        note: { zh: '最低 800×800，建议 ≥1000×1000；JPG/PNG，单张 ≤5MB；主图建议干净（最好白色）背景，不要带其他平台水印或大量文字。', en: 'Minimum 800×800, ≥1000×1000 recommended; JPG/PNG, ≤5 MB; clean (ideally white) background; no other platforms\' watermarks or heavy text.' } },
    ],
  },
  {
    id: 'shopee', zh: '虾皮 Shopee', en: 'Shopee',
    presets: [
      { id: 'shopee-1024', w: 1024, h: 1024, mb: 2, min: 500, zh: '商品图 · 1:1', en: 'Product image · 1:1',
        note: { zh: '最低 500×500；JPG/PNG，单张 ≤2MB；最多 9 张。', en: 'Minimum 500×500; JPG/PNG, ≤2 MB each; up to 9 images.' } },
    ],
  },
  {
    id: 'tiktok', zh: 'TikTok Shop', en: 'TikTok Shop',
    presets: [
      { id: 'tiktok-1x1', w: 1000, h: 1000, mb: 5, min: 600, zh: '商品图 · 1:1', en: 'Product image · 1:1',
        note: { zh: '底线 600×600，建议 ≥800×800；不要边框 / 水印 / 促销文字 / 拼图。体积上限为参考值。', en: 'Floor 600×600, ≥800×800 recommended; no borders, watermarks, promo text or collages. Size cap is a reference value.' } },
      { id: 'tiktok-3x4', w: 900, h: 1200, mb: 5, min: 600, zh: '首图 · 3:4', en: 'First image · 3:4',
        note: { zh: '新版刊登建议首图用无边框 3:4、商品铺满画面（可配合“居中裁切”）。', en: 'Newer listing guidance favours a borderless 3:4 first image with the product filling the frame (try “Crop to fill”).' } },
    ],
  },
  {
    id: 'lazada', zh: '来赞达 Lazada', en: 'Lazada',
    presets: [
      { id: 'lazada-800', w: 800, h: 800, mb: 2, min: 500, zh: '商品图 · 1:1', en: 'Product image · 1:1',
        note: { zh: '最低 500×500、最大 2000×2000；白底，商品约占 80%；不要水印 / 图形。平台未公开明确体积上限，这里按保守值 2MB。', en: 'Min 500×500, max 2000×2000; white background, product ≈80% of the canvas; no watermarks or graphics. No explicit size cap published, so 2 MB is a conservative value.' } },
    ],
  },
  {
    id: 'shopify', zh: '独立站 Shopify', en: 'Shopify',
    presets: [
      { id: 'shopify-2048', w: 2048, h: 2048, mb: 20, min: 800, zh: '商品图 · 1:1（推荐）', en: 'Product image · 1:1 (recommended)',
        note: { zh: '推荐 2048×2048 方图；超过 4472px 会被自动缩小；单张 ≤20MB（实际建议更小以提升加载速度）。', en: '2048×2048 square recommended; anything above 4472 px is auto-resized; ≤20 MB each (smaller is better for page speed).' } },
    ],
  },
];

export const presetLabel = (platform, preset, lang) => `${lang === 'zh' ? platform.zh : platform.en} · ${lang === 'zh' ? preset.zh : preset.en} · ${preset.w}×${preset.h}`;

export function findPreset(id, custom = []) {
  for (const p of IMG_PLATFORMS) {
    const hit = p.presets.find((x) => x.id === id);
    if (hit) return { platform: p, preset: hit };
  }
  const c = custom.find((x) => x.id === id);
  if (c) return { platform: { id: 'custom', zh: '自定义', en: 'Custom' }, preset: { ...c, zh: c.name, en: c.name, min: 0 } };
  return null;
}
