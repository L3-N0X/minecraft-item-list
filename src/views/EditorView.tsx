import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData, type ItemData } from '@/context/DataContext'
import { SchemaForm } from '@/components/SchemaForm'
import { ItemSelector } from '@/components/ItemSelector'
import { CategorySelector } from '@/components/CategorySelector'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    ChevronLeft,
    ChevronRight,
    Copy as CopyIcon,
    ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { getAssetPath } from '@/lib/utils'

export function EditorView() {
    const { id } = useParams<{ id: string }>()
    const {
        items,
        itemIds,
        updateItem,
        getItemIndex,
        getItemCategories,
        isLoading,
    } = useData()
    const navigate = useNavigate()
    const [isCopyDialogOpen, setIsCopyDialogOpen] = React.useState(false)
    const [sourceItemId, setSourceItemId] = React.useState<string | undefined>()
    const copyButtonRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
        if (!isCopyDialogOpen) {
            setSourceItemId(undefined)
        }
    }, [isCopyDialogOpen])

    const currentIndex = id ? getItemIndex(id) : -1
    const currentItem = id ? items[id] : null
    const itemCategories = id ? getItemCategories(id) : []

    if (isLoading) return <div className="p-8 text-center">Loading item...</div>

    if (!id || !currentItem) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-xl text-muted-foreground">Item not found.</p>
                <Button onClick={() => navigate('/')}>Back to List</Button>
            </div>
        )
    }

    const goToPrev = () => {
        if (currentIndex > 0) {
            navigate(`/edit/${itemIds[currentIndex - 1]}`, { replace: true })
        }
    }

    const goToNext = () => {
        if (currentIndex < itemIds.length - 1) {
            navigate(`/edit/${itemIds[currentIndex + 1]}`, { replace: true })
        }
    }

    const handleCopy = () => {
        if (!sourceItemId || !id) return
        const sourceItem = items[sourceItemId]
        if (!sourceItem) return

        // Define fields to EXCLUDE from copying
        const excludedFields = ['displayName', 'displayNameGerman']

        // Create new data object
        const newData = { ...currentItem } as Record<string, unknown>

        // Copy all other fields
        Object.keys(sourceItem).forEach((key) => {
            if (!excludedFields.includes(key)) {
                newData[key] = JSON.parse(
                    JSON.stringify((sourceItem as Record<string, unknown>)[key])
                )
            }
        })

        // Get source item categories
        const sourceCategories = getItemCategories(sourceItemId)

        // Perform update
        updateItem(id, newData as ItemData, sourceCategories)
        setIsCopyDialogOpen(false)
        setSourceItemId(undefined)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Overview
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={goToPrev}
                        disabled={currentIndex <= 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="min-w-90 h-10 text-center">
                        <ItemSelector
                            items={itemIds}
                            selectedItem={id}
                            onSelect={(newId) =>
                                navigate(`/edit/${newId}`, { replace: true })
                            }
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={goToNext}
                        disabled={currentIndex >= itemIds.length - 1}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="border-2">
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-card/60 rounded-md border flex items-center justify-center p-2">
                                <img
                                    src={getAssetPath(`/items/${id}.png`)}
                                    alt=""
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                    }}
                                />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-mono">
                                    {id}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Index: {currentIndex + 1} / {itemIds.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2 pb-6 border-b">
                        <div className="flex">
                            <Label className="text-lg font-semibold flex-1">
                                Categories
                            </Label>
                            <Dialog
                                open={isCopyDialogOpen}
                                onOpenChange={setIsCopyDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <CopyIcon className="mr-2 h-4 w-4" />
                                        Copy from Item
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-150">
                                    <form
                                        className="contents"
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            handleCopy()
                                        }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle>
                                                Copy details from another item
                                            </DialogTitle>
                                            <DialogDescription>
                                                Select an item to copy its
                                                properties and categories. Names
                                                and textures will not be copied.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-6">
                                            <Label
                                                htmlFor="source-item"
                                                className="mb-2 block"
                                            >
                                                Source Item
                                            </Label>
                                            <ItemSelector
                                                items={itemIds.filter(
                                                    (itemId) => itemId !== id
                                                )}
                                                selectedItem={sourceItemId}
                                                onSelect={(newId) => {
                                                    setSourceItemId(newId)
                                                    // After selection, focus the copy button so the next Enter confirms
                                                    setTimeout(
                                                        () =>
                                                            copyButtonRef.current?.focus(),
                                                        50
                                                    )
                                                }}
                                                autoOpen={true}
                                                onConfirm={handleCopy}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={() =>
                                                    setIsCopyDialogOpen(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                ref={copyButtonRef}
                                                type="submit"
                                                disabled={!sourceItemId}
                                            >
                                                Copy Details
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CategorySelector
                            selectedCategories={itemCategories}
                            onChange={(newCats) =>
                                updateItem(id, currentItem, newCats)
                            }
                        />
                    </div>
                    <SchemaForm
                        data={currentItem}
                        onChange={(newData) =>
                            updateItem(id, newData as ItemData, itemCategories)
                        }
                    />

                    <div className="flex items-center justify-between pt-6 border-t mt-2">
                        <Button
                            variant="outline"
                            onClick={goToPrev}
                            disabled={currentIndex <= 0}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            {currentIndex + 1} / {itemIds.length}
                        </span>

                        <Button
                            variant="outline"
                            onClick={goToNext}
                            disabled={currentIndex >= itemIds.length - 1}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
