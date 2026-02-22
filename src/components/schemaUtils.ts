import schema from "../data/schema.json";

/**
 * Resolves a JSON Schema $ref string (only supports local "#/..." references)
 * against the root schema object.
 */
export function resolveRef(ref: string): any {
    if (ref.startsWith("#/")) {
        const parts = ref.slice(2).split("/");
        let current: any = schema;
        for (const part of parts) {
            current = current[part];
            if (current === undefined) return undefined;
        }
        return current;
    }
    return undefined;
}

/**
 * Returns true when a field schema matches the QuantitySpec pattern:
 * a oneOf with exactly two variants — a plain integer and an object with
 * integer `min` / `max` properties.
 */
export function isQuantitySpec(fieldSchema: any): boolean {
    if (!Array.isArray(fieldSchema?.oneOf) || fieldSchema.oneOf.length !== 2) return false;
    const hasInteger = fieldSchema.oneOf.some((o: any) => o.type === "integer" && !o.properties);
    const hasRange = fieldSchema.oneOf.some(
        (o: any) =>
            o.type === "object" &&
            o.properties?.min?.type === "integer" &&
            o.properties?.max?.type === "integer",
    );
    return hasInteger && hasRange;
}

/**
 * Resolves a field schema, following top-level $ref and array items.$ref
 * references against the root schema.
 */
export function resolveSchema(fieldSchema: any): any {
    if (fieldSchema?.$ref) {
        return resolveRef(fieldSchema.$ref) ?? fieldSchema;
    }
    if (fieldSchema?.items?.$ref) {
        return {
            ...fieldSchema,
            items: resolveRef(fieldSchema.items.$ref) ?? fieldSchema.items,
        };
    }
    return fieldSchema;
}

/**
 * Derives a human-readable label from a schema key, preferring the schema's
 * own `title` property when present.
 */
export function getLabel(key: string, fieldSchema: any): string {
    return (
        fieldSchema.title ||
        key
            .split(/(?=[A-Z])|_/)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
    );
}
