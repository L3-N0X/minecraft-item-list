import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { validationRingClass } from '../schemaValidation'
import type { ValidationEntry } from '../schemaValidation'

export interface NumberFieldProps {
    path: (string | number)[]
    value: any
    label: string
    fieldSchema: any
    onFieldChange: (path: (string | number)[], value: any) => void
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

export function NumberField({
    path,
    value,
    label,
    fieldSchema,
    onFieldChange,
    validationEntry,
}: NumberFieldProps) {
    const ring = validationRingClass(validationEntry)
    const id = path.join('.')
    const min = fieldSchema.minimum
    const max = fieldSchema.maximum
    const isInteger = fieldSchema.type === 'integer'

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label htmlFor={id}>{label}</Label>
                {(min !== undefined || max !== undefined) && (
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {min !== undefined ? `Min: ${min}` : ''}{' '}
                        {max !== undefined ? `Max: ${max}` : ''}
                    </span>
                )}
            </div>
            <Input
                id={id}
                type="number"
                min={min}
                max={max}
                value={value ?? ''}
                className={ring}
                onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                        onFieldChange(path, undefined)
                        return
                    }
                    let val = isInteger ? parseInt(raw) : parseFloat(raw)
                    if (!isNaN(val)) {
                        if (min !== undefined && val < min) val = min
                        if (max !== undefined && val > max) val = max
                        onFieldChange(path, val)
                    }
                }}
            />
            <ValidationMessage entry={validationEntry} />
        </div>
    )
}
