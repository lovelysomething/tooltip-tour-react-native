import React, { useState, useEffect, useRef } from 'react'
import {
  View, TouchableOpacity, StyleSheet, Animated, Easing, useWindowDimensions,
  ActivityIndicator,
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
import { TTIconView } from './TTIcons'
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
  // Tour ids whose carousel has shown this session — per tour, so a second
  // tour's carousel still fires (a single flag blocked all but the first).
  const carouselsShownRef = useRef<Set<string>>(new Set())

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

      // Date-range display condition
      const dr = cfg.displayConditions?.dateRange
      if (dr) {
        const now = new Date()
        if (dr.from) {
          const fromDate = new Date(dr.from + 'T00:00:00')
          if (now < fromDate) { setLauncherState('hidden'); setConfig(null); return }
        }
        if (dr.to) {
          const toDate = new Date(dr.to + 'T23:59:59')
          if (now > toDate) { setLauncherState('hidden'); setConfig(null); return }
        }
      }

      setConfig(cfg)

      const id          = cfg.id
      const isDismissed = await TooltipTour.isDismissed(id)
      const showCount   = await TooltipTour.showCount(id)
      const isMinimised = await TooltipTour.isSessionMinimised(id)
      const maxReached  = cfg.maxShows != null && showCount >= cfg.maxShows

      // Carousel check
      const carousel = cfg.splashCarousel
      if (carousel && carousel.slides.length > 0 && !carouselsShownRef.current.has(id) && !isDismissed) {
        const carouselShows    = await TooltipTour.carouselShowCount(id)
        const carouselMaxReach = carousel.maxShows != null && carouselShows >= carousel.maxShows
        if (!carouselMaxReach) {
          await TooltipTour.incrementCarouselShowCount(id)
          carouselsShownRef.current.add(id)
          setLauncherState('carousel')
          TooltipTour.tracker?.track(TTEventType.CAROUSEL_SHOWN, id)
          return
        }
      }

      if (isDismissed || maxReached) {
        setLauncherState('hidden')
      } else if (cfg.startMinimized || isMinimised) {
        setLauncherState('fab')
      } else if (!cfg.autoOpen) {
        // Auto-open disabled — show the FAB; user taps to begin.
        setLauncherState('fab')
      } else if (cfg.welcomeMode === 'button') {
        // Button-only mode: skip the welcome card, start the tour directly.
        await TooltipTour.incrementShowCount(id)
        TooltipTour.tracker?.track(TTEventType.GUIDE_SHOWN, id)
        beginTour(cfg)
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
    // Respect autoOpen / welcomeMode (mirrors web + iOS)
    if (!cfg.autoOpen) { setLauncherState('fab'); return }
    await TooltipTour.incrementShowCount(id)
    if (cfg.welcomeMode === 'button') { beginTour(cfg); return }
    setLauncherState('welcome')
  }

  // Start the tour session directly with an explicit config (avoids relying on
  // the async `config` state being committed yet — needed from evaluate()).
  function beginTour(cfg: TTConfig) {
    setStepIndex(0)
    TooltipTour.startSession(cfg)
    setLauncherState('session')
    scrollToCurrentStep(cfg, 0)
  }

  function handleStart() {
    if (!config) return
    beginTour(config)
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

    // Settle-detection. The host page scrolls the target into view (animated),
    // so an early measurement is mid-scroll. We poll fast and only COMMIT the
    // frame once it stops moving — committing intermediate frames would restart
    // the spotlight's 300ms glide every tick, which is what made it stutter.
    // After it settles we keep a slow heartbeat so page scrolls are still tracked.
    type F = { x: number; y: number; width: number; height: number }
    let lastSeen:  F | null = null
    let committed: F | null = null
    let stableCount = 0
    const near = (a: F | null, b: F | null) =>
      !!a && !!b &&
      Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 &&
      Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1

    const tick = async () => {
      if (stopped) return
      // Measure only the target element (not all refs) — avoids stale frame
      // contamination from unrelated elements and prevents null-ref hangs
      const ref = TTViewRegistry.getRef(selector)
      if (ref) {
        await TTViewRegistry.measureAndCache(selector, ref)
      }
      if (stopped) return
      const f = TTViewRegistry.frame(selector)
      if (f) {
        stableCount = near(f, lastSeen) ? stableCount + 1 : 0
        lastSeen = f
        // Only commit once the target has both SETTLED (two equal reads) and is
        // actually on-screen — committing an off-screen mid-scroll frame is what
        // made the card park at the bottom then jump up to its final spot.
        const onScreen = f.y + f.height > 0 && f.y < screenHeight
        if (stableCount >= 1 && onScreen && !near(f, committed)) {
          committed = f
          setTargetFrame(f)
        }
      }
      // Poll fast while chasing a moving target, ease to a heartbeat once settled
      if (!stopped) retry = setTimeout(tick, stableCount >= 1 ? 400 : 60)
    }

    void tick()
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

  // ── Shared animated frame ────────────────────────────────────────────────────
  //    The spotlight cutout, beacon and step card all glide off these values so
  //    they move together (mirrors Android's single animateValueAsState rect).
  const sx = useRef(new Animated.Value(0)).current
  const sy = useRef(new Animated.Value(0)).current
  const sw = useRef(new Animated.Value(0)).current
  const sh = useRef(new Animated.Value(0)).current
  const cardY = useRef(new Animated.Value(0)).current
  const [cardH, setCardH] = useState(220)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const firstFrameRef = useRef(true)

  useEffect(() => {
    if (!adjustedFrame) { setOverlayVisible(false); firstFrameRef.current = true; return }
    const { x, y, width: w, height: h } = adjustedFrame
    const elementBottom = y + h
    // Decide the card side from the (settled) target so it never flips mid-glide.
    const below = elementBottom < screenHeight * 0.55
    const cardTop = below
      ? elementBottom + 16
      : Math.max(y - cardH - 16, 40)

    if (firstFrameRef.current) {
      // First step — snap into place, no glide from a stale origin.
      firstFrameRef.current = false
      sx.setValue(x); sy.setValue(y); sw.setValue(w); sh.setValue(h)
      cardY.setValue(cardTop)
      setOverlayVisible(true)
      return
    }
    setOverlayVisible(true)
    const ease = Easing.inOut(Easing.cubic)
    Animated.parallel([
      Animated.timing(sx,    { toValue: x,       duration: 300, easing: ease, useNativeDriver: false }),
      Animated.timing(sy,    { toValue: y,       duration: 300, easing: ease, useNativeDriver: false }),
      Animated.timing(sw,    { toValue: w,       duration: 300, easing: ease, useNativeDriver: false }),
      Animated.timing(sh,    { toValue: h,       duration: 300, easing: ease, useNativeDriver: false }),
      Animated.timing(cardY, { toValue: cardTop, duration: 300, easing: ease, useNativeDriver: false }),
    ]).start()
  }, [adjustedFrame?.x, adjustedFrame?.y, adjustedFrame?.width, adjustedFrame?.height, cardH, screenHeight])

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
          <TTSpotlightView ax={sx} ay={sy} aw={sw} ah={sh} visible={overlayVisible} />
          {overlayVisible && (
            <TTBeaconView
              ax={sx} ay={sy} aw={sw} ah={sh}
              stepNumber={stepIndex + 1}
              beaconStyle={config.styles?.beacon?.style ?? 'numbered'}
              bgColor={parseColor(config.styles?.beacon?.bg_color) ?? fabBg}
              textColor={parseColor(config.styles?.beacon?.text_color) ?? '#fff'}
            />
          )}
          {/* Step card — glides via translateY in sync with the spotlight */}
          <Animated.View
            style={{
              position: 'absolute', left: 0, right: 0, top: 0,
              transform: [{ translateY: cardY }],
              opacity: overlayVisible ? 1 : 0,
            }}
            pointerEvents="box-none"
            onLayout={e => {
              const h = e.nativeEvent.layout.height
              if (h > 0 && Math.abs(h - cardH) > 1) setCardH(h)
            }}
          >
            <TTStepCardView
              step={config.steps[stepIndex]}
              stepIndex={stepIndex}
              totalSteps={config.steps.length}
              config={config}
              onNext={handleNext}
              onBack={handleBack}
              onDismiss={handleSessionDismiss}
            />
          </Animated.View>
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
              {/* Icon scales with the button — baseline 18pt icon in a 44pt frame, matching iOS */}
              <TTIconView
                icon={config.styles?.fab?.icon}
                color="#fff"
                size={Math.round(fabSize * (18 / 44))}
              />
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
