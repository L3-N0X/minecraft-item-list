import { getDataUrl } from './utils'

export interface VersionOption {
    id: string
    label: string
    order: number
}

export interface VersionConfig {
    defaultVersion: string
    versions: VersionOption[]
}

export interface CreateVersionPayload {
    sourceVersionId: string
    newVersionId: string
    newVersionLabel?: string
    setAsDefault?: boolean
}

export function sortVersions(versions: VersionOption[]): VersionOption[] {
    return [...versions].sort((a, b) => a.order - b.order)
}

export function validateVersion(
    requestedVersion: string | null | undefined,
    config: VersionConfig
): string {
    if (
        requestedVersion &&
        config.versions.some((v) => v.id === requestedVersion)
    ) {
        return requestedVersion
    }
    return config.defaultVersion
}

export async function fetchVersionConfig(
    signal?: AbortSignal
): Promise<VersionConfig> {
    const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'
    const url = isStaticMode
        ? getDataUrl('/data/versions.json')
        : `/api/versions`

    const response = await fetch(url, { signal }).catch(async () => {
        // Fallback to static data file if API fails
        return fetch(getDataUrl('/data/versions.json'), { signal })
    })

    if (!response.ok) {
        throw new Error(`Failed to load versions (${response.status})`)
    }
    const data: VersionConfig = await response.json()
    return {
        ...data,
        versions: sortVersions(data.versions),
    }
}

export async function createVersionApi(
    payload: CreateVersionPayload
): Promise<{ success: boolean; version: VersionOption; config: VersionConfig }> {
    const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create version')
    }

    return {
        ...data,
        config: {
            ...data.config,
            versions: sortVersions(data.config.versions),
        },
    }
}

