export interface JsonSchemaProperty {
    type?:
        | 'string'
        | 'integer'
        | 'number'
        | 'boolean'
        | 'object'
        | 'array'
        | 'null'
    title?: string
    description?: string
    enum?: unknown[]
    items?: JsonSchemaProperty
    properties?: Record<string, JsonSchemaProperty>
    required?: string[]
    oneOf?: JsonSchemaProperty[]
    $ref?: string
    additionalProperties?: boolean | JsonSchemaProperty
    minimum?: number
    maximum?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    default?: unknown
}

export type SchemaPropertyValue =
    | string
    | number
    | boolean
    | null
    | SchemaPropertyValue[]
    | { [key: string]: SchemaPropertyValue }

export interface ItemData {
    [key: string]: SchemaPropertyValue
}
