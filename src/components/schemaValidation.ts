import Ajv from "ajv";
import schema from "../data/schema.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationSeverity = "warning" | "error";

export interface ValidationEntry {
    severity: ValidationSeverity;
    message: string;
}

export type ValidationMap = Map<string, ValidationEntry>;

// ---------------------------------------------------------------------------
// AJV setup
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * The item sub-schema with root-level `definitions` merged in so that $ref
 * entries like "#/definitions/stackSizeEnum" resolve correctly (# refers to
 * the compiled schema root).
 */
export const itemSchema = {
    definitions: (schema as any).definitions,
    ...(schema.properties as any).items.additionalProperties,
};

const validateAjv = ajv.compile(itemSchema);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Converts an AJV instancePath like "/foo/bar/0" to dot-notation "foo.bar.0" */
function instancePathToDot(instancePath: string): string {
    return instancePath.replace(/^\//, "").replace(/\//g, ".");
}

/** Runs AJV against `data` and returns a map of dot-path → ValidationEntry. */
export function validateItemData(data: any): ValidationMap {
    const errors: ValidationMap = new Map();
    validateAjv(data ?? {});
    for (const err of validateAjv.errors ?? []) {
        let path: string;
        if (err.keyword === "required") {
            const parent = instancePathToDot(err.instancePath);
            const missing = (err.params as any).missingProperty as string;
            path = parent ? `${parent}.${missing}` : missing;
        } else {
            path = instancePathToDot(err.instancePath) || "__root__";
        }
        // Only keep the first error per path
        if (!errors.has(path)) {
            errors.set(path, { severity: "error", message: err.message ?? "Invalid value" });
        }
    }
    return errors;
}

// ---------------------------------------------------------------------------
// CSS class helpers (consumed by field components)
// ---------------------------------------------------------------------------

/**
 * Returns a Tailwind ring class for leaf fields (inputs, selects).
 * Empty string when there is no validation issue.
 */
export function validationRingClass(entry?: ValidationEntry): string {
    if (!entry) return "";
    return entry.severity === "error" ? "ring-2 ring-red-500/70" : "ring-2 ring-yellow-400/70";
}

/**
 * Returns a Tailwind border-color class for section containers that already
 * carry a `border-2` class.
 */
export function validationBorderColorClass(entry?: ValidationEntry): string {
    if (!entry) return "border-muted";
    return entry.severity === "error" ? "border-red-500/70" : "border-yellow-400/70";
}
