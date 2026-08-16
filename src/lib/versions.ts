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
    const response = await fetch(getDataUrl('/data/versions.json'), { signal })
    if (!response.ok) {
        throw new Error(`Failed to load versions.json (${response.status})`)
    }
    const data: VersionConfig = await response.json()
    return {
        ...data,
        versions: sortVersions(data.versions),
    }
}
