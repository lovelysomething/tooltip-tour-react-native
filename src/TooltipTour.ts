import { Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TTNetworkClient, TTConfig } from './networking/TTNetworkClient'
import { TTEventTracker, TTEventType } from './networking/TTEventTracker'
import { TTViewRegistry } from './TTViewRegistry'

export interface TTConfigureOptions {
  siteKey: string
  baseURL: string
}

type SessionListener = () => void
type ScrollCallback = (targetId: string) => void

/** Singleton SDK — mirrors iOS TooltipTour and Android TooltipTour. */
class TooltipTourClass {
  private _siteKey    = ''
  private _baseURL    = ''
  private _client:  TTNetworkClient | null = null
  private _tracker: TTEventTracker  | null = null

  private _currentPage: string | null = null
  private _currentConfig: TTConfig | null = null

  private _onSessionStart: SessionListener[] = []
  private _onSessionEnd:   SessionListener[] = []

  private _isSessionActive = false
  private _isInspectorActive = false

  // ── Configure ──────────────────────────────────────────────────────────────

  configure(options: TTConfigureOptions): void {
    this._siteKey = options.siteKey
    this._baseURL = options.baseURL.replace(/\/$/, '')
    this._client  = new TTNetworkClient(this._baseURL, this._siteKey)
    this._tracker = new TTEventTracker(this._baseURL, this._siteKey)
    // Invalidate any cached config so each app start always fetches the latest
    // from the server — prevents stale configs (e.g. newly-enabled carousels)
    // from being served after a dashboard change.
    AsyncStorage.removeItem(`tt-configs-${options.siteKey}`).catch(() => {})
    AsyncStorage.removeItem(`tt-configs-ts-${options.siteKey}`).catch(() => {})
  }

  // ── Page registration ──────────────────────────────────────────────────────

  setPage(page: string | null): void {
    this._currentPage = page
  }

  get currentPage(): string | null { return this._currentPage }
  get siteKey(): string { return this._siteKey }
  get baseURL(): string { return this._baseURL }
  get client(): TTNetworkClient | null { return this._client }
  get tracker(): TTEventTracker | null { return this._tracker }
  get isSessionActive(): boolean { return this._isSessionActive }
  get isInspectorActive(): boolean { return this._isInspectorActive }

  // ── Config loading ─────────────────────────────────────────────────────────

  async loadConfig(page: string | null): Promise<TTConfig | null> {
    if (!page || !this._client) return null
    return this._client.configForPage(page)
  }

  // ── Session ────────────────────────────────────────────────────────────────

  startSession(config: TTConfig): void {
    this._isSessionActive = true
    this._currentConfig   = config
    this._tracker?.track(TTEventType.GUIDE_STARTED, config.id)
    this._onSessionStart.forEach(fn => fn())
  }

  endSession(): void {
    this._isSessionActive = false
    this._currentConfig   = null
    this._onSessionEnd.forEach(fn => fn())
  }

  onSessionStart(fn: SessionListener): void { this._onSessionStart.push(fn) }
  onSessionEnd(fn: SessionListener):   void { this._onSessionEnd.push(fn) }

  // ── Persistence helpers (mirrors iOS/Android shared prefs) ─────────────────

  async getInt(key: string): Promise<number> {
    try { return parseInt((await AsyncStorage.getItem(key)) ?? '0') || 0 } catch { return 0 }
  }

  async setInt(key: string, value: number): Promise<void> {
    try { await AsyncStorage.setItem(key, String(value)) } catch {}
  }

  async getBool(key: string): Promise<boolean> {
    try { return (await AsyncStorage.getItem(key)) === 'true' } catch { return false }
  }

  async setBool(key: string, value: boolean): Promise<void> {
    try { await AsyncStorage.setItem(key, value ? 'true' : 'false') } catch {}
  }

  isDismissed(configId: string): Promise<boolean> {
    return this.getBool(`tt-dismissed-${configId}`)
  }

  dismiss(configId: string): Promise<void> {
    return this.setBool(`tt-dismissed-${configId}`, true)
  }

  isSessionMinimised(configId: string): Promise<boolean> {
    return this.getBool(`tt-minimised-${configId}`)
  }

  setSessionMinimised(configId: string, value: boolean): Promise<void> {
    return this.setBool(`tt-minimised-${configId}`, value)
  }

  showCount(configId: string): Promise<number> {
    return this.getInt(`tt-shows-${configId}`)
  }

  async incrementShowCount(configId: string): Promise<void> {
    const count = await this.showCount(configId)
    await this.setInt(`tt-shows-${configId}`, count + 1)
  }

  carouselShowCount(configId: string): Promise<number> {
    return this.getInt(`tt-carousel-shows-${configId}`)
  }

  async incrementCarouselShowCount(configId: string): Promise<void> {
    const count = await this.carouselShowCount(configId)
    await this.setInt(`tt-carousel-shows-${configId}`, count + 1)
  }

  isCompleted(configId: string): Promise<boolean> {
    return this.getBool(`tt-completed-${configId}`)
  }

  markCompleted(configId: string): Promise<void> {
    return this.setBool(`tt-completed-${configId}`, true)
  }

  // ── Scrollable registration ────────────────────────────────────────────────

  registerScrollable(page: string, callback: ScrollCallback): void {
    TTViewRegistry.registerScrollable(page, callback)
  }

  // ── Deep link handling ─────────────────────────────────────────────────────

  handleDeepLink(url: string): void {
    try {
      const parsed = new URL(url)
      if (parsed.hostname !== 'inspect') return
      const sessionId = parsed.searchParams.get('session')
      const base      = parsed.searchParams.get('base')
      const mode      = (parsed.searchParams.get('mode') ?? 'element') as 'element' | 'page'
      if (!sessionId || !base) return
      this._isInspectorActive = true
      // TTInspectorView reads isInspectorActive and auto-shows itself
      this._inspectorSession  = { sessionId, base, mode }
    } catch { /* malformed URL */ }
  }

  // Inspector session info — consumed by TTInspectorView
  private _inspectorSession: { sessionId: string; base: string; mode: 'element' | 'page' } | null = null

  getInspectorSession() { return this._inspectorSession }

  clearInspectorSession(): void {
    this._inspectorSession  = null
    this._isInspectorActive = false
  }
}

export const TooltipTour = new TooltipTourClass()
