import fs from 'node:fs'
import path from 'node:path'

const targetVersion =
    process.argv.find((arg) => arg.startsWith('--version='))?.split('=')[1] ??
    process.argv[2] ??
    '26.2'

const REGISTRIES_URLS = [
    `https://raw.githubusercontent.com/misode/mcmeta/${targetVersion}-registries`,
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/registries',
]

const PUBLIC_DATA_DIR = path.join(
    process.cwd(),
    'public',
    'data',
    'versions',
    targetVersion
)
const SCHEMA_JSON_PATH = path.join(PUBLIC_DATA_DIR, 'schema.json')

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

interface SchemaDefinition {
    enum?: string[]
    type?: string
    [key: string]: unknown
}

interface SchemaJson {
    definitions: Record<string, SchemaDefinition>
    [key: string]: unknown
}

async function updateSchema() {
    console.log(`Updating schema.json for version ${targetVersion}...`)

    if (!fs.existsSync(SCHEMA_JSON_PATH)) {
        throw new Error(`schema.json not found at ${SCHEMA_JSON_PATH}`)
    }

    const schema = JSON.parse(
        fs.readFileSync(SCHEMA_JSON_PATH, 'utf-8')
    ) as SchemaJson

    const [
        itemsList,
        blocksList,
        entityTypesList,
        biomesList,
        enchantmentsList,
    ] = await Promise.all([
        fetchWithFallback<string[]>(REGISTRIES_URLS, 'item/data.json'),
        fetchWithFallback<string[]>(REGISTRIES_URLS, 'block/data.json'),
        fetchWithFallback<string[]>(REGISTRIES_URLS, 'entity_type/data.json'),
        fetchWithFallback<string[]>(
            REGISTRIES_URLS,
            'worldgen/biome/data.json'
        ),
        fetchWithFallback<string[]>(REGISTRIES_URLS, 'enchantment/data.json'),
    ])

    if (!itemsList || !blocksList || !entityTypesList || !biomesList) {
        throw new Error('Failed to fetch registries from misode/mcmeta')
    }

    const blockSet = new Set(blocksList)

    // Items that are not blocks, or all registered item keys
    const nonBlockItems = itemsList.filter((item) => !blockSet.has(item))
    const existingItemsEnum = new Set(schema.definitions.itemsEnum?.enum ?? [])
    const existingBlocksEnum = new Set(schema.definitions.blocksEnum?.enum ?? [])

    // Add all new non-block items to itemsEnum
    for (const item of itemsList) {
        if (!blockSet.has(item)) {
            existingItemsEnum.add(item)
        }
    }

    // Add all new blocks to blocksEnum
    for (const block of blocksList) {
        existingBlocksEnum.add(block)
    }

    schema.definitions.itemsEnum = {
        type: 'string',
        enum: Array.from(existingItemsEnum).sort(),
    }

    schema.definitions.blocksEnum = {
        type: 'string',
        enum: Array.from(existingBlocksEnum).sort(),
    }

    schema.definitions.mobEnum = {
        type: 'string',
        enum: Array.from(
            new Set([
                ...(schema.definitions.mobEnum?.enum ?? []),
                ...entityTypesList,
            ])
        ).sort(),
    }

    schema.definitions.biomeEnum = {
        type: 'string',
        enum: Array.from(
            new Set([
                ...(schema.definitions.biomeEnum?.enum ?? []),
                ...biomesList,
            ])
        ).sort(),
    }

    if (enchantmentsList && schema.definitions.enchantmentEnum) {
        schema.definitions.enchantmentEnum = {
            type: 'string',
            enum: Array.from(
                new Set([
                    ...(schema.definitions.enchantmentEnum.enum ?? []),
                    ...enchantmentsList,
                ])
            ).sort(),
        }
    }

    fs.writeFileSync(SCHEMA_JSON_PATH, JSON.stringify(schema, null, 4))
    console.log(
        `Successfully updated schema.json with ${schema.definitions.itemsEnum?.enum?.length ?? 0} items, ${schema.definitions.blocksEnum?.enum?.length ?? 0} blocks, ${schema.definitions.mobEnum?.enum?.length ?? 0} mobs, and ${schema.definitions.biomeEnum?.enum?.length ?? 0} biomes.`
    )
}

updateSchema().catch((err) => {
    console.error('Error updating schema:', err)
    process.exit(1)
})
