# Tooltip Tour — React Native SDK

Pure JavaScript SDK for [Tooltip Tour](https://app.lovelysomething.com) — the guided walkthrough tool for web, iOS, and Android.

**Zero native modules. Expo-compatible. One package covers both iOS and Android.**

---

## Installation

```bash
npm install tooltip-tour-react-native
```

Or with yarn:

```bash
yarn add tooltip-tour-react-native
```

No `pod install`, no `npx react-native link`, no native config required.

**Requirements:** React Native ≥ 0.70 / Expo SDK ≥ 49

---

## Setup

### 1. Configure the SDK

Call `TooltipTour.configure()` once, before your root component renders:

```tsx
// App.tsx
import { TooltipTour, TTLauncherView } from 'tooltip-tour-react-native'
import { NavigationContainer } from '@react-navigation/native'
import RootNavigator from './navigation/RootNavigator'

TooltipTour.configure({
  siteKey: 'sk_your_key',
  baseURL: 'https://app.lovelysomething.com',
})

export default function App() {
  return (
    <>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>

      {/* TTLauncherView sits above the navigator — renders FAB + welcome card + carousel */}
      <TTLauncherView />
    </>
  )
}
```

For **Expo Router**, add it to `app/_layout.tsx`:

```tsx
import { TooltipTour, TTLauncherView } from 'tooltip-tour-react-native'
import { Stack } from 'expo-router'

TooltipTour.configure({
  siteKey: 'sk_your_key',
  baseURL: 'https://app.lovelysomething.com',
})

export default function RootLayout() {
  return (
    <>
      <Stack />
      <TTLauncherView />
    </>
  )
}
```

### 2. Register screens

Call `useTTPage()` at the top of each screen that should trigger a tour:

```tsx
import { useTTPage } from 'tooltip-tour-react-native'

export default function HomeScreen() {
  useTTPage('home')
  // ...
}
```

### 3. Tag targetable elements

Use `useTTTarget()` to mark elements the tour can spotlight:

```tsx
import { useTTPage, useTTTarget } from 'tooltip-tour-react-native'
import { View, Text, TouchableOpacity } from 'react-native'

export default function HomeScreen() {
  useTTPage('home')

  const titleRef  = useTTTarget('welcomeTitle')
  const buttonRef = useTTTarget('getStartedButton')

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text ref={titleRef} style={{ fontSize: 28, fontWeight: '800' }}>
        Welcome
      </Text>
      <TouchableOpacity ref={buttonRef} style={{ marginTop: 24, padding: 16, backgroundColor: '#1925AA' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Get started</Text>
      </TouchableOpacity>
    </View>
  )
}
```

The identifier must match the **selector** set in the Tooltip Tour dashboard.

---

## Scrollable lists

If a tour step targets an element inside a `FlatList` or `ScrollView`, register a scroll callback so the SDK can scroll to it before spotlighting:

```tsx
import { useRef } from 'react'
import { FlatList } from 'react-native'
import { TooltipTour } from 'tooltip-tour-react-native'

export default function FeedScreen() {
  const listRef = useRef<FlatList>(null)

  TooltipTour.registerScrollable('feed', (targetId) => {
    const index = items.findIndex(item => item.id === targetId)
    if (index !== -1) listRef.current?.scrollToIndex({ index, animated: true })
  })

  return <FlatList ref={listRef} data={items} renderItem={/* ... */} />
}
```

---

## Visual Inspector

The Visual Inspector lets you capture element identifiers directly from your device and send them to the dashboard without leaving the app.

### Enable deep link handling

```tsx
// React Navigation
import { Linking } from 'react-native'
import { TooltipTour } from 'tooltip-tour-react-native'
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) TooltipTour.handleDeepLink(url)
    })
    const sub = Linking.addEventListener('url', ({ url }) => {
      TooltipTour.handleDeepLink(url)
    })
    return () => sub.remove()
  }, [])

  return (/* ... */)
}
```

```tsx
// Expo Router
import { useEffect } from 'react'
import { useURL } from 'expo-linking'
import { TooltipTour } from 'tooltip-tour-react-native'

export default function RootLayout() {
  const url = useURL()
  useEffect(() => {
    if (url) TooltipTour.handleDeepLink(url)
  }, [url])

  return (/* ... */)
}
```

### Register the URL scheme

Add `tooltiptour` to your app's URL schemes:

```json
// app.json (Expo)
{
  "expo": {
    "scheme": "tooltiptour",
    "ios": { "bundleIdentifier": "com.mycompany.myapp" },
    "android": { "package": "com.mycompany.myapp" }
  }
}
```

The dashboard generates a QR code you scan with your device to launch the inspector. The inspector has two modes:

- **Navigate** — touches pass through to your app; scroll and explore freely
- **Highlight** — blue chips appear over every registered `useTTTarget()` element; tap a chip to capture its identifier

---

## iOS and Android SDKs

The native SDKs live at:

- [tooltip-tour-ios](https://github.com/lovelysomething/tooltip-tour-ios) — Swift/SwiftUI
- [tooltip-tour-android](https://github.com/lovelysomething/tooltip-tour-android) — Kotlin/Jetpack Compose

---

## License

MIT © Lovely Something Ltd
