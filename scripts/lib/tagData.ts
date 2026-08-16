import { getDataUrl } from '@/lib/utils'
import type {
    ItemTagMap,
    ResolvedItemTagsIndex,
    ItemTagMembership,
} from '../types/tags'

const TAGS_DATA_URL = getDataUrl('/data/tags.json')
const TAG_BLACKLIST_EXACT = new Set<string>(['chest_armor', 'copper'])
const TAG_BLACKLIST_PREFIXES = ['enchantable/']

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function normalizeMinecraftId(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) {
        throw new Error('Invalid tags payload: empty id is not allowed')
    }
    return trimmed.replace(/^minecraft:/, '')
}

function normalizeTagReference(value: string): string {
    const normalized = normalizeMinecraftId(value.replace(/^#/, ''))
    if (!normalized) {
        throw new Error(
            `Invalid tags payload: malformed tag reference "${value}"`
        )
    }
    return normalized
}

function isBlacklistedTagId(tagId: string): boolean {
    const normalizedTagId = normalizeMinecraftId(tagId.replace(/^#/, ''))
    return (
        TAG_BLACKLIST_EXACT.has(normalizedTagId) ||
        TAG_BLACKLIST_PREFIXES.some((prefix) =>
            normalizedTagId.startsWith(prefix)
        )
    )
}

function parseItemTagMap(value: unknown): ItemTagMap {
    if (!isRecord(value)) {
        throw new Error('Invalid tags payload: expected object')
    }

    const parsed: ItemTagMap = {}
    for (const [rawTagId, entry] of Object.entries(value)) {
        const tagId = normalizeMinecraftId(rawTagId)
        if (isBlacklistedTagId(tagId)) {
            continue
        }
        if (!isRecord(entry)) {
            throw new Error(
                `Invalid tags payload: "${tagId}" must be an object`
            )
        }

        const values = entry.values
        if (!Array.isArray(values)) {
            throw new Error(
                `Invalid tags payload: "${tagId}.values" must be an array`
            )
        }
        if (!values.every((itemOrTag) => typeof itemOrTag === 'string')) {
            throw new Error(
                `Invalid tags payload: "${tagId}.values" must only contain strings`
            )
        }

        const replace = entry.replace
        if (replace !== undefined && typeof replace !== 'boolean') {
            throw new Error(
                `Invalid tags payload: "${tagId}.replace" must be a boolean when present`
            )
        }

        parsed[tagId] = { values, replace }
    }

    return parsed
}

function resolveTagItems(
    tagId: string,
    tagMap: ItemTagMap,
    inProgress: Set<string>,
    cache: Map<string, Set<string>>
): Set<string> {
    if (isBlacklistedTagId(tagId)) {
        const emptySet = new Set<string>()
        cache.set(tagId, emptySet)
        return emptySet
    }

    const cached = cache.get(tagId)
    if (cached) {
        return cached
    }

    if (inProgress.has(tagId)) {
        throw new Error(
            `Invalid tags payload: circular tag reference at "${tagId}"`
        )
    }

    const tag = tagMap[tagId]
    if (!tag) {
        throw new Error(
            `Invalid tags payload: missing referenced tag "${tagId}"`
        )
    }

    inProgress.add(tagId)
    const resolvedItemIds = new Set<string>()

    for (const value of tag.values) {
        if (value.startsWith('#')) {
            const referencedTagId = normalizeTagReference(value)
            if (isBlacklistedTagId(referencedTagId)) {
                continue
            }
            const referencedItems = resolveTagItems(
                referencedTagId,
                tagMap,
                inProgress,
                cache
            )
            for (const itemId of referencedItems) {
                resolvedItemIds.add(itemId)
            }
            continue
        }

        resolvedItemIds.add(normalizeMinecraftId(value))
    }

    inProgress.delete(tagId)
    cache.set(tagId, resolvedItemIds)
    return resolvedItemIds
}

export function resolveItemTagIndex(tagMap: ItemTagMap): ResolvedItemTagsIndex {
    const itemIdsByTagId = new Map<string, Set<string>>()
    const tagIdsByItemId = new Map<string, Set<string>>()
    const itemCountByTagId = new Map<string, number>()
    const inProgress = new Set<string>()

    for (const tagId of Object.keys(tagMap)) {
        if (isBlacklistedTagId(tagId)) {
            continue
        }
        const resolvedItemIds = resolveTagItems(
            tagId,
            tagMap,
            inProgress,
            itemIdsByTagId
        )
        itemCountByTagId.set(tagId, resolvedItemIds.size)

        for (const itemId of resolvedItemIds) {
            const tagIds = tagIdsByItemId.get(itemId) ?? new Set<string>()
            tagIds.add(tagId)
            tagIdsByItemId.set(itemId, tagIds)
        }
    }

    return {
        itemIdsByTagId,
        tagIdsByItemId,
        itemCountByTagId,
    }
}

export function getItemTagMemberships(
    itemId: string,
    resolvedTags: ResolvedItemTagsIndex
): ItemTagMembership[] {
    const normalizedItemId = normalizeMinecraftId(itemId)
    const tagIds = resolvedTags.tagIdsByItemId.get(normalizedItemId)
    if (!tagIds) {
        return []
    }

    return [...tagIds]
        .map((tagId) => ({
            tagId,
            itemCount: resolvedTags.itemCountByTagId.get(tagId) ?? 0,
        }))
        .sort(
            (left, right) =>
                left.itemCount - right.itemCount ||
                left.tagId.localeCompare(right.tagId)
        )
}

export async function loadItemTagMap(
    signal?: AbortSignal,
    version: string = '26.1-snapshot-10'
): Promise<ItemTagMap> {
    const url = getDataUrl(`/data/versions/${version}/tags.json`)
    const response = await fetch(url, {
        signal,
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to load tags for version ${version} (${response.status})`)
    }

    return parseItemTagMap(await response.json())
}
