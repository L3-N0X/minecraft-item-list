import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface EnumSelectProps {
    label: string
    options: string[]
    value: string
    onChange: (val: string) => void
    triggerClassName?: string
}

export function EnumSelect({
    label,
    options,
    value,
    onChange,
    triggerClassName,
}: EnumSelectProps) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value || ''} onValueChange={onChange}>
                <SelectTrigger className={cn('w-full', triggerClassName)}>
                    <SelectValue placeholder={`Select ${label}...`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
