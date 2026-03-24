import fs from 'node:fs/promises'

/**
 * A simple asynchronous lock to serialize file operations.
 */
export class AsyncLock {
    private promise: Promise<void> = Promise.resolve()

    async acquire(): Promise<() => void> {
        let release: () => void
        const nextPromise = new Promise<void>((resolve) => {
            release = resolve
        })
        const currentPromise = this.promise
        this.promise = currentPromise.then(() => nextPromise)
        await currentPromise
        return release!
    }

    async runLocked<T>(fn: () => Promise<T>): Promise<T> {
        const release = await this.acquire()
        try {
            return await fn()
        } finally {
            release()
        }
    }
}

/**
 * Safely reads a JSON file.
 */
export async function readJSON<T>(filePath: string): Promise<T> {
    try {
        const content = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error)
        throw error
    }
}

/**
 * Safely writes a JSON file using an atomic rename pattern.
 * Creates a backup of the existing file before overwriting.
 */
export async function safeWriteJSON<T>(
    filePath: string,
    data: T
): Promise<void> {
    const tempPath = `${filePath}.tmp`
    const backupPath = `${filePath}.bak`

    try {
        const content = JSON.stringify(data, null, 4)

        await fs.writeFile(tempPath, content, 'utf-8')

        try {
            await fs.access(filePath)
            await fs.copyFile(filePath, backupPath)
        } catch {
            // File might not exist yet, ignore
        }

        await fs.rename(tempPath, filePath)
    } catch (error) {
        console.error(`Error safely writing JSON to ${filePath}:`, error)
        try {
            await fs.unlink(tempPath)
        } catch {
            // Ignore cleanup errors
        }
        throw error
    }
}
