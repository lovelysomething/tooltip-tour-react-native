import AsyncStorage from '@react-native-async-storage/async-storage'

export interface TTStep {
  id: string
  title?: string
  content?: string  // body copy for the step card
  selector?: string // registered useTTTarget() id to highlight
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

// Matches the nested snake_case shape stored in the dashboard and returned by the API.
export interface TTFabStyles {
  bg_color?: string
  border_radius?: number
  size?: number
  bottom_offset?: number
  position?: string   // e.g. 'right', 'left', 'bottom-right', 'bottom-left'
  icon?: string
}

export interface TTCardStyles {
  bg_color?: string
  border_radius?: number
}

export interface TTTypeStyles {
  title_color?: string
  body_color?: string
  dot_inactive_color?: string
}

export interface TTBtnStyles {
  bg_color?: string
  text_color?: string
  border_radius?: number
}

export interface TTBeaconStyles {
  style?: string
  bg_color?: string
  text_color?: string
}

export interface TTStyles {
  fab?: TTFabStyles
  card?: TTCardStyles
  type?: TTTypeStyles
  btn?: TTBtnStyles
  beacon?: TTBeaconStyles
}

export interface TTDisplayConditions {
  elementCondition?:   { selector: string; rule: 'exists' | 'not_exists' }
  priorTourCondition?: { tourId: string;   rule: 'seen'   | 'completed'  }
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
  displayConditions?: TTDisplayConditions
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
