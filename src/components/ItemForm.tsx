import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

export interface ItemFormData {
    displayName: string
    category: string
    description: string
    attributes: Record<string, unknown>
}

interface ItemFormProps {
    itemId: string
    data: ItemFormData
    onChange: (updatedData: ItemFormData) => void
}

export function ItemForm({ itemId, data, onChange }: ItemFormProps) {
    const [localAttr, setLocalAttr] = React.useState(
        JSON.stringify(data.attributes, null, 2)
    )
    const [jsonError, setJsonError] = React.useState<string | null>(null)

    React.useEffect(() => {
        setLocalAttr(JSON.stringify(data.attributes, null, 2))
        setJsonError(null)
    }, [itemId, data.attributes])

    const handleFieldChange = (field: keyof ItemFormData, value: string) => {
        onChange({ ...data, [field]: value })
    }

    const handleAttrChange = (value: string) => {
        setLocalAttr(value)
        try {
            const parsed = JSON.parse(value)
            setJsonError(null)
            onChange({ ...data, attributes: parsed })
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="font-mono text-xl">{itemId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={data.displayName}
                            onChange={(e) =>
                                handleFieldChange('displayName', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            value={data.category}
                            onChange={(e) =>
                                handleFieldChange('category', e.target.value)
                            }
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) =>
                            handleFieldChange('description', e.target.value)
                        }
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="attributes">Attributes (JSON)</Label>
                        {jsonError && (
                            <span className="text-xs text-destructive">
                                {jsonError}
                            </span>
                        )}
                    </div>
                    <Textarea
                        id="attributes"
                        className={`font-mono h-48 ${jsonError ? 'border-destructive' : ''}`}
                        value={localAttr}
                        onChange={(e) => handleAttrChange(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
