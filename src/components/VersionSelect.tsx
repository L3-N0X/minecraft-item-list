import React, { useState } from 'react'
import { useData } from '../context/DataContext'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StackIcon, PlusIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { CreateVersionDialog } from './CreateVersionDialog'

export function VersionSelect({ className }: { className?: string }) {
    const { activeVersion, availableVersions, setActiveVersion, isStaticMode } =
        useData()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    if (!availableVersions || availableVersions.length === 0) {
        return null
    }

    return (
        <>
            <div className={cn('flex items-center gap-1.5', className)}>
                <Select value={activeVersion} onValueChange={setActiveVersion}>
                    <SelectTrigger className="h-9 flex-1 min-w-[120px] px-3 text-sm font-medium gap-2 justify-between">
                        <div className="flex items-center gap-2 truncate">
                            <StackIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Version" />
                        </div>
                    </SelectTrigger>
                    <SelectContent
                        align="end"
                        className="min-w-[var(--radix-select-trigger-width)]"
                    >
                        {availableVersions.map((ver) => (
                            <SelectItem
                                key={ver.id}
                                value={ver.id}
                                className="text-sm"
                            >
                                {ver.label || ver.id}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {!isStaticMode && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="h-9 w-9 shrink-0"
                        title="Create new version (copy from existing)"
                        aria-label="Create new version"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {!isStaticMode && (
                <CreateVersionDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                />
            )}
        </>
    )
}

