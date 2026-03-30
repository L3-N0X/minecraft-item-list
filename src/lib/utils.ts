import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Utility to get the correct asset path with base URL
 * Use this for any public folder assets to ensure they work on GitHub Pages
 *
 * @param path - Path relative to the public folder (should start with /)
 * @returns Full path with base URL
 *
 * @example
 * // Instead of: src="/logo.png"
 * // Use: src={getAssetPath("/logo.png")}
 * <img src={getAssetPath("/logo.png")} alt="Logo" />
 */
export function getAssetPath(path: string): string {
    const base = import.meta.env.BASE_URL
    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${base}${cleanPath}`
}

/**
 * Get the API endpoint URL
 * In static mode, uses BASE_URL for data files
 * In dynamic mode, uses /api endpoints
 */
export function getDataUrl(endpoint: string): string {
    const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'
    if (isStaticMode) {
        // In static mode, data files are in the public folder
        return getAssetPath(endpoint)
    }
    // In dynamic mode, use API endpoints
    return endpoint
}
