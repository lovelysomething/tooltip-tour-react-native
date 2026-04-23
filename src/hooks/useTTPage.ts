import { useEffect } from 'react'
import { TooltipTour } from '../TooltipTour'

/**
 * Register the current screen with the SDK.
 * Call at the top of every screen component that should trigger a tour.
 *
 * ```tsx
 * function HomeScreen() {
 *   useTTPage('home')
 *   // ...
 * }
 * ```
 */
export function useTTPage(pageId: string): void {
  useEffect(() => {
    TooltipTour.setPage(pageId)
    return () => {
      // Clear page when this screen unmounts — so a blank screen doesn't keep
      // the stale page active and trigger the wrong tour.
      if (TooltipTour.currentPage === pageId) {
        TooltipTour.setPage(null)
      }
    }
  }, [pageId])
}
