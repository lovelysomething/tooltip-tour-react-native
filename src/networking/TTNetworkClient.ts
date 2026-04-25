import AsyncStorage from '@react-native-async-storage/async-storage'

export interface TTStep {
  id: string
  title?: string
  body?: string
  targetId?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  order: number
}

export interface TTCarouselSlide {
  title?: string
  description?: string
  imageUrl?: string
  logoUrl?: string
}

export interface TTSplashCarousel {
  slides: TTCarouselSlide[]
  bgColor?: string
  textColor?: string
  maxShows?: number
}

export interface TTFabStyles {
  size?: number
  bottomOffset?: number
  position?: 'left' | 'right'
  icon?: string
}

export interface TTStyles {
  fabBgColor?: string
  fab?: TTFabStyles
  btnBorderRadius?: number
}

export interface TTConfig {
  id: string
  name?: string
  pagePattern: string
  steps: TTStep[]
  startMinimized?: boolean
  maxShows?: number
  fabLabel?: string
  welcomeTitle?: string
  welcomeMessage?: string
  welcomeEmoji?: string
  autoOpen?: boolean
  splashCarousel?: TTSplashCarousel
  styles?: TTStyles
}

interface TTKnownPage {
  configId: string
  bgColor?: string
  position?: 'left' | 'right'
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export class TTNetworkClient {
  constructor(
    private readonly baseURL: string,
    private readonly siteKey: string,
  ) {}

  async fetchAllConfigs(): Promise<TTConfig[]> {
    const cacheKey = `tt-configs-${this.siteKey}`
    const tsKey    = `tt-configs-ts-${this.siteKey}`

    try {
      const [raw, ts] = await Promise.all([
        AsyncStorage.getItem(cacheKey),
        AsyncStorage.getItem(tsKey),
      ])
      if (raw && ts && Date.now() - Number(ts) < CACHE_TTL_MS) {
        return JSON.parse(raw) as TTConfig[]
      }
    } catch { /* cache miss */ }

    try {
      const res = await fetch(`${this.baseURL}/api/walkthrough/${this.siteKey}?prefetch=true`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) return []
      const configs = (await res.json()) as TTConfig[]
      await AsyncStorage.multiSet([
        [cacheKey, JSON.stringify(configs)],
        [tsKey, String(Date.now())],
      ])
      return configs
    } catch {
      return []
    }
  }

  async configForPage(page: string): Promise<TTConfig | null> {
    const configs = await this.fetchAllConfigs()
    return configs.find(c => c.pagePattern === page) ?? null
  }

  async updateInspectorSession(sessionId: string, identifier: string, displayName: string): Promise<void> {
    try {
      await fetch(`${this.baseURL}/api/inspector/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, displayName }),
      })
    } catch { /* fire and forget */ }
  }

  getKnownPage(page: string): TTKnownPage | null {
    // Known-pages cache is stored in AsyncStorage but read synchronously via a
    // pre-loaded in-memory snapshot. See TTViewRegistry.knownPages for details.
    return null
  }
}
