import { serve } from 'bun'
import fs from 'node:fs/promises'
import path from 'node:path'
import { AsyncLock, readJSON, safeWriteJSON } from './lib/server-utils'

const isDev = process.env.NODE_ENV !== 'production'

const itemsLock = new AsyncLock()
const categoriesLock = new AsyncLock()
const versionsLock = new AsyncLock()

const versionsConfigPath = path.join(
    process.cwd(),
    'public',
    'data',
    'versions.json'
)

interface VersionOption {
    id: string
    label: string
    order: number
}

interface VersionConfig {
    defaultVersion: string
    versions: VersionOption[]
}

interface CreateVersionPayload {
    sourceVersionId: string
    newVersionId: string
    newVersionLabel?: string
    setAsDefault?: boolean
}

function getVersionPaths(version?: string | null) {
    const activeVersion = version || '26.1-snapshot-10'
    const versionDir = path.join(
        process.cwd(),
        'public',
        'data',
        'versions',
        activeVersion
    )
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

            // Check if a directory index.html exists (for pre-rendered routes like /impressum)
            const nestedIndex = Bun.file(path.join(filePath, 'index.html'))
            if (await nestedIndex.exists()) {
                return new Response(nestedIndex)
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
                    const {
                        id,
                        data,
                        categories: itemCategories,
                        version: bodyVersion,
                    } = body
                    const version =
                        bodyVersion || url.searchParams.get('version')
                    const { itemsPath, categoriesPath } =
                        getVersionPaths(version)

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

        '/api/versions': {
            async GET() {
                try {
                    return await versionsLock.runLocked(async () => {
                        const data =
                            await readJSON<VersionConfig>(versionsConfigPath)
                        return Response.json(data)
                    })
                } catch (error) {
                    console.error('Error in GET /api/versions:', error)
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
            async POST(req) {
                try {
                    const body = (await req.json()) as CreateVersionPayload
                    const {
                        sourceVersionId,
                        newVersionId: rawNewVersionId,
                        newVersionLabel,
                        setAsDefault,
                    } = body

                    const newVersionId = (rawNewVersionId || '').trim()

                    if (!sourceVersionId) {
                        return Response.json(
                            {
                                success: false,
                                error: 'Source version is required',
                            },
                            { status: 400 }
                        )
                    }

                    if (!newVersionId) {
                        return Response.json(
                            {
                                success: false,
                                error: 'New version ID is required',
                            },
                            { status: 400 }
                        )
                    }

                    // Validate version ID format (alphanumeric, dots, dashes, underscores)
                    if (!/^[a-zA-Z0-9._-]+$/.test(newVersionId)) {
                        return Response.json(
                            {
                                success: false,
                                error: 'Version ID may only contain alphanumeric characters, dots, dashes, and underscores',
                            },
                            { status: 400 }
                        )
                    }

                    const versionsDir = path.join(
                        process.cwd(),
                        'public',
                        'data',
                        'versions'
                    )
                    const sourceDir = path.join(versionsDir, sourceVersionId)
                    const targetDir = path.join(versionsDir, newVersionId)

                    // Verify source directory exists
                    try {
                        const stat = await fs.stat(sourceDir)
                        if (!stat.isDirectory()) {
                            return Response.json(
                                {
                                    success: false,
                                    error: `Source version directory '${sourceVersionId}' is not a directory`,
                                },
                                { status: 400 }
                            )
                        }
                    } catch {
                        return Response.json(
                            {
                                success: false,
                                error: `Source version '${sourceVersionId}' does not exist`,
                            },
                            { status: 400 }
                        )
                    }

                    // Verify target directory does not already exist
                    try {
                        await fs.access(targetDir)
                        return Response.json(
                            {
                                success: false,
                                error: `Version directory '${newVersionId}' already exists`,
                            },
                            { status: 400 }
                        )
                    } catch {
                        // Target directory does not exist, proceed
                    }

                    return await versionsLock.runLocked(async () => {
                        const config =
                            await readJSON<VersionConfig>(versionsConfigPath)

                        if (
                            config.versions.some((v) => v.id === newVersionId)
                        ) {
                            return Response.json(
                                {
                                    success: false,
                                    error: `Version '${newVersionId}' already exists in versions.json`,
                                },
                                { status: 400 }
                            )
                        }

                        // Create new version directory
                        await fs.mkdir(targetDir, { recursive: true })

                        // Copy all valid JSON files from source to target
                        const entries = await fs.readdir(sourceDir, {
                            withFileTypes: true,
                        })

                        for (const entry of entries) {
                            if (
                                entry.isFile() &&
                                entry.name.endsWith('.json') &&
                                !entry.name.endsWith('.bak') &&
                                !entry.name.endsWith('.tmp')
                            ) {
                                const srcFile = path.join(sourceDir, entry.name)
                                const dstFile = path.join(targetDir, entry.name)

                                if (entry.name === 'items.json') {
                                    const itemsContent =
                                        await readJSON<ItemsJsonData>(srcFile)
                                    if (
                                        itemsContent &&
                                        typeof itemsContent === 'object'
                                    ) {
                                        if (
                                            'minecraft_version' in itemsContent
                                        ) {
                                            itemsContent.minecraft_version =
                                                newVersionId
                                        }
                                    }
                                    await safeWriteJSON(dstFile, itemsContent)
                                } else {
                                    await fs.copyFile(srcFile, dstFile)
                                }
                            }
                        }

                        const newVersionOption: VersionOption = {
                            id: newVersionId,
                            label:
                                (newVersionLabel || '').trim() || newVersionId,
                            order: 1,
                        }

                        // Shift existing orders
                        const updatedVersions: VersionOption[] = [
                            newVersionOption,
                            ...config.versions.map((v, idx) => ({
                                ...v,
                                order: idx + 2,
                            })),
                        ]

                        const updatedConfig: VersionConfig = {
                            defaultVersion: setAsDefault
                                ? newVersionId
                                : config.defaultVersion || newVersionId,
                            versions: updatedVersions,
                        }

                        await safeWriteJSON(versionsConfigPath, updatedConfig)

                        return Response.json({
                            success: true,
                            version: newVersionOption,
                            config: updatedConfig,
                        })
                    })
                } catch (error) {
                    console.error('Error in POST /api/versions:', error)
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
