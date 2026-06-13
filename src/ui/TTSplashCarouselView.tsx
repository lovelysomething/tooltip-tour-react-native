import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Image, useWindowDimensions,
} from 'react-native'
import { TTSplashCarousel, TTCarouselSlide } from '../networking/TTNetworkClient'
import { parseColor } from './utils'

interface Props {
  carousel: TTSplashCarousel
  btnBorderRadius?: number
  visible: boolean
  onSlideViewed: (index: number) => void
  onDone: () => void
  onDismiss: () => void
}

export function TTSplashCarouselView({
  carousel, btnBorderRadius = 8, visible, onSlideViewed, onDone, onDismiss,
}: Props) {
  const { width: SCREEN_W } = useWindowDimensions()
  const slides    = carousel.slides
  const pageCount = slides.length
  const bgColor   = parseColor(carousel.bgColor)   ?? '#1a1a2e'
  const textColor = parseColor(carousel.textColor)  ?? '#ffffff'

  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  // Reset to page 0 whenever carousel becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentPage(0)
      scrollRef.current?.scrollTo({ x: 0, animated: false })
      onSlideViewed(0)
    }
  }, [visible])

  function goTo(target: number) {
    if (target < 0 || target >= pageCount) return
    scrollRef.current?.scrollTo({ x: target * SCREEN_W, animated: true })
    // Update state immediately so nav/dots respond without waiting for momentum end
    if (target !== currentPage) {
      setCurrentPage(target)
      onSlideViewed(target)
    }
  }

  const isLast = currentPage === pageCount - 1

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: bgColor }]}>

        {/* ── Slides — plain ScrollView pager: every slide stays mounted, so no
            virtualization blanks or remount flashes, and nothing steals the
            horizontal pan from the pager itself ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
            if (page !== currentPage) {
              setCurrentPage(page)
              onSlideViewed(page)
            }
          }}
          style={StyleSheet.absoluteFill}
        >
          {slides.map((slide, i) => (
            <SlideContent key={i} slide={slide} textColor={textColor} screenW={SCREEN_W} />
          ))}
        </ScrollView>

        {/* ── Dismiss button ── */}
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={[styles.dismissText, { color: textColor }]}>✕</Text>
        </TouchableOpacity>

        {/* ── Bottom nav ── */}
        <View style={styles.bottom}>
          {pageCount > 1 && (
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goTo(i)}>
                  <View style={[
                    styles.dot,
                    i === currentPage
                      ? [styles.dotActive,   { backgroundColor: textColor }]
                      : [styles.dotInactive, { backgroundColor: `${textColor}59` }],
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.navRow}>
            {currentPage > 0 ? (
              <TouchableOpacity onPress={() => goTo(currentPage - 1)}>
                <Text style={[styles.backText, { color: `${textColor}A6` }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 64 }} />
            )}

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: textColor, borderRadius: btnBorderRadius }]}
              onPress={isLast ? onDone : () => goTo(currentPage + 1)}
            >
              <Text style={[styles.nextBtnText, { color: bgColor }]}>
                {isLast ? 'Done' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function SlideContent({
  slide, textColor, screenW,
}: { slide: TTCarouselSlide; textColor: string; screenW: number }) {
  // Logo: wider container with a 3:2 ratio to accommodate most logo shapes
  const logoW = Math.min(screenW * 0.6, 320)
  const logoH = logoW * (2 / 3)

  return (
    <View style={[styles.slide, { width: screenW, paddingHorizontal: 28 }]}>
      {!!slide.logoUrl && (
        <Image
          source={{ uri: slide.logoUrl }}
          style={{ width: logoW, height: logoH, resizeMode: 'contain', marginBottom: 20 }}
        />
      )}
      {!!slide.imageUrl && (
        <Image
          source={{ uri: slide.imageUrl }}
          style={{ width: screenW - 56, aspectRatio: 1, borderRadius: 12, marginBottom: 24 }}
          resizeMode="contain"
        />
      )}
      {!!slide.title && (
        <Text style={[styles.slideTitle, { color: textColor }]}>{slide.title}</Text>
      )}
      {!!slide.description && (
        <Text style={[styles.slideDesc, { color: `${textColor}CC` }]}>{slide.description}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 180,
  },
  slideTitle: {
    fontSize: 22, fontWeight: '800', textAlign: 'center',
    letterSpacing: -0.5, marginBottom: 12,
  },
  slideDesc: {
    fontSize: 15, textAlign: 'center', lineHeight: 22,
  },
  dismissBtn: {
    position: 'absolute', top: 52, right: 20,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  dismissText: { fontSize: 12, fontWeight: '700' },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 48,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'center',
  },
  dot:         { borderRadius: 10 },
  dotActive:   { width: 10, height: 10 },
  dotInactive: { width: 7,  height: 7 },
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%',
  },
  backText:    { fontSize: 14, fontWeight: '600' },
  nextBtn:     { minWidth: 100, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700' },
})
