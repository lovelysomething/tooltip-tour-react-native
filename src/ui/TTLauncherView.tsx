import React, { useState, useEffect, useRef } from 'react'
import {
  View, TouchableOpacity, StyleSheet, Animated, useWindowDimensions,
  ActivityIndicator, Text,
} from 'react-native'
import { TTConfig } from '../networking/TTNetworkClient'
import { TTEventType } from '../networking/TTEventTracker'
import { TooltipTour } from '../TooltipTour'
import { TTViewRegistry } from '../TTViewRegistry'
import { TTWelcomeCardView } from './TTWelcomeCardView'
import { TTSplashCarouselView } from './TTSplashCarouselView'
import { TTSpotlightView } from './TTSpotlightView'
import { TTBeaconView } from './TTBeaconView'
import { TTStepCardView } from './TTStepCardView'
import { TTInspectorView } from './TTInspectorView'
import { parseColor } from './utils'

type LauncherState = 'hidden' | 'loading' | 'carousel' | 'welcome' | 'fab' | 'session'

/**
 * TTLauncherView — place one instance above your navigator in App.tsx.
 *
 * Mirrors iOS TTLauncherView.swift and Android TTLauncherView.kt exactly:
 * auto-shows welcome card based on show count + session-minimised state.
 */
export function TTLauncherView() {
  const [launcherState, setLauncherState] = useState<LauncherState>('hidden')
  const [config, setConfig]               = useState<TTConfig | null>(null)
  const [stepIndex, setStepIndex]         = useState(0)
  const [carouselShownThisSession, setCarouselShownThisSession] = useState(false)

  // Session-end observer
  useEffect(() => {
    const unsub = TooltipTour.onSessionEnd as any
    // We re-check config when session ends to decide FAB vs hidden
  }, [])

  // Poll for page changes and inspector activation
  const [tick, setTick] = useState(0)
  const [inspSession, setInspSession] = useState(() => TooltipTour.getInspectorSession())
  const prevPageRef = useRef<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      // Page change → re-evaluate launcher state
      const page = TooltipTour.currentPage
      if (page !== prevPageRef.current) {
        prevPageRef.current = page
        setTick(t => t + 1)
      }
      // Inspector activation via deep link → show inspector overlay
      const session = TooltipTour.getInspectorSession()
      setInspSession(prev => {
        if (prev === session) return prev
        return session
      })
    }, 300)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (TooltipTour.isInspectorActive) {
      setLauncherState('hidden')
      return
    }

    let cancelled = false

    async function evaluate() {
      const page = TooltipTour.currentPage
      if (!page) { setLauncherState('hidden'); setConfig(null); return }

      setLauncherState('loading')
      const cfg = await TooltipTour.loadConfig(page)
      if (cancelled) return

      if (!cfg) { setLauncherState('hidden'); setConfig(null); return }

      // Prior-tour display condition (element condition N/A on mobile)
      const dc = cfg.displayConditions?.priorTourCondition
      if (dc) {
        const seen = await TooltipTour.showCount(dc.tourId) > 0
        const done = await TooltipTour.isCompleted(dc.tourId)
        if (dc.rule === 'seen'      && !seen) { setLauncherState('hidden'); setConfig(null); return }
        if (dc.rule === 'completed' && !done) { setLauncherState('hidden'); setConfig(null); return }
      }

      setConfig(cfg)

      const id          = cfg.id
      const isDismissed = await TooltipTour.isDismissed(id)
      const showCount   = await TooltipTour.showCount(id)
      const isMinimised = await TooltipTour.isSessionMinimised(id)
      const maxReached  = cfg.maxShows != null && showCount >= cfg.maxShows

      // Carousel check
      const carousel = cfg.splashCarousel
      if (carousel && carousel.slides.length > 0 && !carouselShownThisSession && !isDismissed) {
        const carouselShows    = await TooltipTour.carouselShowCount(id)
        const carouselMaxReach = carousel.maxShows != null && carouselShows >= carousel.maxShows
        if (!carouselMaxReach) {
          await TooltipTour.incrementCarouselShowCount(id)
          setCarouselShownThisSession(true)
          setLauncherState('carousel')
          TooltipTour.tracker?.track(TTEventType.CAROUSEL_SHOWN, id)
          return
        }
      }

      if (isDismissed || maxReached) {
        setLauncherState('hidden')
      } else if (cfg.startMinimized || isMinimised) {
        setLauncherState('fab')
      } else {
        setLauncherState('welcome')
        await TooltipTour.incrementShowCount(id)
        TooltipTour.tracker?.track(TTEventType.GUIDE_SHOWN, id)
      }
    }

    void evaluate()
    return () => { cancelled = true }
  }, [tick])

  async function continueAfterCarousel() {
    const cfg = config
    if (!cfg) return
    const id          = cfg.id
    const isDismissed = await TooltipTour.isDismissed(id)
    const showCount   = await TooltipTour.showCount(id)
    const isMinimised = await TooltipTour.isSessionMinimised(id)
    const maxReached  = cfg.maxShows != null && showCount >= cfg.maxShows
    if (cfg.steps.length === 0) { setLauncherState('fab'); return }
    if (isDismissed || maxReached) { setLauncherState('hidden'); return }
    if (cfg.startMinimized || isMinimised) { setLauncherState('fab'); return }
    await TooltipTour.incrementShowCount(id)
    setLauncherState('welcome')
  }

  function handleStart() {
    if (!config) return
    setLauncherState('session')
    setStepIndex(0)
    TooltipTour.startSession(config)
    scrollToCurrentStep(config, 0)
  }

  function scrollToCurrentStep(cfg: TTConfig, idx: number) {
    const step = cfg.steps[idx]
    if (!step?.selector) return
    const page = TooltipTour.currentPage
    if (page) TTViewRegistry.scrollTo(page, step.selector)
  }

  function handleNext() {
    if (!config) return
    const nextIdx = stepIndex + 1
    if (nextIdx >= config.steps.length) {
      // Done — mark completed + minimised so the FAB shows on next evaluate, then show it now
      TooltipTour.tracker?.track(TTEventType.GUIDE_COMPLETED, config.id)
      TooltipTour.markCompleted(config.id)
      TooltipTour.endSession()
      TooltipTour.setSessionMinimised(config.id, true)
      setLauncherState('fab')
    } else {
      const newIdx = nextIdx
      setStepIndex(newIdx)
      const step = config.steps[newIdx]
      if (step) {
        TooltipTour.tracker?.track(TTEventType.STEP_VIEWED, config.id, newIdx)
        scrollToCurrentStep(config, newIdx)
      }
    }
  }

  function handleBack() {
    if (!config || stepIndex === 0) return
    const newIdx = stepIndex - 1
    setStepIndex(newIdx)
    scrollToCurrentStep(config, newIdx)
  }

  function handleSessionDismiss() {
    if (!config) return
    TooltipTour.tracker?.track(TTEventType.GUIDE_DISMISSED, config.id)
    TooltipTour.endSession()
    TooltipTour.setSessionMinimised(config.id, true)
    setLauncherState('fab')
  }

  // ── FAB styling ────────────────────────────────────────────────────────────
  const { height: screenHeight } = useWindowDimensions()

  const fabBg     = parseColor(config?.styles?.fab?.bg_color) ?? '#3730A3'
  const fabSize   = config?.styles?.fab?.size          ?? 44
  const fabBottom = config?.styles?.fab?.bottom_offset ?? 40
  const fabOnLeft = config?.styles?.fab?.position?.includes('left') ?? false
  const fabRadius = config?.styles?.fab?.border_radius ?? fabSize / 2

  // ── FAB spring-in animation ────────────────────────────────────────────────
  const fabScale = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (launcherState === 'fab') {
      Animated.spring(fabScale, {
        toValue: 1, useNativeDriver: true,
        tension: 120, friction: 8,
      }).start()
    } else {
      fabScale.setValue(0)
    }
  }, [launcherState])

  // ── Session overlay origin — corrects measureInWindow ↔ SVG coordinate space
  const sessionOverlayRef = useRef<any>(null)
  const [overlayOrigin, setOverlayOrigin] = useState({ x: 0, y: 0 })
  const measureSessionOverlay = () => {
    sessionOverlayRef.current?.measureInWindow((x: number, y: number) => {
      setOverlayOrigin({ x, y })
    })
  }

  // ── Current step frame — poll continuously so scroll animation can complete ──
  const [targetFrame, setTargetFrame] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined)
  const currentStep = config?.steps[stepIndex]

  useEffect(() => {
    if (launcherState !== 'session' || !currentStep?.selector) {
      setTargetFrame(undefined)
      return
    }
    const selector = currentStep.selector
    let stopped = false
    let retry: ReturnType<typeof setTimeout>

    const refresh = async () => {
      if (stopped) return
      // Measure only the target element (not all refs) — avoids stale frame
      // contamination from unrelated elements and prevents null-ref hangs
      const ref = TTViewRegistry.getRef(selector)
      if (ref) {
        await TTViewRegistry.measureAndCache(selector, ref)
      }
      const f = TTViewRegistry.frame(selector)
      if (f) setTargetFrame(f)
      // Keep refreshing every 300 ms so the frame stays current as the page scrolls
      if (!stopped) retry = setTimeout(refresh, 300)
    }

    void refresh()
    return () => { stopped = true; clearTimeout(retry) }
  }, [launcherState, currentStep?.selector, stepIndex])

  // ── Adjusted frame: element coords relative to the overlay's own origin ──────
  //    Fixes any coordinate-space mismatch between measureInWindow and the SVG
  const adjustedFrame = targetFrame ? {
    x:      targetFrame.x - overlayOrigin.x,
    y:      targetFrame.y - overlayOrigin.y,
    width:  targetFrame.width,
    height: targetFrame.height,
  } : undefined

  // ── Step card position: below element in top half, above in bottom half ──────
  //    Falls back to bottom: 40 if element is off-screen (scroll in progress)
  const cardPositionStyle: object = (() => {
    if (!adjustedFrame) return { position: 'absolute', bottom: 40, left: 0, right: 0 }
    const { y, height } = adjustedFrame
    const elementBottom = y + height
    // Off-screen (scroll still animating) → park card at bottom until frame settles
    if (y > screenHeight || elementBottom < 0) {
      return { position: 'absolute', bottom: 40, left: 0, right: 0 }
    }
    if (elementBottom < screenHeight * 0.55) {
      return { position: 'absolute', top: elementBottom + 16, left: 0, right: 0 }
    }
    return { position: 'absolute', bottom: Math.max(screenHeight - y + 16, 40), left: 0, right: 0 }
  })()

  // ── Inspector ──────────────────────────────────────────────────────────────
  if (inspSession) {
    return (
      <TTInspectorView
        sessionId={inspSession.sessionId}
        baseURL={inspSession.base}
        mode={inspSession.mode}
        onEnd={() => TooltipTour.clearInspectorSession()}
      />
    )
  }

  return (
    <>
      {/* ── Tour session overlay ── */}
      {launcherState === 'session' && config && (
        <View
          ref={sessionOverlayRef}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
          onLayout={measureSessionOverlay}
        >
          <TTSpotlightView frame={adjustedFrame ?? null} />
          {adjustedFrame && (
            <TTBeaconView
              x={adjustedFrame.x} y={adjustedFrame.y}
              width={adjustedFrame.width} height={adjustedFrame.height}
              stepNumber={stepIndex + 1}
              color={fabBg}
            />
          )}
          {/* Step card — positioned near target element */}
          <View style={cardPositionStyle} pointerEvents="box-none">
            <TTStepCardView
              step={config.steps[stepIndex]}
              stepIndex={stepIndex}
              totalSteps={config.steps.length}
              config={config}
              onNext={handleNext}
              onBack={handleBack}
              onDismiss={handleSessionDismiss}
            />
          </View>
        </View>
      )}

      {/* ── Loading FAB ── */}
      {launcherState === 'loading' && (
        <View
          style={[styles.fab, styles.fabInner, {
            width: fabSize, height: fabSize, borderRadius: fabRadius,
            backgroundColor: fabBg,
            bottom: fabBottom,
            [fabOnLeft ? 'left' : 'right']: 20,
          }]}
          pointerEvents="none"
        >
          <ActivityIndicator color="#fff" size="small" />
        </View>
      )}

      {/* ── Minimised FAB — springs in when it first appears ── */}
      {launcherState === 'fab' && config && (
        <Animated.View
          style={[styles.fab, {
            width: fabSize, height: fabSize, borderRadius: fabRadius,
            backgroundColor: fabBg,
            bottom: fabBottom,
            [fabOnLeft ? 'left' : 'right']: 20,
            transform: [{ scale: fabScale }],
          }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={async () => {
              const showCount  = await TooltipTour.showCount(config.id)
              const maxReached = config.maxShows != null && showCount >= config.maxShows
              if (!maxReached) {
                await TooltipTour.incrementShowCount(config.id)
                await TooltipTour.setSessionMinimised(config.id, false)
                if (config.welcomeMode === 'button') {
                  // Button-only mode: skip the welcome card and start the tour immediately
                  setLauncherState('hidden')
                  TooltipTour.startSession(config)
                } else {
                  setLauncherState('welcome')
                }
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.fabInner}>
              <Text style={{ color: '#fff', fontSize: 16 }}>?</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Welcome card ── */}
      {config && (
        <TTWelcomeCardView
          config={config}
          visible={launcherState === 'welcome'}
          onStart={handleStart}
          onDismiss={async () => {
            await TooltipTour.setSessionMinimised(config.id, true)
            setLauncherState('fab')
          }}
          onDontShowAgain={async () => {
            await TooltipTour.dismiss(config.id)
            setLauncherState('hidden')
          }}
        />
      )}

      {/* ── Splash carousel ── */}
      {config?.splashCarousel && (
        <TTSplashCarouselView
          carousel={config.splashCarousel}
          btnBorderRadius={config.styles?.btn?.border_radius ?? 8}
          visible={launcherState === 'carousel'}
          onSlideViewed={index => {
            TooltipTour.tracker?.track(TTEventType.CAROUSEL_SLIDE_VIEWED, config.id, index)
          }}
          onDone={() => {
            TooltipTour.tracker?.track(TTEventType.CAROUSEL_COMPLETED, config.id)
            setLauncherState('hidden')
            void continueAfterCarousel()
          }}
          onDismiss={() => {
            TooltipTour.tracker?.track(TTEventType.CAROUSEL_DISMISSED, config.id)
            setLauncherState('hidden')
            void continueAfterCarousel()
          }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  fabInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  stepCardWrap: {
    position: 'absolute',
    bottom: 40, left: 0, right: 0,
  },
})
