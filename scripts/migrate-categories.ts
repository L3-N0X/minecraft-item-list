import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ITEMS_JSON_PATH = path.join(DATA_DIR, 'items.json');
const CATEGORIES_JSON_PATH = path.join(DATA_DIR, 'categories.json');

function migrate() {
  if (!fs.existsSync(ITEMS_JSON_PATH)) {
    console.error('items.json not found');
    return;
  }

  const items = JSON.parse(fs.readFileSync(ITEMS_JSON_PATH, 'utf-8'));
  const categories: Record<string, string[]> = {};

  for (const [itemId, itemData] of Object.entries(items) as [string, any][]) {
    const category = itemData.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(itemId);
    
    // Remove old category field
    delete itemData.category;
  }

  fs.writeFileSync(CATEGORIES_JSON_PATH, JSON.stringify(categories, null, 2));
  fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(items, null, 2));

  console.log('Migration complete!');
  console.log(`Created ${Object.keys(categories).length} categories.`);
}

migrate();
