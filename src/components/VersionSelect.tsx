import React from 'react'
import { useData } from '../context/DataContext'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { StackIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function VersionSelect({ className }: { className?: string }) {
    const { activeVersion, availableVersions, setActiveVersion } = useData()

    if (!availableVersions || availableVersions.length === 0) {
        return null
    }

    return (
        <div className={cn('flex items-center', className)}>
            <Select value={activeVersion} onValueChange={setActiveVersion}>
                <SelectTrigger className="h-9 w-full px-3 text-sm font-medium gap-2 justify-between shrink-0">
                    <div className="flex items-center gap-2 truncate">
                        <StackIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Version" />
                    </div>
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[var(--radix-select-trigger-width)]">
                    {availableVersions.map((ver) => (
                        <SelectItem key={ver.id} value={ver.id} className="text-sm">
                            {ver.label || ver.id}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
