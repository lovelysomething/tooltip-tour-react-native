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

  register(id: string, ref: RefObject<any>): void {
    this.refs.set(id, ref)
  }

  unregister(id: string): void {
    this.refs.delete(id)
    this.frames.delete(id)
  }

  /** Called by useTTTarget after layout settles — measures and caches the frame. */
  measureAndCache(id: string, ref: RefObject<any>): Promise<void> {
    return new Promise(resolve => {
      ref.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0) this.frames.set(id, { x, y, width, height })
        resolve()
      })
    })
  }

  frame(id: string): Frame | undefined {
    return this.frames.get(id)
  }

  /** All currently-measured frames — used by the inspector overlay. */
  allFrames(): Map<string, Frame> {
    return this.frames
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
