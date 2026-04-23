import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { validationRingClass } from '../schemaValidation'
import type { ValidationEntry } from '../schemaValidation'
import type { JsonSchemaProperty, SchemaPropertyValue } from '../schema-types'

export interface StringFieldProps {
    path: (string | number)[]
    value?: SchemaPropertyValue
    label: string
    fieldSchema: JsonSchemaProperty
    onFieldChange: (
        path: (string | number)[],
        value?: SchemaPropertyValue
    ) => void
    validationEntry?: ValidationEntry
}

function ValidationMessage({ entry }: { entry?: ValidationEntry }) {
    if (!entry) return null
    return (
        <p
            className={cn(
                'text-[11px] leading-tight mt-1',
                entry.severity === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-500/90'
            )}
        >
            {entry.message}
        </p>
    )
}

export function StringField({
    path,
    value,
    label,
    fieldSchema,
    onFieldChange,
    validationEntry,
}: StringFieldProps) {
    const ring = validationRingClass(validationEntry)
    const id = path.join('.')

    const isTextarea =
        path[path.length - 1]
            ?.toString()
            .toLowerCase()
            .includes('description') || fieldSchema.format === 'textarea'

    if (isTextarea) {
        return (
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor={id}>{label}</Label>
                <Textarea
                    id={id}
                    value={(value as string) ?? ''}
                    onChange={(e) =>
                        onFieldChange(
                            path,
                            e.target.value === '' ? undefined : e.target.value
                        )
                    }
                    rows={3}
                    className={cn('resize-none', ring)}
                />
                <ValidationMessage entry={validationEntry} />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={(value as string) ?? ''}
                onChange={(e) =>
                    onFieldChange(
                        path,
                        e.target.value === '' ? undefined : e.target.value
                    )
                }
                className={ring}
            />
            <ValidationMessage entry={validationEntry} />
        </div>
    )
}
