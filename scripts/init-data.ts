import fs from 'node:fs'
import path from 'node:path'

const ASSETS_URL_BASE =
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/assets'
const REGISTRIES_URL_BASE =
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/registries'
const VERSION_URL = `${REGISTRIES_URL_BASE}/version.json`

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const ITEMS_JSON_PATH = path.join(DATA_DIR, 'items.json')
const CATEGORIES_JSON_PATH = path.join(DATA_DIR, 'categories.json')

interface ItemData {
    displayName?: string
    displayNameGerman?: string
    isBlock?: boolean
    item?: Record<string, unknown>
    block?: Record<string, unknown>
    breaking?: Record<string, unknown>
    [key: string]: unknown
}

interface ExistingData {
    items?: Record<string, ItemData>
    [key: string]: unknown
}

type ItemList = string[]

async function fetchJSON<T>(url: string): Promise<T | null> {
    const response = await fetch(url)
    if (!response.ok) return null
    return response.json() as Promise<T>
}

async function initData() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

    console.log('Fetching language files, registries and version...')
    const [enUs, deDe, itemNames, blockNames, versionData] = await Promise.all([
        fetchJSON<Record<string, string>>(
            `${ASSETS_URL_BASE}/assets/minecraft/lang/en_us.json`
        ),
        fetchJSON<Record<string, string>>(
            `${ASSETS_URL_BASE}/assets/minecraft/lang/de_de.json`
        ),
        fetchJSON<ItemList>(`${REGISTRIES_URL_BASE}/item/data.json`),
        fetchJSON<ItemList>(`${REGISTRIES_URL_BASE}/block/data.json`),
        fetchJSON<{ id: string }>(VERSION_URL),
    ])

    if (!itemNames) throw new Error('Failed to fetch item list')
    if (!blockNames) throw new Error('Failed to fetch block list')

    const blockSet = new Set<string>(blockNames)

    let existingData: Record<string, ItemData> = {}
    let existingVersion: string | undefined
    if (fs.existsSync(ITEMS_JSON_PATH)) {
        const raw = JSON.parse(
            fs.readFileSync(ITEMS_JSON_PATH, 'utf-8')
        ) as ExistingData
        if (raw.items && typeof raw.items === 'object') {
            existingData = raw.items
            existingVersion = raw.minecraft_version as string | undefined
        } else {
            existingData = raw as Record<string, ItemData>
        }
    }

    const minecraftVersion: string =
        existingVersion ?? versionData?.id ?? 'unknown'

    let categories: Record<string, string[]> = {}
    if (fs.existsSync(CATEGORIES_JSON_PATH)) {
        categories = JSON.parse(fs.readFileSync(CATEGORIES_JSON_PATH, 'utf-8'))
    }

    const newItems: Record<string, ItemData> = {}

    console.log(`Processing ${itemNames.length} items...`)

    for (const name of itemNames) {
        const itemKey = `item.minecraft.${name}`
        const blockKey = `block.minecraft.${name}`

        const displayNameEn = enUs?.[itemKey] ?? enUs?.[blockKey] ?? name
        const displayNameGerman = deDe?.[itemKey] ?? deDe?.[blockKey] ?? name

        const existing = existingData[name] ?? {}
        const isBlock = blockSet.has(name)

        // Preserve all existing data, only manage the fields this script is responsible for
        newItems[name] = {
            ...existing,
            displayName: existing.displayName ?? displayNameEn,
            displayNameGerman: existing.displayNameGerman ?? displayNameGerman,
            isBlock,
            ...(isBlock
                ? {
                      block: existing.block ?? {},
                      breaking: existing.breaking ?? {},
                  }
                : { item: existing.item ?? {} }),
        }
    }

    const output = {
        minecraft_version: minecraftVersion,
        items: newItems,
    }

    fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(output, null, 4))
    fs.writeFileSync(CATEGORIES_JSON_PATH, JSON.stringify(categories, null, 2))

    console.log(
        `Done. Wrote ${Object.keys(newItems).length} items to items.json (version: ${minecraftVersion}).`
    )
}

initData().catch(console.error)
