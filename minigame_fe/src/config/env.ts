const DEFAULT_API_BASE_URL = ''

function normalizeApiBaseUrl(value?: string): string {
  const candidate = value?.trim()
  if (!candidate) {
    return DEFAULT_API_BASE_URL
  }

  // Accept absolute URL or relative path prefix (for dev proxy usage).
  if (/^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/$/, '')
  }

  if (!candidate.startsWith('/')) {
    return DEFAULT_API_BASE_URL
  }

  return candidate.replace(/\/$/, '')
}

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const env = {
  apiBaseUrl,
  wsUrl: import.meta.env.VITE_WS_URL?.trim() || `${apiBaseUrl}/ws`,
}

