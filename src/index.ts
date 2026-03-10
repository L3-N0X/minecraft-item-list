import { serve } from "bun";
import path from "node:path";
import fs from "node:fs";
import { AsyncLock, readJSON, safeWriteJSON } from "./lib/server-utils";

const isDev = process.env.NODE_ENV !== "production";

// Use a shared lock for file operations
const itemsLock = new AsyncLock();
const categoriesLock = new AsyncLock();

const ITEMS_PATH = "data/items.json";
const CATEGORIES_PATH = "data/categories.json";

const server = serve({
    routes: {
        "/*": async (req) => {
            if (isDev) {
                return new Response("Backend API is running. View the frontend at http://localhost:5173", { status: 200 });
            }

            // Production only: Serve Vite's built static files from the 'dist' directory
            const url = new URL(req.url);
            let relativePath = url.pathname.slice(1);

            // Default to index.html for the root route
            if (relativePath === "") {
                relativePath = "index.html";
            }

            const filePath = path.join(process.cwd(), "dist", relativePath);
            const file = Bun.file(filePath);

            if (await file.exists()) {
                return new Response(file);
            }

            // Client-side routing fallback (React Router):
            // If the file isn't found, serve index.html and let React Router handle the 404
            return new Response(Bun.file(path.join(process.cwd(), "dist/index.html")));
        },

        "/public/*": async (req) => {
            const url = new URL(req.url);
            // Remove leading slash and handle path
            const relativePath = url.pathname.slice(1);
            const filePath = path.join(process.cwd(), relativePath);

            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }
            return new Response("Not Found", { status: 404 });
        },

        "/api/items/download": {
            async GET() {
                const file = Bun.file(ITEMS_PATH);
                return new Response(file, {
                    headers: {
                        "Content-Disposition": `attachment; filename="${path.basename(ITEMS_PATH)}"`,
                        "Content-Type": "application/json",
                    },
                });
            },
        },

        "/api/items": {
            async GET() {
                // For GET, we don't strictly need a lock if we are fine with potentially stale data,
                // but using it ensures we aren't reading while a rename is happening.
                return await itemsLock.runLocked(async () => {
                    const data = await readJSON<any>(ITEMS_PATH);
                    return Response.json(data.items ?? data);
                });
            },
            async POST(req) {
                try {
                    const body = await req.json();
                    const { id, data, categories: itemCategories } = body;

                    // 1. Update Items
                    await itemsLock.runLocked(async () => {
                        const jsonData = await readJSON<any>(ITEMS_PATH);
                        if (jsonData.items !== undefined) {
                            jsonData.items[id] = data;
                        } else {
                            jsonData[id] = data;
                        }
                        await safeWriteJSON(ITEMS_PATH, jsonData);
                    });

                    // 2. Update Categories
                    if (itemCategories) {
                        await categoriesLock.runLocked(async () => {
                            const categories = await readJSON<any>(CATEGORIES_PATH);
                            // Remove item from all existing categories
                            for (const catName in categories) {
                                categories[catName] = categories[catName].filter((itemId: string) => itemId !== id);
                            }
                            // Add item to new categories
                            for (const catName of itemCategories) {
                                if (!categories[catName]) categories[catName] = [];
                                if (!categories[catName].includes(id)) {
                                    categories[catName].push(id);
                                }
                            }
                            // Clean up empty categories
                            for (const catName in categories) {
                                if (categories[catName].length === 0 && catName !== "Uncategorized") {
                                    delete categories[catName];
                                }
                            }
                            await safeWriteJSON(CATEGORIES_PATH, categories);
                        });
                    }

                    return Response.json({ success: true });
                } catch (error: any) {
                    console.error("Error in POST /api/items:", error);
                    return Response.json({ success: false, error: error.message }, { status: 500 });
                }
            },
        },

        "/api/categories": {
            async GET() {
                return await categoriesLock.runLocked(async () => {
                    const data = await readJSON<any>(CATEGORIES_PATH);
                    return Response.json(data);
                });
            },
            async POST(req) {
                try {
                    const categories = await req.json();
                    await categoriesLock.runLocked(async () => {
                        await safeWriteJSON(CATEGORIES_PATH, categories);
                    });
                    return Response.json({ success: true });
                } catch (error: any) {
                    console.error("Error in POST /api/categories:", error);
                    return Response.json({ success: false, error: error.message }, { status: 500 });
                }
            },
        },
    },

    development: isDev && {
        hmr: false,
        // Echo console logs from the browser to the server
        console: true,
    },
});

console.log(`🚀 Server running at ${server.url}`);
