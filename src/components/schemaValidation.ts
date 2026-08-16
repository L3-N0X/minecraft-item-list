import Ajv from 'ajv'
import defaultSchema from '../schema/schema.json'
import type { JsonSchemaProperty, ItemData } from './schema-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationSeverity = 'warning' | 'error'

export interface ValidationEntry {
    severity: ValidationSeverity
    message: string
}

export type ValidationMap = Map<string, ValidationEntry>

// ---------------------------------------------------------------------------
// AJV setup
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true, strict: false })

interface SchemaRoot {
    definitions?: Record<string, JsonSchemaProperty>
    properties?: {
        items?: {
            additionalProperties?: {
                properties?: Record<string, JsonSchemaProperty>
                required?: string[]
            }
        }
    }
}

export function getItemSchema(rawSchema?: unknown): {
    definitions: Record<string, JsonSchemaProperty>
    properties: Record<string, JsonSchemaProperty>
    required?: string[]
} {
    const typedSchema = (rawSchema ?? defaultSchema) as unknown as SchemaRoot
    return {
        definitions: typedSchema.definitions ?? {},
        properties:
            typedSchema.properties?.items?.additionalProperties?.properties ?? {},
        required: typedSchema.properties?.items?.additionalProperties?.required,
    }
}

export const itemSchema = getItemSchema(defaultSchema)

// Cache AJV compiled functions per schema object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatorCache = new WeakMap<object, any>()

function getValidator(rawSchema?: unknown) {
    const s = (typeof rawSchema === 'object' && rawSchema !== null ? rawSchema : defaultSchema) as object
    let validator = validatorCache.get(s)
    if (!validator) {
        const schemaToCompile = getItemSchema(s)
        validator = ajv.compile(schemaToCompile)
        validatorCache.set(s, validator)
    }
    return validator
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Converts an AJV instancePath like "/foo/bar/0" to dot-notation "foo.bar.0" */
function instancePathToDot(instancePath: string): string {
    return instancePath.replace(/^\//, '').replace(/\//g, '.')
}

interface RequiredParams {
    missingProperty?: string
}

/** Runs AJV against `data` and returns a map of dot-path → ValidationEntry. */
export function validateItemData(
    data: ItemData,
    debugLabel?: string,
    rawSchema?: unknown
): ValidationMap {
    const errors: ValidationMap = new Map()
    const validateAjv = getValidator(rawSchema)
    validateAjv(data ?? {})
    for (const err of validateAjv.errors ?? []) {
        let path: string
        if (err.keyword === 'required') {
            const parent = instancePathToDot(err.instancePath)
            const missing = (err.params as RequiredParams)
                .missingProperty as string
            path = parent ? `${parent}.${missing}` : missing
        } else {
            path = instancePathToDot(err.instancePath) || '__root__'
        }
        // Only keep the first error per path
        if (!errors.has(path)) {
            errors.set(path, {
                severity: 'error',
                message: err.message ?? 'Invalid value',
            })
        }
    }

    if (debugLabel !== undefined) {
        console.debug(
            `[schemaValidation] "${debugLabel}" → ${errors.size} issue(s)`,
            errors.size > 0
                ? Object.fromEntries(
                      [...errors.entries()].map(([k, v]) => [k, v.message])
                  )
                : '(none)'
        )
    }

    return errors
}

/**
 * Convenience helper: returns just the number of validation errors for an item.
 * Accepts an optional label that will be forwarded to the debug log.
 */
export function countItemErrors(
    data: ItemData,
    debugLabel?: string,
    rawSchema?: unknown
): number {
    return validateItemData(data, debugLabel, rawSchema).size
}

// ---------------------------------------------------------------------------
// CSS class helpers (consumed by field components)
// ---------------------------------------------------------------------------

/**
 * Returns a Tailwind ring class for leaf fields (inputs, selects).
 * Empty string when there is no validation issue.
 */
export function validationRingClass(entry?: ValidationEntry): string {
    if (!entry) return ''
    return entry.severity === 'error'
        ? 'ring-2 ring-red-500/70'
        : 'ring-2 ring-yellow-400/70'
}

/**
 * Returns a Tailwind border-color class for section containers that already
 * carry a `border-2` class.
 */
export function validationBorderColorClass(entry?: ValidationEntry): string {
    if (!entry) return 'border-muted'
    return entry.severity === 'error'
        ? 'border-red-500/70'
        : 'border-yellow-400/70'
}
