import { RefObject } from 'react'

interface Frame {
  x: number; y: number; width: number; height: number
}

type ScrollCallback = (targetId: string) => void

/** Global registry of all .ttTarget() element frames and scroll callbacks. */
class TTViewRegistryClass {
  private frames: Map<string, Frame> = new Map()
  private refs:   Map<string, RefObject<any>> = new Map()
  private scrollCallbacks: Map<string, ScrollCallback> = new Map()
  /** Which page each target belongs to — so the inspector only highlights the
   *  current page's targets. Native-stack keeps previous screens mounted, so
   *  without this the inspector shows every mounted screen's targets at once. */
  private targetPages: Map<string, string> = new Map()
  private activePage: string | null = null

  /** Set by useTTPage so newly-measured targets get tagged with their page. */
  setActivePage(page: string | null): void {
    this.activePage = page
  }

  register(id: string, ref: RefObject<any>): void {
    this.refs.set(id, ref)
  }

  unregister(id: string): void {
    this.refs.delete(id)
    this.frames.delete(id)
    this.targetPages.delete(id)
  }

  /** Called by useTTTarget after layout settles — measures and caches the frame. */
  measureAndCache(id: string, ref: RefObject<any>): Promise<void> {
    return new Promise(resolve => {
      // Guard: if ref is not attached, resolve immediately so Promise.all doesn't hang
      if (!ref.current) { resolve(); return }
      ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0) {
          this.frames.set(id, { x, y, width, height })
          // Tag the target with the page active when it first measured. The
          // screen's useTTPage runs before this fires, so this is its own page.
          if (this.activePage && !this.targetPages.has(id)) {
            this.targetPages.set(id, this.activePage)
          }
        }
        resolve()
      })
    })
  }

  frame(id: string): Frame | undefined {
    return this.frames.get(id)
  }

  getRef(id: string): RefObject<any> | undefined {
    return this.refs.get(id)
  }

  /** All currently-measured frames — used by the inspector overlay. */
  allFrames(): Map<string, Frame> {
    return this.frames
  }

  /** Frames for a single page — used by the inspector so it only highlights the
   *  page the user is on. Falls back to all frames if the page is unknown. */
  framesForPage(page: string | null): Map<string, Frame> {
    if (!page) return this.frames
    const out = new Map<string, Frame>()
    for (const [id, frame] of this.frames) {
      if (this.targetPages.get(id) === page) out.set(id, frame)
    }
    // If nothing is tagged for this page (e.g. tags not captured yet), don't
    // hide everything — degrade to showing all rather than a blank overlay.
    return out.size > 0 ? out : this.frames
  }

  /** Refresh all frames — called when inspector enters Highlight mode. */
  async refreshAll(): Promise<void> {
    await Promise.all(
      Array.from(this.refs.entries()).map(([id, ref]) => this.measureAndCache(id, ref))
    )
  }

  registerScrollable(page: string, callback: ScrollCallback): void {
    this.scrollCallbacks.set(page, callback)
  }

  scrollTo(page: string, targetId: string): void {
    this.scrollCallbacks.get(page)?.(targetId)
  }
}

export const TTViewRegistry = new TTViewRegistryClass()
