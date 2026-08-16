import React, { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CopyIcon, PlusIcon, CircleNotchIcon } from '@phosphor-icons/react'

interface CreateVersionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVersionDialog({
    open,
    onOpenChange,
}: CreateVersionDialogProps) {
    const { activeVersion, availableVersions, createVersion } = useData()

    const [sourceVersionId, setSourceVersionId] = useState<string>(activeVersion)
    const [newVersionId, setNewVersionId] = useState<string>('')
    const [newVersionLabel, setNewVersionLabel] = useState<string>('')
    const [setAsDefault, setSetAsDefault] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // Reset state whenever the dialog opens
    useEffect(() => {
        if (open) {
            setSourceVersionId(activeVersion)
            setNewVersionId('')
            setNewVersionLabel('')
            setSetAsDefault(false)
            setError(null)
            setIsSubmitting(false)
        }
    }, [open, activeVersion])

    const trimmedVersionId = newVersionId.trim()
    const trimmedLabel = newVersionLabel.trim()

    // Validation
    const isIdEmpty = trimmedVersionId.length === 0
    const hasInvalidChars = !isIdEmpty && !/^[a-zA-Z0-9._-]+$/.test(trimmedVersionId)
    const isDuplicate =
        !isIdEmpty &&
        availableVersions.some(
            (v) => v.id.toLowerCase() === trimmedVersionId.toLowerCase()
        )

    const canSubmit = !isIdEmpty && !hasInvalidChars && !isDuplicate && !isSubmitting

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        setError(null)
        setIsSubmitting(true)

        try {
            await createVersion({
                sourceVersionId,
                newVersionId: trimmedVersionId,
                newVersionLabel: trimmedLabel || undefined,
                setAsDefault,
            })
            onOpenChange(false)
        } catch (err) {
            console.error('Failed to create version:', err)
            setError(
                err instanceof Error ? err.message : 'Failed to create version'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CopyIcon className="h-5 w-5 text-primary" />
                        Create New Version
                    </DialogTitle>
                    <DialogDescription>
                        Copy an existing version template into a new version ready to be edited and expanded.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="source-version">Copy from Template</Label>
                        <Select
                            value={sourceVersionId}
                            onValueChange={setSourceVersionId}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="source-version" className="w-full">
                                <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableVersions.map((ver) => (
                                    <SelectItem key={ver.id} value={ver.id}>
                                        {ver.label || ver.id}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Copies all items, categories, tags, schema, and structure mappings from this version.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="new-version-id">
                            New Version ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="new-version-id"
                            placeholder="e.g. 26.1-snapshot-11"
                            value={newVersionId}
                            onChange={(e) => setNewVersionId(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                        />
                        {hasInvalidChars && (
                            <p className="text-xs text-destructive">
                                Only alphanumeric characters, dots, dashes, and underscores are allowed.
                            </p>
                        )}
                        {isDuplicate && (
                            <p className="text-xs text-destructive">
                                A version with this ID already exists.
                            </p>
                        )}
                        {!hasInvalidChars && !isDuplicate && (
                            <p className="text-xs text-muted-foreground">
                                Used for directory name and API queries.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="new-version-label">
                            Display Name <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                            id="new-version-label"
                            placeholder={trimmedVersionId || 'e.g. 26.1-snapshot-11'}
                            value={newVersionLabel}
                            onChange={(e) => setNewVersionLabel(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            Human-readable label shown in the version selector.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="set-default"
                            checked={setAsDefault}
                            onCheckedChange={(checked) =>
                                setSetAsDefault(Boolean(checked))
                            }
                            disabled={isSubmitting}
                        />
                        <Label
                            htmlFor="set-default"
                            className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Set as default version for visitors
                        </Label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <CircleNotchIcon className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-4 w-4" />
                                    Create Version
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
