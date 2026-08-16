import defaultSchema from '../schema/schema.json'
import type { JsonSchemaProperty } from './schema-types'

/**
 * Resolves a JSON Schema $ref string (only supports local "#/..." references)
 * against the provided root schema object (or default schema).
 */
export function resolveRef(
    ref: string,
    rootSchema?: unknown
): JsonSchemaProperty | undefined {
    if (ref.startsWith('#/')) {
        const parts = ref.slice(2).split('/')
        let current: unknown = rootSchema ?? defaultSchema
        for (const part of parts) {
            if (typeof current !== 'object' || current === null)
                return undefined
            current = (current as Record<string, unknown>)[part]
            if (current === undefined) return undefined
        }
        return current as JsonSchemaProperty
    }
    return undefined
}

/**
 * Returns true when a field schema matches the QuantitySpec pattern:
 * a oneOf with exactly two variants — a plain integer and an object with
 * integer `min` / `max` properties.
 */
export function isQuantitySpec(fieldSchema: JsonSchemaProperty): boolean {
    if (!Array.isArray(fieldSchema?.oneOf) || fieldSchema.oneOf.length !== 2)
        return false
    const hasInteger = fieldSchema.oneOf.some(
        (o) => o.type === 'integer' && !o.properties
    )
    const hasRange = fieldSchema.oneOf.some(
        (o) =>
            o.type === 'object' &&
            o.properties?.min?.type === 'integer' &&
            o.properties?.max?.type === 'integer'
    )
    return hasInteger && hasRange
}

/**
 * Resolves a field schema, following top-level $ref and array items.$ref
 * references against the root schema.
 */
export function resolveSchema(
    fieldSchema: JsonSchemaProperty,
    rootSchema?: unknown
): JsonSchemaProperty {
    if (fieldSchema?.$ref) {
        return resolveRef(fieldSchema.$ref, rootSchema) ?? fieldSchema
    }
    if (fieldSchema?.items?.$ref) {
        return {
            ...fieldSchema,
            items:
                resolveRef(fieldSchema.items.$ref, rootSchema) ??
                fieldSchema.items,
        }
    }
    return fieldSchema
}

/**
 * Derives a human-readable label from a schema key, preferring the schema's
 * own `title` property when present.
 */
export function getLabel(key: string, fieldSchema: JsonSchemaProperty): string {
    return (
        fieldSchema.title ||
        key
            .split(/(?=[A-Z])|_/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    )
}
