import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  PanResponder, Dimensions, ScrollView, Image, useWindowDimensions,
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
  const slides     = carousel.slides
  const pageCount  = slides.length
  const bgColor    = parseColor(carousel.bgColor)  ?? '#1a1a2e'
  const textColor  = parseColor(carousel.textColor) ?? '#ffffff'

  const [currentPage, setCurrentPage] = useState(0)
  const offset = useRef(new Animated.Value(0)).current

  // Fire onSlideViewed when page changes
  const prevPage = useRef(-1)
  React.useEffect(() => {
    if (visible && prevPage.current !== currentPage) {
      prevPage.current = currentPage
      onSlideViewed(currentPage)
    }
  }, [currentPage, visible])

  // Reset on open
  React.useEffect(() => {
    if (visible) {
      setCurrentPage(0)
      prevPage.current = -1
      offset.setValue(0)
    }
  }, [visible])

  function goTo(target: number) {
    if (target < 0 || target >= pageCount) return
    const direction = target > currentPage ? -1 : 1
    Animated.spring(offset, {
      toValue: direction,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start(() => {
      setCurrentPage(target)
      offset.setValue(0)
    })
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        offset.setValue(g.dx / SCREEN_W)
      },
      onPanResponderRelease: (_, g) => {
        const pct = g.dx / SCREEN_W
        if (pct < -0.25) {
          // Attempt next
          const next = currentPage + 1
          if (next < pageCount) {
            Animated.spring(offset, { toValue: -1, useNativeDriver: true, damping: 18, stiffness: 180 }).start(() => {
              setCurrentPage(next); offset.setValue(0)
            })
          } else {
            Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start()
          }
        } else if (pct > 0.25 && currentPage > 0) {
          Animated.spring(offset, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }).start(() => {
            setCurrentPage(currentPage - 1); offset.setValue(0)
          })
        } else {
          Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start()
      },
    })
  ).current

  const isLast = currentPage === pageCount - 1

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: bgColor }]} {...panResponder.panHandlers}>

        {/* Slides */}
        <View style={StyleSheet.absoluteFill}>
          {slides.map((slide, i) => {
            const translateX = offset.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [(i - currentPage - 1) * SCREEN_W, (i - currentPage) * SCREEN_W, (i - currentPage + 1) * SCREEN_W],
            })
            return (
              <Animated.View key={i} style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <SlideContent slide={slide} textColor={textColor} screenW={SCREEN_W} />
              </Animated.View>
            )
          })}
        </View>

        {/* Dismiss button */}
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={[styles.dismissText, { color: textColor }]}>✕</Text>
        </TouchableOpacity>

        {/* Bottom nav */}
        <View style={styles.bottom}>
          {pageCount > 1 && (
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goTo(i)}>
                  <View style={[
                    styles.dot,
                    { backgroundColor: i === currentPage ? textColor : `${textColor}59` },
                    i === currentPage ? styles.dotActive : styles.dotInactive,
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.navRow}>
            {currentPage > 0 ? (
              <TouchableOpacity onPress={() => goTo(currentPage - 1)}>
                <Text style={[styles.backText, { color: textColor + 'A6' }]}>Back</Text>
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

function SlideContent({ slide, textColor, screenW }: { slide: TTCarouselSlide; textColor: string; screenW: number }) {
  const logoW = Math.min(screenW * 0.5, 400)
  const logoH = logoW / 2

  return (
    <ScrollView
      contentContainerStyle={[styles.slide, { paddingHorizontal: 28 }]}
      scrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {!!slide.logoUrl && (
        <Image source={{ uri: slide.logoUrl }} style={{ width: logoW, height: logoH, resizeMode: 'contain', marginBottom: 20 }} />
      )}
      {!!slide.imageUrl && (
        <Image source={{ uri: slide.imageUrl }} style={{ width: screenW - 56, aspectRatio: 1, borderRadius: 12, marginBottom: 24 }} />
      )}
      {!!slide.title && (
        <Text style={[styles.slideTitle, { color: textColor }]}>{slide.title}</Text>
      )}
      {!!slide.description && (
        <Text style={[styles.slideDesc, { color: textColor + 'CC' }]}>{slide.description}</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { alignItems: 'center', paddingTop: 100, paddingBottom: 160 },
  slideTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 },
  slideDesc:  { fontSize: 15, textAlign: 'center', lineHeight: 22 },
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
  dots: { flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'center' },
  dot:  { borderRadius: 10 },
  dotActive:   { width: 10, height: 10 },
  dotInactive: { width: 7,  height: 7  },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  backText:    { fontSize: 14, fontWeight: '600' },
  nextBtn:     { minWidth: 100, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700' },
})
