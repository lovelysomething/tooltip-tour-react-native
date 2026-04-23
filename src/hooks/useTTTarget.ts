import { useRef, useEffect, useCallback, RefObject } from 'react'
import { View } from 'react-native'
import { TTViewRegistry } from '../TTViewRegistry'

/**
 * Mark a view as a tour target and inspector-visible element.
 * Pass the returned ref to any host component's `ref` prop.
 *
 * ```tsx
 * const titleRef = useTTTarget('welcomeTitle')
 * return <Text ref={titleRef}>Welcome</Text>
 * ```
 */
export function useTTTarget(id: string): RefObject<View> {
  const ref = useRef<View>(null)

  // Register immediately on mount
  useEffect(() => {
    TTViewRegistry.register(id, ref)
    return () => TTViewRegistry.unregister(id)
  }, [id])

  // Refresh the frame measurement after every layout
  const onLayout = useCallback(() => {
    void TTViewRegistry.measureAndCache(id, ref)
  }, [id])

  // Attach onLayout via the ref itself isn't possible, but we can trigger
  // the first measurement after mount by using a layout effect.
  useEffect(() => {
    // Defer one frame to let React Native finish its layout pass
    const timer = setTimeout(() => {
      void TTViewRegistry.measureAndCache(id, ref)
    }, 100)
    return () => clearTimeout(timer)
  }, [id])

  return ref
}
