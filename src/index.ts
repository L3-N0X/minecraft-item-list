import { serve } from "bun";
import path from "node:path";
import fs from "node:fs";
import index from "./index.html";

const isDev = process.env.NODE_ENV !== "production";

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
                const file = Bun.file("data/items.json");
                return new Response(file, {
                    headers: {
                        "Content-Disposition": 'attachment; filename="items.json"',
                        "Content-Type": "application/json",
                    },
                });
            },
        },

        "/api/items": {
            async GET() {
                const data = await Bun.file("data/items.json").json();
                // New schema wraps items under an "items" key alongside "minecraft_version"
                return Response.json(data.items ?? data);
            },
            async POST(req) {
                const body = await req.json();
                const { id, data, categories: itemCategories } = body;
                const jsonData = await Bun.file("data/items.json").json();
                // Support both new schema ({ minecraft_version, items: {...} }) and legacy flat schema
                if (jsonData.items !== undefined) {
                    jsonData.items[id] = data;
                } else {
                    jsonData[id] = data;
                }
                await Bun.write("data/items.json", JSON.stringify(jsonData, null, 4));

                if (itemCategories) {
                    const categories = await Bun.file("data/categories.json").json();
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
                    await Bun.write("data/categories.json", JSON.stringify(categories, null, 2));
                }

                return Response.json({ success: true });
            },
        },

        "/api/categories": {
            async GET() {
                const data = await Bun.file("data/categories.json").json();
                return Response.json(data);
            },
            async POST(req) {
                const categories = await req.json();
                await Bun.write("data/categories.json", JSON.stringify(categories, null, 2));
                return Response.json({ success: true });
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
