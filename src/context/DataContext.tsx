import React, { createContext, useContext, useState, useEffect, useMemo } from "react"

export interface ItemData {
  displayName: string
  [key: string]: any
}

export type CategoriesData = Record<string, string[]>

interface DataContextType {
  items: Record<string, ItemData>
  itemIds: string[]
  categories: CategoriesData
  updateItem: (id: string, data: ItemData, itemCategories?: string[]) => Promise<void>
  getItemIndex: (id: string) => number
  getItemCategories: (id: string) => string[]
  isLoading: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<string, ItemData>>({})
  const [categories, setCategories] = useState<CategoriesData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/items").then(res => res.json()),
      fetch("/api/categories").then(res => res.json())
    ]).then(([itemsData, categoriesData]) => {
      setItems(itemsData)
      setCategories(categoriesData)
      setIsLoading(false)
    })
  }, [])

  const itemIds = useMemo(() => Object.keys(items).sort(), [items])

  const getItemCategories = (id: string) => {
    return Object.entries(categories)
      .filter(([_, itemIds]) => itemIds.includes(id))
      .map(([catName]) => catName)
  }

  const updateItem = async (id: string, data: ItemData, itemCategories?: string[]) => {
    // Optimistic update
    setItems(prev => ({ ...prev, [id]: data }))
    if (itemCategories) {
      setCategories(prev => {
        const next = { ...prev }
        // Remove item from all
        for (const catName in next) {
          next[catName] = next[catName].filter(itemId => itemId !== id)
        }
        // Add to new
        for (const catName of itemCategories) {
          if (!next[catName]) next[catName] = []
          if (!next[catName].includes(id)) next[catName].push(id)
        }
        return next
      })
    }
    
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data, categories: itemCategories })
      })
      if (!response.ok) throw new Error("Failed to save")
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save to disk!")
    }
  }

  const getItemIndex = (id: string) => itemIds.indexOf(id)

  return (
    <DataContext.Provider value={{ items, itemIds, categories, updateItem, getItemIndex, getItemCategories, isLoading }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
