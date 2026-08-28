import fs from 'node:fs'
import path from 'node:path'

const targetVersion =
    process.argv.find((arg) => arg.startsWith('--version='))?.split('=')[1] ??
    process.argv[2] ??
    '26.2'

const ASSETS_URLS = [
    `https://raw.githubusercontent.com/misode/mcmeta/${targetVersion}-assets`,
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/assets',
]
const REGISTRIES_URLS = [
    `https://raw.githubusercontent.com/misode/mcmeta/${targetVersion}-registries`,
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/registries',
]
const SUMMARY_URLS = [
    `https://raw.githubusercontent.com/misode/mcmeta/${targetVersion}-summary`,
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/summary',
]

const DATA_DIR = path.join(
    process.cwd(),
    'public',
    'data',
    'versions',
    targetVersion
)
const ITEMS_JSON_PATH = path.join(DATA_DIR, 'items.json')
const CATEGORIES_JSON_PATH = path.join(DATA_DIR, 'categories.json')

interface ItemComponent {
    'minecraft:max_stack_size'?: number
    'minecraft:rarity'?: string
    'minecraft:provides_trim_material'?: string
    'minecraft:damage_resistant'?: { types?: string }
    'minecraft:food'?: { nutrition?: number; saturation?: number }
    [key: string]: unknown
}

interface ItemData {
    displayName?: string
    displayNameGerman?: string
    isBlock?: boolean
    stackSize?: number
    rarityTier?: string
    isArmorTrimMaterial?: boolean
    craftingIngredient?: boolean
    renewable?: string
    edible?: Record<string, unknown>
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
    try {
        const response = await fetch(url)
        if (!response.ok) return null
        return (await response.json()) as T
    } catch {
        return null
    }
}

async function fetchWithFallback<T>(
    baseUrls: string[],
    subpath: string
): Promise<T | null> {
    for (const base of baseUrls) {
        const url = `${base}/${subpath}`
        const res = await fetchJSON<T>(url)
        if (res !== null) return res
    }
    return null
}

async function initData() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

    console.log(
        `Fetching language files, registries, components and version for ${targetVersion}...`
    )
    const [enUs, deDe, itemNames, blockNames, versionData, itemComponents] =
        await Promise.all([
            fetchWithFallback<Record<string, string>>(
                ASSETS_URLS,
                'assets/minecraft/lang/en_us.json'
            ),
            fetchWithFallback<Record<string, string>>(
                ASSETS_URLS,
                'assets/minecraft/lang/de_de.json'
            ),
            fetchWithFallback<ItemList>(REGISTRIES_URLS, 'item/data.json'),
            fetchWithFallback<ItemList>(REGISTRIES_URLS, 'block/data.json'),
            fetchWithFallback<{ id: string }>(REGISTRIES_URLS, 'version.json'),
            fetchWithFallback<Record<string, ItemComponent>>(
                SUMMARY_URLS,
                'item_components/data.json'
            ),
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
        targetVersion ?? existingVersion ?? versionData?.id ?? 'unknown'

    let categories: Record<string, string[]> = {}
    if (fs.existsSync(CATEGORIES_JSON_PATH)) {
        categories = JSON.parse(fs.readFileSync(CATEGORIES_JSON_PATH, 'utf-8'))
    }

    const newItems: Record<string, ItemData> = {}

    console.log(`Processing ${itemNames.length} items...`)

    for (const name of itemNames) {
        const itemKey = `item.minecraft.${name}`
        const blockKey = `block.minecraft.${name}`

        let displayNameEn = enUs?.[itemKey] ?? enUs?.[blockKey] ?? name
        let displayNameGerman = deDe?.[itemKey] ?? deDe?.[blockKey] ?? name

        const musicDesc = enUs?.[`${itemKey}.desc`]
        if (name.startsWith('music_disc_') && musicDesc) {
            const songName = musicDesc.includes(' - ')
                ? (musicDesc.split(' - ')[1]?.trim() ?? musicDesc.trim())
                : musicDesc.trim()
            displayNameEn = `Music Disc ${songName}`
            displayNameGerman = `Schallplatte ${songName}`
        }

        const existing = existingData[name]
        const isBlock = blockSet.has(name)
        const itemComp = itemComponents?.[name]

        if (existing) {
            // Preserve all existing data, only manage the fields this script is responsible for
            const existingCopy = { ...existing }

            if (isBlock) {
                delete existingCopy.item
                newItems[name] = {
                    ...existingCopy,
                    displayName: displayNameEn,
                    displayNameGerman: displayNameGerman,
                    isBlock: true,
                    block: existing.block ?? {},
                    ...(existing.breaking &&
                    Object.keys(existing.breaking).length > 0
                        ? { breaking: existing.breaking }
                        : {}),
                }
            } else {
                delete existingCopy.block
                delete existingCopy.breaking
                const fireResistant =
                    (existing.item?.fireResistant as boolean | undefined) ??
                    itemComp?.['minecraft:damage_resistant'] !== undefined
                newItems[name] = {
                    ...existingCopy,
                    displayName: displayNameEn,
                    displayNameGerman: displayNameGerman,
                    isBlock: false,
                    item: {
                        fireResistant,
                        ...(existing.item ?? {}),
                    },
                }
            }
        } else {
            // New item initialization
            const itemObj: ItemData = {
                displayName: displayNameEn,
                displayNameGerman: displayNameGerman,
                isBlock,
                stackSize: itemComp?.['minecraft:max_stack_size'] ?? 64,
                rarityTier: itemComp?.['minecraft:rarity'] ?? 'common',
                renewable: 'unknown',
                craftingIngredient: false,
                isArmorTrimMaterial:
                    itemComp?.['minecraft:provides_trim_material'] !==
                    undefined,
                obtaining: {
                    obtainability: 'survival',
                    craftable: false,
                    difficultyToObtain: -1,
                },
            }

            if (isBlock) {
                itemObj.block = {}
                itemObj.breaking = {
                    requiresSilkTouch: 'no',
                    instantBreaking: false,
                }
            } else {
                itemObj.item = {
                    fireResistant:
                        itemComp?.['minecraft:damage_resistant'] !== undefined,
                }
            }

            if (itemComp?.['minecraft:food']) {
                itemObj.edible = {
                    foodPoints: itemComp['minecraft:food'].nutrition ?? 0,
                    saturationModifier:
                        itemComp['minecraft:food'].saturation ?? 0,
                }
            }

            newItems[name] = itemObj
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
