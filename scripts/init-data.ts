import fs from 'node:fs';
import path from 'node:path';

const ASSETS_URL_BASE = 'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/assets';
const REGISTRIES_URL_BASE = 'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/registries';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const RENDERS_DIR = path.join(PUBLIC_DIR, 'renders');
const BLOCK_RENDERS_DIR = path.join(RENDERS_DIR, 'blocks');
const ITEM_RENDERS_DIR = path.join(RENDERS_DIR, 'items');
const ITEMS_JSON_PATH = path.join(DATA_DIR, 'items.json');

async function fetchJSON(url: string) {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function initData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('Fetching language files and registries...');
  const [enUs, deDe, itemNames, blockNames] = await Promise.all([
    fetchJSON(`${ASSETS_URL_BASE}/assets/minecraft/lang/en_us.json`),
    fetchJSON(`${ASSETS_URL_BASE}/assets/minecraft/lang/de_de.json`),
    fetchJSON(`${REGISTRIES_URL_BASE}/item/data.json`),
    fetchJSON(`${REGISTRIES_URL_BASE}/block/data.json`)
  ]);

  if (!itemNames) throw new Error("Failed to fetch item list");
  if (!blockNames) throw new Error("Failed to fetch block list");

  const blockSet = new Set(blockNames);

  let existingData: Record<string, any> = {};
  if (fs.existsSync(ITEMS_JSON_PATH)) {
    existingData = JSON.parse(fs.readFileSync(ITEMS_JSON_PATH, 'utf-8'));
  }

  const CATEGORIES_JSON_PATH = path.join(DATA_DIR, 'categories.json');
  let categories: Record<string, string[]> = {};
  if (fs.existsSync(CATEGORIES_JSON_PATH)) {
    categories = JSON.parse(fs.readFileSync(CATEGORIES_JSON_PATH, 'utf-8'));
  }

  const newData: Record<string, any> = {};

  console.log(`Processing ${itemNames.length} items...`);
  
  for (const name of itemNames) {
    const itemKey = `item.minecraft.${name}`;
    const blockKey = `block.minecraft.${name}`;
    
    const displayNameEn = enUs?.[itemKey] || enUs?.[blockKey] || name;
    const displayNameGerman = deDe?.[itemKey] || deDe?.[blockKey] || name;

    const existing = existingData[name] || {};
    const isBlock = blockSet.has(name);

    newData[name] = {
      displayName: existing.displayName || displayNameEn,
      displayNameGerman: existing.displayNameGerman || displayNameGerman,
      isBlock: isBlock,
      ...existing,
      // Ensure we don't have texture in the final object if it was in existing
    };
    delete newData[name].texture;

    // Ensure item is in at least one category
    const hasCategory = Object.values(categories).some(itemIds => itemIds.includes(name));
    if (!hasCategory) {
      if (!categories['Uncategorized']) categories['Uncategorized'] = [];
      if (!categories['Uncategorized'].includes(name)) {
        categories['Uncategorized'].push(name);
      }
    }
  }

  fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(newData, null, 2));
  fs.writeFileSync(CATEGORIES_JSON_PATH, JSON.stringify(categories, null, 2));
  console.log('Data initialized with block info and new render paths.');
}

initData().catch(console.error);
