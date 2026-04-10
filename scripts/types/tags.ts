export interface ItemTagDefinition {
    replace?: boolean
    values: string[]
}

export type ItemTagMap = Record<string, ItemTagDefinition>

export interface ResolvedItemTagsIndex {
    /**
     * Resolved tag membership where each tag points to the full, flattened set of items.
     */
    itemIdsByTagId: Map<string, Set<string>>
    /**
     * Reverse lookup from item id to all tags that include it directly or indirectly.
     */
    tagIdsByItemId: Map<string, Set<string>>
    /**
     * Convenience lookup for uniqueness scoring.
     */
    itemCountByTagId: Map<string, number>
}

export interface ItemTagMembership {
    tagId: string
    itemCount: number
}
