import { serve } from 'bun'
import path from 'node:path'
import { AsyncLock, readJSON, safeWriteJSON } from './lib/server-utils'

const isDev = process.env.NODE_ENV !== 'production'

const itemsLock = new AsyncLock()
const categoriesLock = new AsyncLock()

function getVersionPaths(version?: string | null) {
    const activeVersion = version || '26.1-snapshot-10'
    const versionDir = path.join(process.cwd(), 'public', 'data', 'versions', activeVersion)
    return {
        itemsPath: path.join(versionDir, 'items.json'),
        categoriesPath: path.join(versionDir, 'categories.json'),
    }
}

interface ItemsJsonData {
    items?: Record<string, Record<string, unknown>>
    [key: string]: unknown
}

interface CategoriesJsonData {
    [category: string]: string[]
}

type ItemUpdatePayload = {
    id: string
    data: Record<string, unknown>
    categories?: string[]
    version?: string
}

const server = serve({
    routes: {
        '/*': async (req) => {
            if (isDev) {
                return new Response(
                    'Backend API is running. View the frontend at http://localhost:5173',
                    { status: 200 }
                )
            }

            // Production only: Serve Vite's built static files from the 'dist' directory
            const url = new URL(req.url)
            let relativePath = url.pathname.slice(1)

            // Default to index.html for the root route
            if (relativePath === '') {
                relativePath = 'index.html'
            }

            const filePath = path.join(process.cwd(), 'dist', relativePath)
            const file = Bun.file(filePath)

            if (await file.exists()) {
                return new Response(file)
            }

            // Client-side routing fallback (React Router):
            // If the file isn't found, serve index.html and let React Router handle the 404
            return new Response(
                Bun.file(path.join(process.cwd(), 'dist/index.html'))
            )
        },

        '/public/*': async (req) => {
            const url = new URL(req.url)
            // Remove leading slash and handle path
            const relativePath = url.pathname.slice(1)
            const filePath = path.join(process.cwd(), relativePath)

            const file = Bun.file(filePath)
            if (await file.exists()) {
                return new Response(file)
            }
            return new Response('Not Found', { status: 404 })
        },

        '/api/items/download': {
            async GET(req) {
                const url = new URL(req.url)
                const version = url.searchParams.get('version')
                const { itemsPath } = getVersionPaths(version)
                const file = Bun.file(itemsPath)
                return new Response(file, {
                    headers: {
                        'Content-Disposition': `attachment; filename="${path.basename(itemsPath)}"`,
                        'Content-Type': 'application/json',
                    },
                })
            },
        },

        '/api/items': {
            async GET(req) {
                const url = new URL(req.url)
                const version = url.searchParams.get('version')
                const { itemsPath } = getVersionPaths(version)
                return await itemsLock.runLocked(async () => {
                    const data = await readJSON<ItemsJsonData>(itemsPath)
                    return Response.json(data.items ?? data)
                })
            },
            async POST(req) {
                try {
                    const url = new URL(req.url)
                    const body = (await req.json()) as ItemUpdatePayload
                    const { id, data, categories: itemCategories, version: bodyVersion } = body
                    const version = bodyVersion || url.searchParams.get('version')
                    const { itemsPath, categoriesPath } = getVersionPaths(version)

                    await itemsLock.runLocked(async () => {
                        const jsonData =
                            await readJSON<ItemsJsonData>(itemsPath)
                        if (jsonData.items !== undefined) {
                            jsonData.items[id] = data
                        } else {
                            ;(jsonData as Record<string, unknown>)[id] = data
                        }
                        await safeWriteJSON(itemsPath, jsonData)
                    })

                    if (itemCategories) {
                        await categoriesLock.runLocked(async () => {
                            const categories =
                                await readJSON<CategoriesJsonData>(
                                    categoriesPath
                                )
                            for (const catName in categories) {
                                if (categories[catName]) {
                                    categories[catName] = categories[
                                        catName
                                    ].filter((itemId) => itemId !== id)
                                }
                            }
                            for (const catName of itemCategories) {
                                if (!categories[catName])
                                    categories[catName] = []
                                if (!categories[catName].includes(id)) {
                                    categories[catName].push(id)
                                }
                            }
                            for (const catName in categories) {
                                if (
                                    categories[catName] &&
                                    categories[catName].length === 0 &&
                                    catName !== 'Uncategorized'
                                ) {
                                    delete categories[catName]
                                }
                            }
                            await safeWriteJSON(categoriesPath, categories)
                        })
                    }

                    return Response.json({ success: true })
                } catch (error) {
                    console.error('Error in POST /api/items:', error)
                    return Response.json(
                        {
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error',
                        },
                        { status: 500 }
                    )
                }
            },
        },

        '/api/categories': {
            async GET(req) {
                const url = new URL(req.url)
                const version = url.searchParams.get('version')
                const { categoriesPath } = getVersionPaths(version)
                return await categoriesLock.runLocked(async () => {
                    const data =
                        await readJSON<CategoriesJsonData>(categoriesPath)
                    return Response.json(data)
                })
            },
            async POST(req) {
                try {
                    const url = new URL(req.url)
                    const version = url.searchParams.get('version')
                    const { categoriesPath } = getVersionPaths(version)
                    const categories = await req.json()
                    await categoriesLock.runLocked(async () => {
                        await safeWriteJSON(categoriesPath, categories)
                    })
                    return Response.json({ success: true })
                } catch (error) {
                    console.error('Error in POST /api/categories:', error)
                    return Response.json(
                        {
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error',
                        },
                        { status: 500 }
                    )
                }
            },
        },
    },

    development: isDev && {
        hmr: false,
        // Echo console logs from the browser to the server
        console: true,
    },
})

console.log(`🚀 Server running at ${server.url}`)
