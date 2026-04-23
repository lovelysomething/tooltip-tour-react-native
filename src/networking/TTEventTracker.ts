/** Mirrors iOS TTEventTracker and Android TTEventTracker exactly — same 9 event types, same payload. */

export enum TTEventType {
  GUIDE_SHOWN            = 'guide_shown',
  GUIDE_STARTED          = 'guide_started',
  STEP_VIEWED            = 'step_viewed',
  GUIDE_COMPLETED        = 'guide_completed',
  GUIDE_DISMISSED        = 'guide_dismissed',
  CAROUSEL_SHOWN         = 'carousel_shown',
  CAROUSEL_SLIDE_VIEWED  = 'carousel_slide_viewed',
  CAROUSEL_COMPLETED     = 'carousel_completed',
  CAROUSEL_DISMISSED     = 'carousel_dismissed',
}

export class TTEventTracker {
  private readonly sessionId: string

  constructor(
    private readonly baseURL: string,
    private readonly siteKey: string,
  ) {
    this.sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  track(event: TTEventType, walkthroughId: string, stepIndex?: number): void {
    // Fire and forget — never await this
    void this._send(event, walkthroughId, stepIndex)
  }

  private async _send(event: TTEventType, walkthroughId: string, stepIndex?: number): Promise<void> {
    try {
      const body: Record<string, unknown> = {
        walkthroughId,
        siteKey: this.siteKey,
        eventType: event,
        sessionId: this.sessionId,
      }
      if (stepIndex !== undefined) body.stepIndex = stepIndex

      await fetch(`${this.baseURL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch { /* fire and forget */ }
  }
}
