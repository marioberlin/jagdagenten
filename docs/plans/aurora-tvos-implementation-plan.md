# Aurora Weather tvOS Implementation Plan

> **Purpose**: Complete specification for an AI agent to build the Aurora Weather Apple TV app from scratch.
> **Target Platform**: tvOS 17.0+
> **Language**: Swift 5.9+, SwiftUI
> **Architecture**: MVVM with async/await

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Project Structure](#3-project-structure)
4. [Design System: Liquid Glass for tvOS](#4-design-system-liquid-glass-for-tvos)
5. [Data Models](#5-data-models)
6. [API Integration](#6-api-integration)
7. [Core Views Implementation](#7-core-views-implementation)
8. [Navigation & Focus System](#8-navigation--focus-system)
9. [Siri Voice Integration](#9-siri-voice-integration)
10. [Top Shelf Extension](#10-top-shelf-extension)
11. [Screensaver Extension](#11-screensaver-extension)
12. [iCloud Sync](#12-icloud-sync)
13. [Accessibility](#13-accessibility)
14. [Testing Strategy](#14-testing-strategy)
15. [Build & Deployment](#15-build--deployment)
16. [Implementation Phases](#16-implementation-phases)

---

## 1. Project Overview

### 1.1 App Description

Aurora Weather is a premium weather app for Apple TV that provides:
- Beautiful, ambient weather display using the Liquid Glass design system
- Current conditions, hourly forecasts (48h), and 7-day forecasts
- Multiple saved locations with iCloud sync
- Weather alerts with severity-based styling
- Activity recommendations based on weather conditions
- Voice control via Siri Remote
- Screensaver integration for ambient display

### 1.2 Core Features (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Weather Hero | P0 | Full-screen current conditions display |
| Hourly Timeline | P0 | 48-hour focusable horizontal scroll |
| 7-Day Forecast | P0 | Daily forecast grid |
| Saved Locations | P0 | Grid of location cards with mini weather |
| Focus Navigation | P0 | Siri Remote-optimized navigation |
| Siri Voice Commands | P1 | "What's the weather in Paris?" |
| Weather Alerts | P1 | Full-screen alert modals |
| Activity Recommendations | P1 | Weather-appropriate activities |
| Top Shelf Extension | P2 | Weather summary in Home Screen |
| Screensaver | P2 | Ambient weather display |
| iCloud Sync | P2 | Sync locations across devices |

### 1.3 Features NOT Included

- Trip planning (defer to iOS companion app)
- Turn-by-turn navigation
- Map exploration
- Full text search (use Siri instead)

---

## 2. Development Environment Setup

### 2.1 Requirements

```yaml
Xcode: 15.0+
macOS: Sonoma 14.0+
Swift: 5.9+
tvOS Deployment Target: 17.0
Apple Developer Account: Required for device testing
```

### 2.2 Create New Project

```bash
# In Xcode:
# File → New → Project → tvOS → App
# Product Name: AuroraWeatherTV
# Team: [Your Team]
# Organization Identifier: com.liquidcrypto
# Bundle Identifier: com.liquidcrypto.aurora.tv
# Interface: SwiftUI
# Language: Swift
# Include Tests: Yes
```

### 2.3 Capabilities to Enable

In Xcode → Target → Signing & Capabilities:

```yaml
iCloud:
  - CloudKit (for location sync)
  - Key-value storage

Background Modes:
  - Background fetch (weather updates)
  - Remote notifications

App Groups:
  - group.com.liquidcrypto.aurora (shared with extensions)

Siri:
  - Enable Siri intents
```

### 2.4 Info.plist Additions

```xml
<!-- Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aurora uses your location to show local weather conditions.</string>

<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>

<!-- Top Shelf Support -->
<key>TVTopShelfImageName</key>
<string>TopShelfImage</string>

<key>TVTopShelfImageStyle</key>
<string>wide</string>
```

---

## 3. Project Structure

```
AuroraWeatherTV/
├── AuroraWeatherTV.xcodeproj
├── AuroraWeatherTV/
│   ├── App/
│   │   ├── AuroraWeatherTVApp.swift          # App entry point
│   │   └── AppState.swift                     # Global app state
│   │
│   ├── Models/
│   │   ├── WeatherModels.swift               # All weather data models
│   │   ├── LocationModels.swift              # Location models
│   │   └── AlertModels.swift                 # Weather alert models
│   │
│   ├── Services/
│   │   ├── WeatherService.swift              # Open-Meteo API client
│   │   ├── GeocodingService.swift            # Nominatim geocoding
│   │   ├── AlertService.swift                # NOAA/EU alert fetching
│   │   ├── LocationManager.swift             # Core Location wrapper
│   │   └── SyncService.swift                 # iCloud sync
│   │
│   ├── ViewModels/
│   │   ├── WeatherViewModel.swift            # Main weather state
│   │   ├── LocationsViewModel.swift          # Saved locations state
│   │   └── SettingsViewModel.swift           # User preferences
│   │
│   ├── Views/
│   │   ├── Main/
│   │   │   ├── ContentView.swift             # Tab container
│   │   │   ├── WeatherHomeView.swift         # Weather tab
│   │   │   ├── LocationsGridView.swift       # Locations tab
│   │   │   └── SettingsView.swift            # Settings tab
│   │   │
│   │   ├── Weather/
│   │   │   ├── WeatherHeroView.swift         # Full-screen hero
│   │   │   ├── HourlyTimelineView.swift      # Horizontal timeline
│   │   │   ├── DailyForecastView.swift       # 7-day grid
│   │   │   ├── WeatherDetailsGrid.swift      # Humidity, wind, etc.
│   │   │   ├── AirQualityCard.swift          # AQI display
│   │   │   └── ActivityRecommendationsView.swift
│   │   │
│   │   ├── Locations/
│   │   │   ├── LocationCard.swift            # Grid item
│   │   │   ├── AddLocationCard.swift         # "+ Add" card
│   │   │   └── LocationDetailSheet.swift     # Edit/delete
│   │   │
│   │   ├── Alerts/
│   │   │   ├── AlertBanner.swift             # Inline alert
│   │   │   └── AlertDetailModal.swift        # Full-screen alert
│   │   │
│   │   └── Components/
│   │       ├── GlassCard.swift               # Base glass container
│   │       ├── GlassButton.swift             # Focusable button
│   │       ├── WeatherIcon.swift             # SF Symbol mapper
│   │       ├── TemperatureText.swift         # Styled temp display
│   │       ├── FocusableCard.swift           # Focus-aware wrapper
│   │       └── AnimatedBackground.swift      # Weather mood bg
│   │
│   ├── DesignSystem/
│   │   ├── LiquidGlass.swift                 # Design tokens
│   │   ├── Typography.swift                  # Font scales
│   │   ├── Colors.swift                      # Semantic colors
│   │   └── Animations.swift                  # Spring configs
│   │
│   ├── Extensions/
│   │   ├── View+Glass.swift                  # Glass modifiers
│   │   ├── Date+Formatting.swift             # Date helpers
│   │   └── Color+Weather.swift               # Weather tints
│   │
│   ├── Utilities/
│   │   ├── WeatherCodeMapper.swift           # WMO code → icon
│   │   ├── UnitConverter.swift               # °C/°F, km/mi
│   │   └── Cache.swift                       # In-memory cache
│   │
│   └── Resources/
│       ├── Assets.xcassets/
│       │   ├── AppIcon.appiconset/           # 400x240, 800x480 (1x,2x)
│       │   ├── TopShelf.imageset/            # 1920x720, 2940x1560
│       │   └── Colors/                        # Named colors
│       └── Localizable.strings
│
├── TopShelfExtension/
│   ├── ContentProvider.swift                  # Top shelf data
│   └── Info.plist
│
├── ScreensaverExtension/                      # tvOS 18+ only
│   ├── WeatherScreensaver.swift
│   └── Info.plist
│
├── Intents/
│   ├── WeatherIntentHandler.swift            # Siri intent handling
│   └── Intents.intentdefinition              # Intent definitions
│
└── Tests/
    ├── AuroraWeatherTVTests/
    │   ├── WeatherServiceTests.swift
    │   ├── ViewModelTests.swift
    │   └── ModelTests.swift
    └── AuroraWeatherTVUITests/
        └── NavigationTests.swift
```

---

## 4. Design System: Liquid Glass for tvOS

### 4.1 Design Tokens

```swift
// DesignSystem/LiquidGlass.swift

import SwiftUI

/// Liquid Glass Design System for tvOS
/// Based on Apple HIG with enhanced glass materials
enum LiquidGlass {

    // MARK: - Blur Values
    /// tvOS uses higher blur values due to viewing distance
    enum Blur {
        static let ultraThin: CGFloat = 20    // Tooltips, transient
        static let thin: CGFloat = 40         // Cards, elevated
        static let regular: CGFloat = 60      // Panels, surfaces
        static let thick: CGFloat = 80        // Modals, alerts
    }

    // MARK: - Opacity
    enum Opacity {
        static let clear: Double = 0.08       // Subtle glass
        static let regular: Double = 0.15     // Standard glass
        static let elevated: Double = 0.25    // Focused/elevated
        static let solid: Double = 0.40       // High contrast
    }

    // MARK: - Border
    enum Border {
        static let subtle: Double = 0.10      // Default border
        static let visible: Double = 0.20     // Focused border
        static let prominent: Double = 0.35   // Alert border
        static let width: CGFloat = 1.5       // Border width
    }

    // MARK: - Corner Radius
    enum Radius {
        static let small: CGFloat = 12        // Chips, badges
        static let medium: CGFloat = 20       // Cards
        static let large: CGFloat = 28        // Panels
        static let xlarge: CGFloat = 40       // Hero sections
    }

    // MARK: - Focus Effects
    enum Focus {
        static let scaleUp: CGFloat = 1.05    // Focused scale
        static let scaleDown: CGFloat = 0.98  // Pressed scale
        static let shadowRadius: CGFloat = 30 // Focus shadow
        static let shadowY: CGFloat = 15      // Shadow offset
        static let glowOpacity: Double = 0.5  // Border glow
    }

    // MARK: - Animation
    enum Animation {
        static let focusSpring = SwiftUI.Animation.spring(
            duration: 0.25,
            bounce: 0.15
        )
        static let transitionSpring = SwiftUI.Animation.spring(
            duration: 0.35,
            bounce: 0.1
        )
        static let backgroundDuration: Double = 30.0 // Slow ambient
    }

    // MARK: - Spacing (10-foot UI)
    enum Spacing {
        static let xs: CGFloat = 8
        static let sm: CGFloat = 16
        static let md: CGFloat = 32
        static let lg: CGFloat = 48
        static let xl: CGFloat = 64
        static let xxl: CGFloat = 96
        static let screenPadding: CGFloat = 80 // Safe area inset
    }
}
```

### 4.2 Typography Scale

```swift
// DesignSystem/Typography.swift

import SwiftUI

/// Typography scale optimized for 10-foot UI
enum AuroraTypography {

    // MARK: - Display
    /// Temperature hero display
    static let temperatureHero: Font = .system(size: 180, weight: .bold, design: .rounded)

    // MARK: - Headings
    static let pageTitle: Font = .system(size: 72, weight: .bold)
    static let sectionHeader: Font = .system(size: 48, weight: .semibold)
    static let cardTitle: Font = .system(size: 36, weight: .semibold)

    // MARK: - Body
    static let bodyLarge: Font = .system(size: 32, weight: .medium)
    static let body: Font = .system(size: 28, weight: .regular)
    static let bodySmall: Font = .system(size: 24, weight: .regular)

    // MARK: - Data Display
    static let metricValue: Font = .system(size: 48, weight: .bold, design: .rounded)
    static let metricLabel: Font = .system(size: 24, weight: .medium)

    // MARK: - Interactive
    static let button: Font = .system(size: 28, weight: .semibold)
    static let caption: Font = .system(size: 22, weight: .medium)

    // MARK: - Minimum Sizes
    /// Never use text smaller than this on tvOS
    static let minimumSize: CGFloat = 22
}

// MARK: - View Extension
extension View {
    func auroraFont(_ font: Font) -> some View {
        self.font(font)
    }
}
```

### 4.3 Semantic Colors

```swift
// DesignSystem/Colors.swift

import SwiftUI

extension Color {

    // MARK: - Text Colors
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let textTertiary = Color.white.opacity(0.5)

    // MARK: - Glass Colors
    static let glassSurface = Color.white.opacity(LiquidGlass.Opacity.regular)
    static let glassElevated = Color.white.opacity(LiquidGlass.Opacity.elevated)
    static let glassBorder = Color.white.opacity(LiquidGlass.Border.subtle)
    static let glassBorderFocused = Color.white.opacity(LiquidGlass.Border.visible)

    // MARK: - Accent
    static let accent = Color(red: 0.0, green: 0.48, blue: 1.0) // #007AFF

    // MARK: - Weather Mood Colors
    static let moodCalm = Color(red: 0.0, green: 0.83, blue: 1.0)     // Cyan
    static let moodActive = Color(red: 0.0, green: 0.48, blue: 1.0)   // Blue
    static let moodIntense = Color(red: 0.69, green: 0.32, blue: 0.87) // Purple
    static let moodSevere = Color(red: 1.0, green: 0.23, blue: 0.19)   // Red

    // MARK: - Temperature Tints
    static func temperatureTint(for celsius: Int) -> Color {
        switch celsius {
        case ...(-10): return Color(hex: "E8EAF6") // Lavender (deep freeze)
        case -9...0:   return Color(hex: "E3F2FD") // Ice blue
        case 1...5:    return Color(hex: "B3E5FC") // Pale blue
        case 6...10:   return Color(hex: "81D4FA") // Sky blue
        case 11...15:  return Color(hex: "4FC3F7") // Light blue
        case 16...20:  return Color(hex: "A5D6A7") // Soft green
        case 21...25:  return Color(hex: "FFEB3B") // Yellow
        case 26...30:  return Color(hex: "FFC107") // Amber
        case 31...35:  return Color(hex: "FF8A65") // Light coral
        default:       return Color(hex: "FF7043") // Coral (very hot)
        }
    }

    // MARK: - Alert Severity Colors
    static let alertInfo = Color.blue
    static let alertAdvisory = Color.yellow
    static let alertWarning = Color.orange
    static let alertSevere = Color(red: 1.0, green: 0.5, blue: 0.0)
    static let alertExtreme = Color.red

    // MARK: - Activity Categories
    static let activityOutdoor = Color.green
    static let activityIndoor = Color.purple
    static let activityExercise = Color.orange
    static let activitySocial = Color.pink
    static let activityRelaxation = Color.cyan
}

// MARK: - Hex Initializer
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

### 4.4 Glass Components

```swift
// Views/Components/GlassCard.swift

import SwiftUI

/// A glass-morphism card container for tvOS
struct GlassCard<Content: View>: View {
    let content: () -> Content
    var material: GlassMaterial = .regular
    var cornerRadius: CGFloat = LiquidGlass.Radius.medium
    var padding: CGFloat = LiquidGlass.Spacing.md

    enum GlassMaterial {
        case ultraThin, thin, regular, thick

        var blur: CGFloat {
            switch self {
            case .ultraThin: return LiquidGlass.Blur.ultraThin
            case .thin: return LiquidGlass.Blur.thin
            case .regular: return LiquidGlass.Blur.regular
            case .thick: return LiquidGlass.Blur.thick
            }
        }

        var opacity: Double {
            switch self {
            case .ultraThin: return LiquidGlass.Opacity.clear
            case .thin: return LiquidGlass.Opacity.regular
            case .regular: return LiquidGlass.Opacity.regular
            case .thick: return LiquidGlass.Opacity.elevated
            }
        }
    }

    var body: some View {
        ZStack {
            // Glass background
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(Color.white.opacity(material.opacity))
                )
                .overlay(
                    // Specular highlight
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.15),
                            Color.white.opacity(0.0)
                        ],
                        startPoint: .top,
                        endPoint: .center
                    )
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                )
                .overlay(
                    // Border
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .strokeBorder(
                            Color.glassBorder,
                            lineWidth: LiquidGlass.Border.width
                        )
                )

            // Content
            content()
                .padding(padding)
        }
    }
}

// MARK: - Focusable Glass Card

/// A glass card that responds to tvOS focus
struct FocusableGlassCard<Content: View>: View {
    @FocusState private var isFocused: Bool
    let content: () -> Content
    let action: () -> Void
    var material: GlassCard<Content>.GlassMaterial = .regular

    var body: some View {
        Button(action: action) {
            GlassCard(content: content, material: material)
                .scaleEffect(isFocused ? LiquidGlass.Focus.scaleUp : 1.0)
                .shadow(
                    color: isFocused ? Color.accent.opacity(0.3) : .clear,
                    radius: isFocused ? LiquidGlass.Focus.shadowRadius : 0,
                    y: isFocused ? LiquidGlass.Focus.shadowY : 0
                )
                .overlay(
                    RoundedRectangle(cornerRadius: LiquidGlass.Radius.medium)
                        .strokeBorder(
                            isFocused ? Color.accent.opacity(LiquidGlass.Focus.glowOpacity) : .clear,
                            lineWidth: 3
                        )
                )
                .animation(LiquidGlass.Animation.focusSpring, value: isFocused)
        }
        .buttonStyle(.plain)
        .focused($isFocused)
    }
}
```

### 4.5 Animated Weather Background

```swift
// Views/Components/AnimatedBackground.swift

import SwiftUI

/// Full-screen animated background that responds to weather mood
struct AnimatedWeatherBackground: View {
    let mood: MaterialMood
    let isDay: Bool

    @State private var animationPhase: CGFloat = 0

    var body: some View {
        ZStack {
            // Base gradient
            LinearGradient(
                colors: gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Animated overlay
            GeometryReader { geometry in
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                accentColor.opacity(0.3),
                                accentColor.opacity(0.0)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: geometry.size.width * 0.5
                        )
                    )
                    .frame(width: geometry.size.width * 0.8)
                    .offset(
                        x: cos(animationPhase) * 100,
                        y: sin(animationPhase) * 50
                    )
                    .blur(radius: 100)
            }

            // Particle effects for intense/severe weather
            if mood == .intense || mood == .severe {
                ParticleEmitter(intensity: mood == .severe ? 1.0 : 0.6)
            }
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(
                .linear(duration: LiquidGlass.Animation.backgroundDuration)
                .repeatForever(autoreverses: false)
            ) {
                animationPhase = .pi * 2
            }
        }
    }

    private var gradientColors: [Color] {
        switch (mood, isDay) {
        case (.calm, true):
            return [Color(hex: "87CEEB"), Color(hex: "E0F7FA"), Color(hex: "FFFFFF")]
        case (.calm, false):
            return [Color(hex: "1A237E"), Color(hex: "311B92"), Color(hex: "4A148C")]
        case (.active, true):
            return [Color(hex: "78909C"), Color(hex: "90A4AE"), Color(hex: "B0BEC5")]
        case (.active, false):
            return [Color(hex: "263238"), Color(hex: "37474F"), Color(hex: "455A64")]
        case (.intense, _):
            return [Color(hex: "4A148C"), Color(hex: "6A1B9A"), Color(hex: "7B1FA2")]
        case (.severe, _):
            return [Color(hex: "B71C1C"), Color(hex: "C62828"), Color(hex: "D32F2F")]
        }
    }

    private var accentColor: Color {
        switch mood {
        case .calm: return .moodCalm
        case .active: return .moodActive
        case .intense: return .moodIntense
        case .severe: return .moodSevere
        }
    }
}

/// Simple particle system for rain/snow effects
struct ParticleEmitter: View {
    let intensity: Double

    var body: some View {
        GeometryReader { geometry in
            ForEach(0..<Int(50 * intensity), id: \.self) { i in
                Circle()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 2, height: 2)
                    .modifier(FallingParticle(
                        screenHeight: geometry.size.height,
                        delay: Double(i) * 0.1
                    ))
            }
        }
    }
}

struct FallingParticle: ViewModifier {
    let screenHeight: CGFloat
    let delay: Double

    @State private var yOffset: CGFloat = -100
    @State private var xOffset: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .offset(x: xOffset, y: yOffset)
            .onAppear {
                xOffset = CGFloat.random(in: 0...1920)
                withAnimation(
                    .linear(duration: Double.random(in: 3...6))
                    .repeatForever(autoreverses: false)
                    .delay(delay)
                ) {
                    yOffset = screenHeight + 100
                }
            }
    }
}
```

---

## 5. Data Models

### 5.1 Weather Models

```swift
// Models/WeatherModels.swift

import Foundation

// MARK: - Weather Condition
enum WeatherCondition: String, Codable, CaseIterable {
    case clear
    case partlyCloudy = "partly_cloudy"
    case cloudy
    case overcast
    case fog
    case drizzle
    case rain
    case heavyRain = "heavy_rain"
    case thunderstorm
    case snow
    case heavySnow = "heavy_snow"
    case sleet
    case hail
    case wind

    /// SF Symbol name for this condition
    var iconName: String {
        switch self {
        case .clear: return "sun.max.fill"
        case .partlyCloudy: return "cloud.sun.fill"
        case .cloudy: return "cloud.fill"
        case .overcast: return "smoke.fill"
        case .fog: return "cloud.fog.fill"
        case .drizzle: return "cloud.drizzle.fill"
        case .rain: return "cloud.rain.fill"
        case .heavyRain: return "cloud.heavyrain.fill"
        case .thunderstorm: return "cloud.bolt.rain.fill"
        case .snow: return "cloud.snow.fill"
        case .heavySnow: return "cloud.snow.fill"
        case .sleet: return "cloud.sleet.fill"
        case .hail: return "cloud.hail.fill"
        case .wind: return "wind"
        }
    }

    /// Night variant of the icon
    var nightIconName: String {
        switch self {
        case .clear: return "moon.stars.fill"
        case .partlyCloudy: return "cloud.moon.fill"
        default: return iconName
        }
    }
}

// MARK: - Material Mood
enum MaterialMood: String, Codable {
    case calm
    case active
    case intense
    case severe

    /// Calculate mood from weather conditions
    static func calculate(
        condition: WeatherCondition,
        windSpeed: Double,
        precipitation: Double
    ) -> MaterialMood {
        // Severe conditions
        if [.thunderstorm, .heavySnow, .hail].contains(condition) {
            return .severe
        }

        // Intense conditions
        if windSpeed > 50 || precipitation > 10 || condition == .heavyRain {
            return .intense
        }

        // Active conditions
        if windSpeed > 25 || precipitation > 2 ||
           [.rain, .drizzle, .snow, .sleet].contains(condition) {
            return .active
        }

        return .calm
    }
}

// MARK: - Air Quality
struct AirQuality: Codable, Equatable {
    let aqi: Int
    let category: AQICategory
    let pm2_5: Double
    let pm10: Double
    let europeanAqi: Int?

    enum AQICategory: String, Codable {
        case good
        case moderate
        case unhealthySensitive = "unhealthy_sensitive"
        case unhealthy
        case veryUnhealthy = "very_unhealthy"
        case hazardous

        var displayName: String {
            switch self {
            case .good: return "Good"
            case .moderate: return "Moderate"
            case .unhealthySensitive: return "Unhealthy for Sensitive"
            case .unhealthy: return "Unhealthy"
            case .veryUnhealthy: return "Very Unhealthy"
            case .hazardous: return "Hazardous"
            }
        }

        var color: Color {
            switch self {
            case .good: return .green
            case .moderate: return .yellow
            case .unhealthySensitive: return .orange
            case .unhealthy: return .red
            case .veryUnhealthy: return .purple
            case .hazardous: return Color(hex: "7E0023")
            }
        }
    }
}

// MARK: - Current Weather
struct CurrentWeather: Codable, Equatable, Identifiable {
    let id: String
    let timestamp: Date
    let temperature: Int
    let feelsLike: Int
    let humidity: Int
    let dewpoint: Int
    let pressure: Int
    let visibility: Int
    let uvIndex: Int
    let condition: WeatherCondition
    let conditionText: String
    let windSpeed: Int
    let windDirection: Int
    let windGust: Int?
    let precipitation: Double
    let cloudCover: Int
    let isDay: Bool
    let materialMood: MaterialMood
    let airQuality: AirQuality?
    let dataSource: String
    let lastFetched: Date

    /// Semantic tint color based on temperature
    var tintColor: Color {
        Color.temperatureTint(for: temperature)
    }
}

// MARK: - Hourly Forecast
struct HourlyForecast: Codable, Equatable, Identifiable {
    var id: String { time.ISO8601Format() }
    let time: Date
    let temperature: Int
    let feelsLike: Int
    let condition: WeatherCondition
    let precipitation: Double
    let precipitationProbability: Int
    let humidity: Int
    let windSpeed: Int
    let uvIndex: Int
    let confidence: Int // 0-100

    var hour: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "ha"
        return formatter.string(from: time)
    }

    var isNow: Bool {
        Calendar.current.isDate(time, equalTo: Date(), toGranularity: .hour)
    }
}

// MARK: - Daily Forecast
struct DailyForecast: Codable, Equatable, Identifiable {
    var id: String { date.ISO8601Format() }
    let date: Date
    let tempHigh: Int
    let tempLow: Int
    let condition: WeatherCondition
    let conditionText: String
    let precipitationProbability: Int
    let precipitationSum: Double
    let sunrise: Date
    let sunset: Date
    let uvIndexMax: Int
    let windSpeedMax: Int
    let confidence: Int // 0-100

    var dayName: String {
        if Calendar.current.isDateInToday(date) {
            return "Today"
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }
}

// MARK: - Complete Weather Data
struct WeatherData: Codable, Equatable {
    let locationId: String
    let current: CurrentWeather
    let hourly: [HourlyForecast]
    let daily: [DailyForecast]
    let alerts: [WeatherAlert]
    let lastUpdated: Date
}
```

### 5.2 Location Models

```swift
// Models/LocationModels.swift

import Foundation
import CloudKit

// MARK: - Weather Location
struct WeatherLocation: Codable, Equatable, Identifiable, Hashable {
    let id: String
    var name: String
    let latitude: Double
    let longitude: Double
    let timezone: String
    let country: String
    let region: Region
    var isCurrentLocation: Bool
    var sortOrder: Int

    enum Region: String, Codable {
        case us = "US"
        case eu = "EU"
        case other = "OTHER"
    }

    // MARK: - CloudKit Record Conversion

    static let recordType = "WeatherLocation"

    init(record: CKRecord) throws {
        guard let id = record["id"] as? String,
              let name = record["name"] as? String,
              let latitude = record["latitude"] as? Double,
              let longitude = record["longitude"] as? Double,
              let timezone = record["timezone"] as? String,
              let country = record["country"] as? String,
              let regionRaw = record["region"] as? String,
              let region = Region(rawValue: regionRaw),
              let isCurrentLocation = record["isCurrentLocation"] as? Bool,
              let sortOrder = record["sortOrder"] as? Int
        else {
            throw LocationError.invalidRecord
        }

        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.timezone = timezone
        self.country = country
        self.region = region
        self.isCurrentLocation = isCurrentLocation
        self.sortOrder = sortOrder
    }

    func toRecord() -> CKRecord {
        let record = CKRecord(recordType: Self.recordType)
        record["id"] = id as CKRecordValue
        record["name"] = name as CKRecordValue
        record["latitude"] = latitude as CKRecordValue
        record["longitude"] = longitude as CKRecordValue
        record["timezone"] = timezone as CKRecordValue
        record["country"] = country as CKRecordValue
        record["region"] = region.rawValue as CKRecordValue
        record["isCurrentLocation"] = isCurrentLocation as CKRecordValue
        record["sortOrder"] = sortOrder as CKRecordValue
        return record
    }

    // MARK: - Convenience Init

    init(
        id: String = UUID().uuidString,
        name: String,
        latitude: Double,
        longitude: Double,
        timezone: String = "auto",
        country: String,
        region: Region,
        isCurrentLocation: Bool = false,
        sortOrder: Int = 0
    ) {
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.timezone = timezone
        self.country = country
        self.region = region
        self.isCurrentLocation = isCurrentLocation
        self.sortOrder = sortOrder
    }
}

enum LocationError: Error {
    case invalidRecord
    case geocodingFailed
    case notFound
}
```

### 5.3 Alert Models

```swift
// Models/AlertModels.swift

import Foundation
import SwiftUI

// MARK: - Weather Alert
struct WeatherAlert: Codable, Equatable, Identifiable {
    let id: String
    let type: AlertType
    let event: String
    let headline: String
    let description: String
    let instruction: String?
    let sender: String
    let effective: Date
    let expires: Date
    let areas: [String]

    enum AlertType: String, Codable, CaseIterable {
        case info
        case advisory
        case watch
        case warning
        case severe
        case extreme

        var displayName: String {
            switch self {
            case .info: return "Information"
            case .advisory: return "Advisory"
            case .watch: return "Watch"
            case .warning: return "Warning"
            case .severe: return "Severe"
            case .extreme: return "Emergency"
            }
        }

        var color: Color {
            switch self {
            case .info: return .blue
            case .advisory: return .cyan
            case .watch: return .yellow
            case .warning: return .orange
            case .severe: return Color(red: 1.0, green: 0.5, blue: 0.0)
            case .extreme: return .red
            }
        }

        var iconName: String {
            switch self {
            case .info: return "info.circle.fill"
            case .advisory: return "exclamationmark.circle.fill"
            case .watch: return "eye.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .severe: return "exclamationmark.octagon.fill"
            case .extreme: return "exclamationmark.shield.fill"
            }
        }

        var shouldPulse: Bool {
            self == .severe || self == .extreme
        }
    }

    var isActive: Bool {
        let now = Date()
        return now >= effective && now <= expires
    }
}

// MARK: - Activity Recommendation
struct ActivityRecommendation: Codable, Equatable, Identifiable {
    let id: String
    let activity: String
    let category: Category
    let suitability: Suitability
    let reason: String
    let timeWindow: String?
    let tips: [String]?

    enum Category: String, Codable {
        case outdoor
        case indoor
        case exercise
        case social
        case relaxation

        var iconName: String {
            switch self {
            case .outdoor: return "leaf.fill"
            case .indoor: return "house.fill"
            case .exercise: return "figure.run"
            case .social: return "person.2.fill"
            case .relaxation: return "cup.and.saucer.fill"
            }
        }

        var color: Color {
            switch self {
            case .outdoor: return .activityOutdoor
            case .indoor: return .activityIndoor
            case .exercise: return .activityExercise
            case .social: return .activitySocial
            case .relaxation: return .activityRelaxation
            }
        }
    }

    enum Suitability: String, Codable {
        case perfect
        case good
        case okay
        case poor

        var displayName: String {
            switch self {
            case .perfect: return "Perfect"
            case .good: return "Good"
            case .okay: return "Fair"
            case .poor: return "Poor"
            }
        }

        var color: Color {
            switch self {
            case .perfect: return .green
            case .good: return .blue
            case .okay: return .yellow
            case .poor: return .red
            }
        }
    }
}
```

---

## 6. API Integration

### 6.1 Weather Service (Open-Meteo)

```swift
// Services/WeatherService.swift

import Foundation

/// Service for fetching weather data from Open-Meteo API
/// API Documentation: https://open-meteo.com/en/docs
actor WeatherService {
    static let shared = WeatherService()

    private let baseURL = "https://api.open-meteo.com/v1/forecast"
    private let airQualityURL = "https://air-quality-api.open-meteo.com/v1/air-quality"

    // Simple in-memory cache
    private var cache: [String: CacheEntry] = [:]
    private let cacheTTL: TimeInterval = 5 * 60 // 5 minutes

    private struct CacheEntry {
        let data: WeatherData
        let timestamp: Date

        var isValid: Bool {
            Date().timeIntervalSince(timestamp) < 5 * 60
        }
    }

    // MARK: - WMO Weather Codes

    private static let wmoWeatherCodes: [Int: (condition: WeatherCondition, text: String)] = [
        0: (.clear, "Clear sky"),
        1: (.clear, "Mainly clear"),
        2: (.partlyCloudy, "Partly cloudy"),
        3: (.cloudy, "Overcast"),
        45: (.fog, "Fog"),
        48: (.fog, "Depositing rime fog"),
        51: (.drizzle, "Light drizzle"),
        53: (.drizzle, "Moderate drizzle"),
        55: (.drizzle, "Dense drizzle"),
        61: (.rain, "Slight rain"),
        63: (.rain, "Moderate rain"),
        65: (.heavyRain, "Heavy rain"),
        66: (.sleet, "Light freezing rain"),
        67: (.sleet, "Heavy freezing rain"),
        71: (.snow, "Slight snow"),
        73: (.snow, "Moderate snow"),
        75: (.heavySnow, "Heavy snow"),
        77: (.snow, "Snow grains"),
        80: (.rain, "Slight rain showers"),
        81: (.rain, "Moderate rain showers"),
        82: (.heavyRain, "Violent rain showers"),
        85: (.snow, "Slight snow showers"),
        86: (.heavySnow, "Heavy snow showers"),
        95: (.thunderstorm, "Thunderstorm"),
        96: (.thunderstorm, "Thunderstorm with slight hail"),
        99: (.thunderstorm, "Thunderstorm with heavy hail")
    ]

    // MARK: - Fetch Weather

    /// Fetch complete weather data for a location
    func fetchWeather(for location: WeatherLocation) async throws -> WeatherData {
        let cacheKey = "\(location.latitude),\(location.longitude)"

        // Check cache
        if let entry = cache[cacheKey], entry.isValid {
            return entry.data
        }

        // Build URL
        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: String(location.latitude)),
            URLQueryItem(name: "longitude", value: String(location.longitude)),
            URLQueryItem(name: "current", value: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
                "precipitation",
                "cloud_cover",
                "pressure_msl",
                "visibility",
                "uv_index",
                "is_day"
            ].joined(separator: ",")),
            URLQueryItem(name: "hourly", value: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation_probability",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "uv_index"
            ].joined(separator: ",")),
            URLQueryItem(name: "daily", value: [
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "sunrise",
                "sunset",
                "uv_index_max",
                "precipitation_sum",
                "precipitation_probability_max",
                "weather_code",
                "wind_speed_10m_max"
            ].joined(separator: ",")),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "forecast_days", value: "7")
        ]

        let (data, response) = try await URLSession.shared.data(from: components.url!)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.apiError
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let apiResponse = try decoder.decode(OpenMeteoResponse.self, from: data)

        // Fetch air quality in parallel
        let airQuality = try? await fetchAirQuality(lat: location.latitude, lng: location.longitude)

        // Fetch alerts based on region
        let alerts = await fetchAlerts(for: location)

        // Transform response
        let weatherData = transform(
            response: apiResponse,
            locationId: location.id,
            airQuality: airQuality,
            alerts: alerts
        )

        // Cache result
        cache[cacheKey] = CacheEntry(data: weatherData, timestamp: Date())

        return weatherData
    }

    // MARK: - Air Quality

    private func fetchAirQuality(lat: Double, lng: Double) async throws -> AirQuality {
        var components = URLComponents(string: airQualityURL)!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: String(lat)),
            URLQueryItem(name: "longitude", value: String(lng)),
            URLQueryItem(name: "current", value: "us_aqi,european_aqi,pm2_5,pm10")
        ]

        let (data, _) = try await URLSession.shared.data(from: components.url!)
        let response = try JSONDecoder().decode(AirQualityResponse.self, from: data)

        let aqi = response.current.usAqi
        return AirQuality(
            aqi: aqi,
            category: aqiCategory(for: aqi),
            pm2_5: response.current.pm2_5,
            pm10: response.current.pm10,
            europeanAqi: response.current.europeanAqi
        )
    }

    private func aqiCategory(for aqi: Int) -> AirQuality.AQICategory {
        switch aqi {
        case 0...50: return .good
        case 51...100: return .moderate
        case 101...150: return .unhealthySensitive
        case 151...200: return .unhealthy
        case 201...300: return .veryUnhealthy
        default: return .hazardous
        }
    }

    // MARK: - Alerts

    private func fetchAlerts(for location: WeatherLocation) async -> [WeatherAlert] {
        switch location.region {
        case .us:
            return await fetchNOAAAlerts(lat: location.latitude, lng: location.longitude)
        case .eu:
            return await fetchEUAlerts(lat: location.latitude, lng: location.longitude, country: location.country)
        case .other:
            return []
        }
    }

    /// Fetch NOAA alerts for US locations
    private func fetchNOAAAlerts(lat: Double, lng: Double) async -> [WeatherAlert] {
        do {
            // Get forecast zone
            let pointURL = URL(string: "https://api.weather.gov/points/\(lat),\(lng)")!
            var request = URLRequest(url: pointURL)
            request.setValue("AuroraWeather/1.0", forHTTPHeaderField: "User-Agent")
            request.setValue("application/geo+json", forHTTPHeaderField: "Accept")

            let (pointData, _) = try await URLSession.shared.data(for: request)
            let pointResponse = try JSONDecoder().decode(NOAAPointResponse.self, from: pointData)

            guard let zoneURL = pointResponse.properties.forecastZone,
                  let zoneId = zoneURL.split(separator: "/").last else {
                return []
            }

            // Fetch alerts for zone
            let alertsURL = URL(string: "https://api.weather.gov/alerts/active?zone=\(zoneId)")!
            var alertRequest = URLRequest(url: alertsURL)
            alertRequest.setValue("AuroraWeather/1.0", forHTTPHeaderField: "User-Agent")

            let (alertsData, _) = try await URLSession.shared.data(for: alertRequest)
            let alertsResponse = try JSONDecoder().decode(NOAAAlertResponse.self, from: alertsData)

            return alertsResponse.features.map { feature in
                WeatherAlert(
                    id: feature.properties.id ?? UUID().uuidString,
                    type: mapNOAASeverity(feature.properties.severity),
                    event: feature.properties.event ?? "Weather Alert",
                    headline: feature.properties.headline ?? "",
                    description: feature.properties.description ?? "",
                    instruction: feature.properties.instruction,
                    sender: feature.properties.senderName ?? "National Weather Service",
                    effective: ISO8601DateFormatter().date(from: feature.properties.effective ?? "") ?? Date(),
                    expires: ISO8601DateFormatter().date(from: feature.properties.expires ?? "") ?? Date().addingTimeInterval(86400),
                    areas: feature.properties.areaDesc.map { [$0] } ?? []
                )
            }
        } catch {
            print("NOAA alerts error: \(error)")
            return []
        }
    }

    private func mapNOAASeverity(_ severity: String?) -> WeatherAlert.AlertType {
        switch severity?.lowercased() {
        case "extreme": return .extreme
        case "severe": return .severe
        case "moderate": return .warning
        case "minor": return .advisory
        default: return .info
        }
    }

    /// Fetch alerts for EU locations (derived from weather codes)
    private func fetchEUAlerts(lat: Double, lng: Double, country: String) async -> [WeatherAlert] {
        // EU alerts are derived from severe weather codes in the forecast
        // A proper implementation would use Meteoalarm API
        return []
    }

    // MARK: - Transform Response

    private func transform(
        response: OpenMeteoResponse,
        locationId: String,
        airQuality: AirQuality?,
        alerts: [WeatherAlert]
    ) -> WeatherData {
        let now = Date()

        // Current weather
        let weatherCode = response.current.weatherCode
        let wmo = Self.wmoWeatherCodes[weatherCode] ?? (.clear, "Unknown")

        let current = CurrentWeather(
            id: "\(locationId)-current",
            timestamp: response.current.time,
            temperature: Int(response.current.temperature2m.rounded()),
            feelsLike: Int(response.current.apparentTemperature.rounded()),
            humidity: Int(response.current.relativeHumidity2m),
            dewpoint: Int(response.current.temperature2m - Double(100 - response.current.relativeHumidity2m) / 5),
            pressure: Int(response.current.pressureMsl.rounded()),
            visibility: Int(response.current.visibility / 1000),
            uvIndex: Int(response.current.uvIndex.rounded()),
            condition: wmo.condition,
            conditionText: wmo.text,
            windSpeed: Int(response.current.windSpeed10m.rounded()),
            windDirection: Int(response.current.windDirection10m),
            windGust: response.current.windGusts10m.map { Int($0.rounded()) },
            precipitation: response.current.precipitation,
            cloudCover: response.current.cloudCover,
            isDay: response.current.isDay == 1,
            materialMood: MaterialMood.calculate(
                condition: wmo.condition,
                windSpeed: response.current.windSpeed10m,
                precipitation: response.current.precipitation
            ),
            airQuality: airQuality,
            dataSource: "Open-Meteo",
            lastFetched: now
        )

        // Hourly forecast (next 48 hours)
        let hourly: [HourlyForecast] = response.hourly.time.prefix(48).enumerated().map { index, time in
            let code = response.hourly.weatherCode[index]
            let hourWmo = Self.wmoWeatherCodes[code] ?? (.clear, "Unknown")
            let hoursAhead = max(0, Int(time.timeIntervalSince(now) / 3600))

            return HourlyForecast(
                time: time,
                temperature: Int(response.hourly.temperature2m[index].rounded()),
                feelsLike: Int(response.hourly.apparentTemperature[index].rounded()),
                condition: hourWmo.condition,
                precipitation: response.hourly.precipitation[index],
                precipitationProbability: response.hourly.precipitationProbability[index],
                humidity: Int(response.hourly.relativeHumidity2m[index]),
                windSpeed: Int(response.hourly.windSpeed10m[index].rounded()),
                uvIndex: Int(response.hourly.uvIndex[index].rounded()),
                confidence: calculateHourlyConfidence(hoursAhead: hoursAhead)
            )
        }

        // Daily forecast
        let daily: [DailyForecast] = response.daily.time.enumerated().map { index, date in
            let code = response.daily.weatherCode[index]
            let dayWmo = Self.wmoWeatherCodes[code] ?? (.clear, "Unknown")

            return DailyForecast(
                date: date,
                tempHigh: Int(response.daily.temperature2mMax[index].rounded()),
                tempLow: Int(response.daily.temperature2mMin[index].rounded()),
                condition: dayWmo.condition,
                conditionText: dayWmo.text,
                precipitationProbability: response.daily.precipitationProbabilityMax[index],
                precipitationSum: response.daily.precipitationSum[index],
                sunrise: response.daily.sunrise[index],
                sunset: response.daily.sunset[index],
                uvIndexMax: Int(response.daily.uvIndexMax[index].rounded()),
                windSpeedMax: Int(response.daily.windSpeed10mMax[index].rounded()),
                confidence: calculateDailyConfidence(daysAhead: index)
            )
        }

        return WeatherData(
            locationId: locationId,
            current: current,
            hourly: hourly,
            daily: daily,
            alerts: alerts,
            lastUpdated: now
        )
    }

    private func calculateHourlyConfidence(hoursAhead: Int) -> Int {
        switch hoursAhead {
        case 0...6: return 95
        case 7...12: return 90
        case 13...24: return 80
        case 25...36: return 70
        default: return 60
        }
    }

    private func calculateDailyConfidence(daysAhead: Int) -> Int {
        switch daysAhead {
        case 0...1: return 90
        case 2...3: return 80
        case 4...5: return 65
        default: return 50
        }
    }
}

// MARK: - API Response Types

struct OpenMeteoResponse: Codable {
    let current: CurrentResponse
    let hourly: HourlyResponse
    let daily: DailyResponse

    struct CurrentResponse: Codable {
        let time: Date
        let temperature2m: Double
        let relativeHumidity2m: Int
        let apparentTemperature: Double
        let weatherCode: Int
        let windSpeed10m: Double
        let windDirection10m: Int
        let windGusts10m: Double?
        let precipitation: Double
        let cloudCover: Int
        let pressureMsl: Double
        let visibility: Double
        let uvIndex: Double
        let isDay: Int

        enum CodingKeys: String, CodingKey {
            case time
            case temperature2m = "temperature_2m"
            case relativeHumidity2m = "relative_humidity_2m"
            case apparentTemperature = "apparent_temperature"
            case weatherCode = "weather_code"
            case windSpeed10m = "wind_speed_10m"
            case windDirection10m = "wind_direction_10m"
            case windGusts10m = "wind_gusts_10m"
            case precipitation
            case cloudCover = "cloud_cover"
            case pressureMsl = "pressure_msl"
            case visibility
            case uvIndex = "uv_index"
            case isDay = "is_day"
        }
    }

    struct HourlyResponse: Codable {
        let time: [Date]
        let temperature2m: [Double]
        let relativeHumidity2m: [Int]
        let apparentTemperature: [Double]
        let precipitationProbability: [Int]
        let precipitation: [Double]
        let weatherCode: [Int]
        let windSpeed10m: [Double]
        let uvIndex: [Double]

        enum CodingKeys: String, CodingKey {
            case time
            case temperature2m = "temperature_2m"
            case relativeHumidity2m = "relative_humidity_2m"
            case apparentTemperature = "apparent_temperature"
            case precipitationProbability = "precipitation_probability"
            case precipitation
            case weatherCode = "weather_code"
            case windSpeed10m = "wind_speed_10m"
            case uvIndex = "uv_index"
        }
    }

    struct DailyResponse: Codable {
        let time: [Date]
        let temperature2mMax: [Double]
        let temperature2mMin: [Double]
        let sunrise: [Date]
        let sunset: [Date]
        let uvIndexMax: [Double]
        let precipitationSum: [Double]
        let precipitationProbabilityMax: [Int]
        let weatherCode: [Int]
        let windSpeed10mMax: [Double]

        enum CodingKeys: String, CodingKey {
            case time
            case temperature2mMax = "temperature_2m_max"
            case temperature2mMin = "temperature_2m_min"
            case sunrise, sunset
            case uvIndexMax = "uv_index_max"
            case precipitationSum = "precipitation_sum"
            case precipitationProbabilityMax = "precipitation_probability_max"
            case weatherCode = "weather_code"
            case windSpeed10mMax = "wind_speed_10m_max"
        }
    }
}

struct AirQualityResponse: Codable {
    let current: Current

    struct Current: Codable {
        let usAqi: Int
        let europeanAqi: Int?
        let pm2_5: Double
        let pm10: Double

        enum CodingKeys: String, CodingKey {
            case usAqi = "us_aqi"
            case europeanAqi = "european_aqi"
            case pm2_5, pm10
        }
    }
}

struct NOAAPointResponse: Codable {
    let properties: Properties

    struct Properties: Codable {
        let forecastZone: String?
        let county: String?
    }
}

struct NOAAAlertResponse: Codable {
    let features: [Feature]

    struct Feature: Codable {
        let properties: AlertProperties
    }

    struct AlertProperties: Codable {
        let id: String?
        let event: String?
        let severity: String?
        let headline: String?
        let description: String?
        let instruction: String?
        let effective: String?
        let expires: String?
        let senderName: String?
        let areaDesc: String?
    }
}

enum WeatherError: Error {
    case apiError
    case decodingError
    case networkError
}
```

### 6.2 Geocoding Service

```swift
// Services/GeocodingService.swift

import Foundation

/// Service for geocoding location names using Nominatim API
actor GeocodingService {
    static let shared = GeocodingService()

    private let baseURL = "https://nominatim.openstreetmap.org/search"

    private let euCountries = Set([
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "NO", "CH"
    ])

    /// Search for a location by name
    func search(query: String) async throws -> WeatherLocation? {
        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "format", value: "json"),
            URLQueryItem(name: "limit", value: "1"),
            URLQueryItem(name: "addressdetails", value: "1")
        ]

        var request = URLRequest(url: components.url!)
        request.setValue("AuroraWeatherTV/1.0", forHTTPHeaderField: "User-Agent")

        let (data, _) = try await URLSession.shared.data(for: request)
        let results = try JSONDecoder().decode([NominatimResult].self, from: data)

        guard let result = results.first else {
            return nil
        }

        let countryCode = result.address?.countryCode?.uppercased() ?? ""
        let region: WeatherLocation.Region
        if countryCode == "US" {
            region = .us
        } else if euCountries.contains(countryCode) {
            region = .eu
        } else {
            region = .other
        }

        let name = result.address?.city
            ?? result.address?.town
            ?? result.address?.village
            ?? result.displayName.split(separator: ",").first.map(String.init)
            ?? "Unknown"

        return WeatherLocation(
            name: name,
            latitude: Double(result.lat) ?? 0,
            longitude: Double(result.lon) ?? 0,
            timezone: "auto",
            country: countryCode,
            region: region
        )
    }
}

struct NominatimResult: Codable {
    let lat: String
    let lon: String
    let displayName: String
    let address: Address?

    enum CodingKeys: String, CodingKey {
        case lat, lon
        case displayName = "display_name"
        case address
    }

    struct Address: Codable {
        let city: String?
        let town: String?
        let village: String?
        let countryCode: String?

        enum CodingKeys: String, CodingKey {
            case city, town, village
            case countryCode = "country_code"
        }
    }
}
```

---

## 7. Core Views Implementation

### 7.1 App Entry Point

```swift
// App/AuroraWeatherTVApp.swift

import SwiftUI

@main
struct AuroraWeatherTVApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.dark) // Always dark for glass effects
        }
    }
}
```

### 7.2 App State

```swift
// App/AppState.swift

import SwiftUI
import Combine

@MainActor
class AppState: ObservableObject {
    @Published var locations: [WeatherLocation] = []
    @Published var selectedLocationId: String?
    @Published var weatherData: [String: WeatherData] = [:]
    @Published var isLoading = false
    @Published var error: Error?

    // User preferences
    @AppStorage("temperatureUnit") var temperatureUnit: TemperatureUnit = .celsius
    @AppStorage("windSpeedUnit") var windSpeedUnit: WindSpeedUnit = .kmh

    enum TemperatureUnit: String, CaseIterable {
        case celsius, fahrenheit

        var symbol: String {
            switch self {
            case .celsius: return "°C"
            case .fahrenheit: return "°F"
            }
        }
    }

    enum WindSpeedUnit: String, CaseIterable {
        case kmh, mph, ms

        var symbol: String {
            switch self {
            case .kmh: return "km/h"
            case .mph: return "mph"
            case .ms: return "m/s"
            }
        }
    }

    var selectedLocation: WeatherLocation? {
        locations.first { $0.id == selectedLocationId }
    }

    var selectedWeather: WeatherData? {
        guard let id = selectedLocationId else { return nil }
        return weatherData[id]
    }

    init() {
        // Load default location for demo
        let sanFrancisco = WeatherLocation(
            name: "San Francisco",
            latitude: 37.7749,
            longitude: -122.4194,
            country: "US",
            region: .us,
            sortOrder: 0
        )
        locations = [sanFrancisco]
        selectedLocationId = sanFrancisco.id

        Task {
            await loadWeather()
        }
    }

    func loadWeather() async {
        isLoading = true
        error = nil

        for location in locations {
            do {
                let weather = try await WeatherService.shared.fetchWeather(for: location)
                weatherData[location.id] = weather
            } catch {
                self.error = error
            }
        }

        isLoading = false
    }

    func selectLocation(_ location: WeatherLocation) {
        selectedLocationId = location.id
    }

    func addLocation(_ location: WeatherLocation) async {
        var newLocation = location
        newLocation.sortOrder = locations.count
        locations.append(newLocation)

        do {
            let weather = try await WeatherService.shared.fetchWeather(for: newLocation)
            weatherData[newLocation.id] = weather
        } catch {
            self.error = error
        }
    }

    func removeLocation(_ location: WeatherLocation) {
        locations.removeAll { $0.id == location.id }
        weatherData.removeValue(forKey: location.id)

        if selectedLocationId == location.id {
            selectedLocationId = locations.first?.id
        }
    }

    func convertTemperature(_ celsius: Int) -> Int {
        switch temperatureUnit {
        case .celsius:
            return celsius
        case .fahrenheit:
            return Int(Double(celsius) * 9/5 + 32)
        }
    }
}
```

### 7.3 Content View (Tab Container)

```swift
// Views/Main/ContentView.swift

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            WeatherHomeView()
                .tabItem {
                    Label("Weather", systemImage: "sun.max.fill")
                }
                .tag(0)

            LocationsGridView()
                .tabItem {
                    Label("Locations", systemImage: "mappin.and.ellipse")
                }
                .tag(1)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(2)
        }
    }
}
```

### 7.4 Weather Home View

```swift
// Views/Main/WeatherHomeView.swift

import SwiftUI

struct WeatherHomeView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedSection: Section?

    enum Section: Hashable {
        case hero
        case hourly
        case daily
        case details
    }

    var body: some View {
        ZStack {
            // Animated background
            if let weather = appState.selectedWeather {
                AnimatedWeatherBackground(
                    mood: weather.current.materialMood,
                    isDay: weather.current.isDay
                )
            }

            // Content
            ScrollView {
                VStack(spacing: LiquidGlass.Spacing.xl) {
                    // Weather Hero
                    WeatherHeroView()
                        .focused($focusedSection, equals: .hero)

                    // Alerts (if any)
                    if let alerts = appState.selectedWeather?.alerts, !alerts.isEmpty {
                        AlertBanner(alert: alerts[0])
                    }

                    // Hourly Timeline
                    VStack(alignment: .leading, spacing: LiquidGlass.Spacing.md) {
                        Text("HOURLY FORECAST")
                            .font(AuroraTypography.caption)
                            .foregroundColor(.textTertiary)
                            .padding(.horizontal, LiquidGlass.Spacing.screenPadding)

                        HourlyTimelineView()
                            .focused($focusedSection, equals: .hourly)
                    }

                    // 7-Day Forecast
                    VStack(alignment: .leading, spacing: LiquidGlass.Spacing.md) {
                        Text("7-DAY FORECAST")
                            .font(AuroraTypography.caption)
                            .foregroundColor(.textTertiary)
                            .padding(.horizontal, LiquidGlass.Spacing.screenPadding)

                        DailyForecastView()
                            .focused($focusedSection, equals: .daily)
                    }

                    // Weather Details Grid
                    VStack(alignment: .leading, spacing: LiquidGlass.Spacing.md) {
                        Text("DETAILS")
                            .font(AuroraTypography.caption)
                            .foregroundColor(.textTertiary)
                            .padding(.horizontal, LiquidGlass.Spacing.screenPadding)

                        WeatherDetailsGrid()
                            .focused($focusedSection, equals: .details)
                    }

                    // Activity Recommendations
                    if let weather = appState.selectedWeather {
                        ActivityRecommendationsView(weather: weather)
                    }

                    Spacer(minLength: LiquidGlass.Spacing.xxl)
                }
                .padding(.top, LiquidGlass.Spacing.xl)
            }
        }
        .onAppear {
            focusedSection = .hourly
        }
    }
}
```

### 7.5 Weather Hero View

```swift
// Views/Weather/WeatherHeroView.swift

import SwiftUI

struct WeatherHeroView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        GlassCard(material: .regular) {
            VStack(spacing: LiquidGlass.Spacing.lg) {
                // Location name
                HStack {
                    Image(systemName: "location.fill")
                        .font(.system(size: 24))
                    Text(appState.selectedLocation?.name ?? "Unknown")
                        .font(AuroraTypography.sectionHeader)
                }
                .foregroundColor(.textPrimary)

                // Weather icon and temperature
                HStack(alignment: .top, spacing: LiquidGlass.Spacing.xl) {
                    // Icon
                    if let weather = appState.selectedWeather {
                        Image(systemName: weather.current.isDay
                            ? weather.current.condition.iconName
                            : weather.current.condition.nightIconName)
                            .font(.system(size: 180))
                            .foregroundStyle(weather.current.tintColor)
                            .shadow(color: weather.current.tintColor.opacity(0.5), radius: 30)
                    }

                    // Temperature
                    VStack(alignment: .leading, spacing: LiquidGlass.Spacing.sm) {
                        if let weather = appState.selectedWeather {
                            Text("\(appState.convertTemperature(weather.current.temperature))°")
                                .font(AuroraTypography.temperatureHero)
                                .foregroundColor(.textPrimary)

                            Text("Feels like \(appState.convertTemperature(weather.current.feelsLike))°")
                                .font(AuroraTypography.bodyLarge)
                                .foregroundColor(.textSecondary)

                            Text(weather.current.conditionText)
                                .font(AuroraTypography.cardTitle)
                                .foregroundColor(.textPrimary)

                            // Material Mood Badge
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(moodColor(weather.current.materialMood))
                                    .frame(width: 12, height: 12)
                                Text(weather.current.materialMood.rawValue.capitalized)
                                    .font(AuroraTypography.caption)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.glassSurface)
                            .clipShape(Capsule())
                        }
                    }
                }

                // Data source
                if let weather = appState.selectedWeather {
                    Text("\(weather.current.dataSource) • Updated \(timeAgo(weather.lastUpdated))")
                        .font(AuroraTypography.caption)
                        .foregroundColor(.textTertiary)
                }
            }
            .padding(LiquidGlass.Spacing.xl)
        }
        .padding(.horizontal, LiquidGlass.Spacing.screenPadding)
    }

    private func moodColor(_ mood: MaterialMood) -> Color {
        switch mood {
        case .calm: return .moodCalm
        case .active: return .moodActive
        case .intense: return .moodIntense
        case .severe: return .moodSevere
        }
    }

    private func timeAgo(_ date: Date) -> String {
        let minutes = Int(Date().timeIntervalSince(date) / 60)
        if minutes < 1 { return "just now" }
        if minutes == 1 { return "1 min ago" }
        if minutes < 60 { return "\(minutes) min ago" }
        let hours = minutes / 60
        if hours == 1 { return "1 hour ago" }
        return "\(hours) hours ago"
    }
}
```

### 7.6 Hourly Timeline View

```swift
// Views/Weather/HourlyTimelineView.swift

import SwiftUI

struct HourlyTimelineView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedHour: String?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: LiquidGlass.Spacing.md) {
                if let hourly = appState.selectedWeather?.hourly {
                    ForEach(hourly.prefix(24)) { hour in
                        HourlyItemCard(hour: hour, isFocused: focusedHour == hour.id)
                            .focused($focusedHour, equals: hour.id)
                    }
                }
            }
            .padding(.horizontal, LiquidGlass.Spacing.screenPadding)
        }
    }
}

struct HourlyItemCard: View {
    let hour: HourlyForecast
    let isFocused: Bool
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: LiquidGlass.Spacing.sm) {
            // Time
            Text(hour.isNow ? "Now" : hour.hour)
                .font(AuroraTypography.caption)
                .foregroundColor(hour.isNow ? .accent : .textSecondary)

            // Icon
            Image(systemName: hour.condition.iconName)
                .font(.system(size: 48))
                .foregroundStyle(Color.temperatureTint(for: hour.temperature))

            // Temperature
            Text("\(appState.convertTemperature(hour.temperature))°")
                .font(AuroraTypography.cardTitle)
                .foregroundColor(.textPrimary)

            // Precipitation probability (if > 10%)
            if hour.precipitationProbability > 10 {
                HStack(spacing: 4) {
                    Image(systemName: "drop.fill")
                        .font(.system(size: 16))
                    Text("\(hour.precipitationProbability)%")
                        .font(AuroraTypography.caption)
                }
                .foregroundColor(.blue)
            }
        }
        .frame(width: 120, height: 180)
        .background(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.medium)
                .fill(hour.isNow ? Color.accent.opacity(0.2) : Color.glassSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.medium)
                .strokeBorder(
                    isFocused ? Color.accent : (hour.isNow ? Color.accent.opacity(0.5) : .clear),
                    lineWidth: isFocused ? 3 : 1
                )
        )
        .scaleEffect(isFocused ? LiquidGlass.Focus.scaleUp : 1.0)
        .shadow(
            color: isFocused ? Color.accent.opacity(0.3) : .clear,
            radius: isFocused ? 20 : 0,
            y: isFocused ? 10 : 0
        )
        .animation(LiquidGlass.Animation.focusSpring, value: isFocused)
    }
}
```

### 7.7 Daily Forecast View

```swift
// Views/Weather/DailyForecastView.swift

import SwiftUI

struct DailyForecastView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedDay: String?

    var body: some View {
        GlassCard(material: .regular, padding: 0) {
            VStack(spacing: 0) {
                if let daily = appState.selectedWeather?.daily {
                    ForEach(Array(daily.enumerated()), id: \.element.id) { index, day in
                        DailyRowView(day: day, isFocused: focusedDay == day.id)
                            .focused($focusedDay, equals: day.id)

                        if index < daily.count - 1 {
                            Divider()
                                .background(Color.glassBorder)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, LiquidGlass.Spacing.screenPadding)
    }
}

struct DailyRowView: View {
    let day: DailyForecast
    let isFocused: Bool
    @EnvironmentObject var appState: AppState

    var body: some View {
        HStack(spacing: LiquidGlass.Spacing.lg) {
            // Day name
            Text(day.dayName)
                .font(AuroraTypography.bodyLarge)
                .foregroundColor(day.isToday ? .accent : .textPrimary)
                .frame(width: 100, alignment: .leading)

            // Weather icon
            Image(systemName: day.condition.iconName)
                .font(.system(size: 36))
                .foregroundStyle(Color.temperatureTint(for: day.tempHigh))
                .frame(width: 50)

            // Temperature bar
            TemperatureBar(low: day.tempLow, high: day.tempHigh)
                .frame(height: 8)

            // Low/High
            HStack(spacing: LiquidGlass.Spacing.md) {
                Text("\(appState.convertTemperature(day.tempLow))°")
                    .font(AuroraTypography.body)
                    .foregroundColor(.textSecondary)
                    .frame(width: 50, alignment: .trailing)

                Text("/")
                    .foregroundColor(.textTertiary)

                Text("\(appState.convertTemperature(day.tempHigh))°")
                    .font(AuroraTypography.bodyLarge)
                    .foregroundColor(.textPrimary)
                    .frame(width: 50, alignment: .leading)
            }

            // Precipitation
            if day.precipitationProbability > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "drop.fill")
                    Text("\(day.precipitationProbability)%")
                }
                .font(AuroraTypography.caption)
                .foregroundColor(.blue)
                .frame(width: 80)
            } else {
                Spacer()
                    .frame(width: 80)
            }
        }
        .padding(.horizontal, LiquidGlass.Spacing.lg)
        .padding(.vertical, LiquidGlass.Spacing.md)
        .background(
            isFocused ? Color.glassElevated : Color.clear
        )
        .animation(LiquidGlass.Animation.focusSpring, value: isFocused)
    }
}

struct TemperatureBar: View {
    let low: Int
    let high: Int

    // Assume range of -10 to 40 for bar positioning
    private let minTemp: Double = -10
    private let maxTemp: Double = 40

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let range = maxTemp - minTemp
            let lowPosition = (Double(low) - minTemp) / range * width
            let highPosition = (Double(high) - minTemp) / range * width

            ZStack(alignment: .leading) {
                // Background track
                Capsule()
                    .fill(Color.glassBorder)

                // Temperature range
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.temperatureTint(for: low),
                                Color.temperatureTint(for: high)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: highPosition - lowPosition)
                    .offset(x: lowPosition)
            }
        }
    }
}
```

### 7.8 Locations Grid View

```swift
// Views/Main/LocationsGridView.swift

import SwiftUI

struct LocationsGridView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var focusedLocation: String?

    let columns = [
        GridItem(.flexible(), spacing: LiquidGlass.Spacing.lg),
        GridItem(.flexible(), spacing: LiquidGlass.Spacing.lg),
        GridItem(.flexible(), spacing: LiquidGlass.Spacing.lg)
    ]

    var body: some View {
        ZStack {
            // Background
            Color.black.opacity(0.95)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: LiquidGlass.Spacing.xl) {
                    Text("Your Locations")
                        .font(AuroraTypography.pageTitle)
                        .foregroundColor(.textPrimary)

                    LazyVGrid(columns: columns, spacing: LiquidGlass.Spacing.lg) {
                        ForEach(appState.locations) { location in
                            LocationCard(
                                location: location,
                                weather: appState.weatherData[location.id],
                                isFocused: focusedLocation == location.id,
                                isSelected: appState.selectedLocationId == location.id
                            )
                            .focused($focusedLocation, equals: location.id)
                            .onTapGesture {
                                appState.selectLocation(location)
                            }
                        }

                        // Add Location Card
                        AddLocationCard(isFocused: focusedLocation == "add")
                            .focused($focusedLocation, equals: "add")
                    }

                    Spacer(minLength: LiquidGlass.Spacing.xxl)
                }
                .padding(LiquidGlass.Spacing.screenPadding)
            }
        }
    }
}

struct LocationCard: View {
    let location: WeatherLocation
    let weather: WeatherData?
    let isFocused: Bool
    let isSelected: Bool

    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: LiquidGlass.Spacing.md) {
            // Location name
            Text(location.name)
                .font(AuroraTypography.cardTitle)
                .foregroundColor(.textPrimary)

            if let weather = weather {
                // Weather icon
                Image(systemName: weather.current.isDay
                    ? weather.current.condition.iconName
                    : weather.current.condition.nightIconName)
                    .font(.system(size: 64))
                    .foregroundStyle(weather.current.tintColor)

                // Temperature
                Text("\(appState.convertTemperature(weather.current.temperature))°")
                    .font(AuroraTypography.metricValue)
                    .foregroundColor(.textPrimary)

                // Condition
                Text(weather.current.conditionText)
                    .font(AuroraTypography.body)
                    .foregroundColor(.textSecondary)
            } else {
                ProgressView()
                    .frame(height: 100)
            }

            // Selected indicator
            if isSelected {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Current")
                }
                .font(AuroraTypography.caption)
                .foregroundColor(.accent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(LiquidGlass.Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                        .fill(isSelected ? Color.accent.opacity(0.1) : Color.clear)
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                .strokeBorder(
                    isFocused ? Color.accent : (isSelected ? Color.accent.opacity(0.5) : Color.glassBorder),
                    lineWidth: isFocused ? 3 : 1
                )
        )
        .scaleEffect(isFocused ? LiquidGlass.Focus.scaleUp : 1.0)
        .shadow(
            color: isFocused ? Color.accent.opacity(0.3) : .clear,
            radius: isFocused ? LiquidGlass.Focus.shadowRadius : 0,
            y: isFocused ? LiquidGlass.Focus.shadowY : 0
        )
        .animation(LiquidGlass.Animation.focusSpring, value: isFocused)
    }
}

struct AddLocationCard: View {
    let isFocused: Bool

    var body: some View {
        VStack(spacing: LiquidGlass.Spacing.md) {
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.accent)

            Text("Add Location")
                .font(AuroraTypography.cardTitle)
                .foregroundColor(.textPrimary)

            Text("Say a city name\nor use iPhone")
                .font(AuroraTypography.body)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(LiquidGlass.Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                        .strokeBorder(
                            style: StrokeStyle(lineWidth: 2, dash: [10])
                        )
                        .foregroundColor(Color.glassBorder)
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: LiquidGlass.Radius.large)
                .strokeBorder(
                    isFocused ? Color.accent : .clear,
                    lineWidth: 3
                )
        )
        .scaleEffect(isFocused ? LiquidGlass.Focus.scaleUp : 1.0)
        .animation(LiquidGlass.Animation.focusSpring, value: isFocused)
    }
}
```

---

## 8. Navigation & Focus System

### 8.1 Focus State Management

The tvOS focus system is central to navigation. Key principles:

1. **Every interactive element must be focusable**
2. **Use `@FocusState` to track and control focus**
3. **Visual feedback must be immediate and clear**
4. **Focus movement should feel natural**

```swift
// Example focus management pattern
struct FocusableSection: View {
    @FocusState private var focusedItem: String?

    var body: some View {
        VStack {
            ForEach(items) { item in
                ItemView(item: item, isFocused: focusedItem == item.id)
                    .focused($focusedItem, equals: item.id)
            }
        }
        .onAppear {
            // Set initial focus
            focusedItem = items.first?.id
        }
    }
}
```

### 8.2 Siri Remote Button Handling

```swift
// Handle Siri Remote buttons
struct WeatherHomeView: View {
    var body: some View {
        ContentView()
            .onPlayPauseCommand {
                // Toggle between hourly and daily view
                toggleView()
            }
            .onMoveCommand { direction in
                // Handle D-pad navigation
                handleMove(direction)
            }
            .onExitCommand {
                // Handle Menu button
                handleExit()
            }
    }
}
```

---

## 9. Siri Voice Integration

### 9.1 Intent Definition

Create `Intents.intentdefinition` in Xcode with:

```yaml
Intent: WeatherQuery
  Parameters:
    - location: String (optional)
    - timeframe: Enum [now, today, tomorrow, thisWeek]

  Responses:
    - success: "It's currently {temperature}° and {condition} in {location}"
    - failure: "I couldn't find weather for that location"

Intent: AddLocation
  Parameters:
    - locationName: String (required)

  Responses:
    - success: "{locationName} has been added to your locations"
    - failure: "I couldn't find {locationName}"
```

### 9.2 Intent Handler

```swift
// Intents/WeatherIntentHandler.swift

import Intents

class WeatherIntentHandler: NSObject, WeatherQueryIntentHandling {

    func handle(intent: WeatherQueryIntent) async -> WeatherQueryIntentResponse {
        let locationName = intent.location ?? "current location"

        do {
            // If no location specified, use selected location
            let location: WeatherLocation
            if let name = intent.location {
                guard let found = try await GeocodingService.shared.search(query: name) else {
                    return WeatherQueryIntentResponse(code: .failure, userActivity: nil)
                }
                location = found
            } else {
                // Use default/selected location from app state
                location = WeatherLocation(
                    name: "San Francisco",
                    latitude: 37.7749,
                    longitude: -122.4194,
                    country: "US",
                    region: .us
                )
            }

            let weather = try await WeatherService.shared.fetchWeather(for: location)

            let response = WeatherQueryIntentResponse(code: .success, userActivity: nil)
            response.temperature = NSNumber(value: weather.current.temperature)
            response.condition = weather.current.conditionText
            response.location = location.name

            return response
        } catch {
            return WeatherQueryIntentResponse(code: .failure, userActivity: nil)
        }
    }

    func resolveLocation(for intent: WeatherQueryIntent) async -> INStringResolutionResult {
        if let location = intent.location, !location.isEmpty {
            return .success(with: location)
        }
        return .notRequired()
    }
}
```

### 9.3 Supported Voice Commands

| Command | Action |
|---------|--------|
| "What's the weather?" | Show current weather |
| "What's the weather in Paris?" | Switch to Paris weather |
| "Will it rain today?" | Highlight precipitation info |
| "Add New York to my locations" | Add new location |
| "Show me the forecast" | Navigate to 7-day view |

---

## 10. Top Shelf Extension

### 10.1 Content Provider

```swift
// TopShelfExtension/ContentProvider.swift

import TVServices

class ContentProvider: TVTopShelfContentProvider {

    override func loadTopShelfContent() async -> TVTopShelfContent? {
        // Fetch saved locations and weather
        let locations = loadSavedLocations()

        var items: [TVTopShelfSectionedItem] = []

        for location in locations.prefix(5) {
            if let weather = await fetchWeatherForTopShelf(location: location) {
                let item = TVTopShelfSectionedItem(identifier: location.id)

                // Set image (would need pre-rendered weather images)
                item.setImageURL(weatherImageURL(for: weather), for: .screenScale1x)
                item.setImageURL(weatherImageURL2x(for: weather), for: .screenScale2x)

                item.title = location.name
                item.displayAction = TVTopShelfAction(url: URL(string: "aurora://location/\(location.id)")!)

                items.append(item)
            }
        }

        let section = TVTopShelfItemCollection(items: items)
        section.title = "Weather"

        return TVTopShelfSectionedContent(sections: [section])
    }

    private func loadSavedLocations() -> [WeatherLocation] {
        // Load from shared UserDefaults or CloudKit
        // This is accessed via App Groups
        guard let data = UserDefaults(suiteName: "group.com.liquidcrypto.aurora")?
            .data(forKey: "savedLocations"),
              let locations = try? JSONDecoder().decode([WeatherLocation].self, from: data)
        else {
            return []
        }
        return locations
    }

    private func fetchWeatherForTopShelf(location: WeatherLocation) async -> CurrentWeather? {
        // Simplified fetch for top shelf
        // Use cached data if available
        return nil // Implement actual fetch
    }

    private func weatherImageURL(for weather: CurrentWeather) -> URL? {
        // Return URL to pre-rendered weather condition image
        // These would be stored in the app bundle or fetched from a CDN
        return nil
    }
}
```

---

## 11. Screensaver Extension

> **Note**: Custom screensavers require tvOS 18+ and special entitlements.

### 11.1 Screensaver View

```swift
// ScreensaverExtension/WeatherScreensaver.swift

import SwiftUI
import ScreenSaver // tvOS 18+ framework

@main
struct WeatherScreensaverApp: App {
    var body: some Scene {
        WindowGroup {
            ScreensaverView()
        }
    }
}

struct ScreensaverView: View {
    @State private var currentLocation: WeatherLocation?
    @State private var weather: WeatherData?
    @State private var locationIndex = 0

    let timer = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            // Animated background
            if let weather = weather {
                AnimatedWeatherBackground(
                    mood: weather.current.materialMood,
                    isDay: weather.current.isDay
                )
            } else {
                Color.black
            }

            // Weather display
            VStack(spacing: LiquidGlass.Spacing.xl) {
                Spacer()

                if let location = currentLocation, let weather = weather {
                    // Location
                    Text(location.name)
                        .font(.system(size: 48, weight: .medium))
                        .foregroundColor(.textSecondary)

                    // Temperature
                    Text("\(weather.current.temperature)°")
                        .font(.system(size: 200, weight: .bold, design: .rounded))
                        .foregroundColor(.textPrimary)

                    // Condition
                    HStack(spacing: 20) {
                        Image(systemName: weather.current.condition.iconName)
                            .font(.system(size: 60))
                        Text(weather.current.conditionText)
                            .font(.system(size: 36))
                    }
                    .foregroundColor(.textSecondary)
                }

                Spacer()

                // Clock
                Text(Date(), style: .time)
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(.textTertiary)
                    .padding(.bottom, 60)
            }
        }
        .onReceive(timer) { _ in
            cycleLocation()
        }
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        // Load locations and weather
    }

    private func cycleLocation() {
        // Cycle through saved locations
    }
}
```

---

## 12. iCloud Sync

### 12.1 Sync Service

```swift
// Services/SyncService.swift

import CloudKit
import Combine

@MainActor
class SyncService: ObservableObject {
    static let shared = SyncService()

    private let container = CKContainer(identifier: "iCloud.com.liquidcrypto.aurora")
    private var subscriptions = Set<AnyCancellable>()

    @Published var syncStatus: SyncStatus = .idle

    enum SyncStatus {
        case idle
        case syncing
        case error(Error)
        case success
    }

    // MARK: - Fetch Locations

    func fetchLocations() async throws -> [WeatherLocation] {
        let database = container.privateCloudDatabase
        let query = CKQuery(
            recordType: WeatherLocation.recordType,
            predicate: NSPredicate(value: true)
        )
        query.sortDescriptors = [NSSortDescriptor(key: "sortOrder", ascending: true)]

        let (results, _) = try await database.records(matching: query)

        return results.compactMap { _, result in
            try? result.get()
        }.compactMap { record in
            try? WeatherLocation(record: record)
        }
    }

    // MARK: - Save Location

    func saveLocation(_ location: WeatherLocation) async throws {
        let record = location.toRecord()
        try await container.privateCloudDatabase.save(record)
    }

    // MARK: - Delete Location

    func deleteLocation(_ location: WeatherLocation) async throws {
        let recordID = CKRecord.ID(recordName: location.id)
        try await container.privateCloudDatabase.deleteRecord(withID: recordID)
    }

    // MARK: - Subscribe to Changes

    func subscribeToChanges() async throws {
        let subscription = CKQuerySubscription(
            recordType: WeatherLocation.recordType,
            predicate: NSPredicate(value: true),
            options: [.firesOnRecordCreation, .firesOnRecordDeletion, .firesOnRecordUpdate]
        )

        let notificationInfo = CKSubscription.NotificationInfo()
        notificationInfo.shouldSendContentAvailable = true
        subscription.notificationInfo = notificationInfo

        try await container.privateCloudDatabase.save(subscription)
    }
}
```

---

## 13. Accessibility

### 13.1 VoiceOver Support

```swift
// Ensure all views have proper accessibility labels

struct WeatherHeroView: View {
    var body: some View {
        VStack {
            // ... content
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityDescription)
    }

    private var accessibilityDescription: String {
        guard let weather = appState.selectedWeather,
              let location = appState.selectedLocation else {
            return "Loading weather"
        }

        return """
        Current weather in \(location.name): \
        \(weather.current.temperature) degrees, \
        \(weather.current.conditionText). \
        Feels like \(weather.current.feelsLike) degrees.
        """
    }
}

struct HourlyItemCard: View {
    let hour: HourlyForecast

    var body: some View {
        VStack {
            // ... content
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(hour.hour): \(hour.temperature) degrees, \(hour.condition.rawValue)")
        .accessibilityHint("Click to see detailed forecast")
    }
}
```

### 13.2 Reduce Motion Support

```swift
// Respect user's reduce motion preference

struct AnimatedWeatherBackground: View {
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    var body: some View {
        ZStack {
            // Static gradient for reduced motion
            if reduceMotion {
                LinearGradient(colors: gradientColors, startPoint: .top, endPoint: .bottom)
            } else {
                // Full animated background
                AnimatedGradient(colors: gradientColors)
            }
        }
    }
}
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

```swift
// Tests/AuroraWeatherTVTests/WeatherServiceTests.swift

import XCTest
@testable import AuroraWeatherTV

final class WeatherServiceTests: XCTestCase {

    func testFetchWeather() async throws {
        let location = WeatherLocation(
            name: "San Francisco",
            latitude: 37.7749,
            longitude: -122.4194,
            country: "US",
            region: .us
        )

        let weather = try await WeatherService.shared.fetchWeather(for: location)

        XCTAssertEqual(weather.locationId, location.id)
        XCTAssertFalse(weather.hourly.isEmpty)
        XCTAssertFalse(weather.daily.isEmpty)
    }

    func testMaterialMoodCalculation() {
        // Calm conditions
        let calm = MaterialMood.calculate(condition: .clear, windSpeed: 10, precipitation: 0)
        XCTAssertEqual(calm, .calm)

        // Active conditions
        let active = MaterialMood.calculate(condition: .rain, windSpeed: 30, precipitation: 5)
        XCTAssertEqual(active, .active)

        // Severe conditions
        let severe = MaterialMood.calculate(condition: .thunderstorm, windSpeed: 60, precipitation: 20)
        XCTAssertEqual(severe, .severe)
    }

    func testTemperatureConversion() {
        let appState = AppState()

        appState.temperatureUnit = .celsius
        XCTAssertEqual(appState.convertTemperature(20), 20)

        appState.temperatureUnit = .fahrenheit
        XCTAssertEqual(appState.convertTemperature(20), 68)
    }
}
```

### 14.2 UI Tests

```swift
// Tests/AuroraWeatherTVUITests/NavigationTests.swift

import XCTest

final class NavigationTests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        continueAfterFailure = false
        app.launch()
    }

    func testTabNavigation() {
        // Weather tab should be visible
        XCTAssertTrue(app.staticTexts["San Francisco"].exists)

        // Navigate to Locations tab
        let locationsTab = app.tabBars.buttons["Locations"]
        locationsTab.tap()

        XCTAssertTrue(app.staticTexts["Your Locations"].exists)

        // Navigate to Settings tab
        let settingsTab = app.tabBars.buttons["Settings"]
        settingsTab.tap()

        XCTAssertTrue(app.staticTexts["Settings"].exists)
    }

    func testHourlyTimelineNavigation() {
        // Focus on hourly timeline
        XCUIRemote.shared.press(.down)
        XCUIRemote.shared.press(.down)

        // Swipe through hours
        XCUIRemote.shared.press(.right)
        XCUIRemote.shared.press(.right)

        // Verify focus moved
        // (Would need accessibility identifiers to verify specific hour)
    }
}
```

---

## 15. Build & Deployment

### 15.1 Build Configuration

```yaml
# Xcode Build Settings

Debug:
  SWIFT_OPTIMIZATION_LEVEL: -Onone
  DEBUG_INFORMATION_FORMAT: dwarf-with-dsym

Release:
  SWIFT_OPTIMIZATION_LEVEL: -O
  ENABLE_BITCODE: YES
  STRIP_INSTALLED_PRODUCT: YES
```

### 15.2 App Store Assets Required

| Asset | Size | Notes |
|-------|------|-------|
| App Icon (1x) | 400×240 | Layered for parallax |
| App Icon (2x) | 800×480 | Layered for parallax |
| Top Shelf (1x) | 1920×720 | Wide format |
| Top Shelf (2x) | 2940×1560 | Wide format |
| App Preview | 1920×1080 | Video, 15-30 seconds |
| Screenshots | 1920×1080 | At least 5 |

### 15.3 TestFlight Distribution

1. Archive app in Xcode (Product → Archive)
2. Validate archive
3. Upload to App Store Connect
4. Add internal/external testers in TestFlight
5. Distribute builds

---

## 16. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Basic weather display with focus navigation

- [ ] Project setup with all dependencies
- [ ] Design system implementation (LiquidGlass tokens)
- [ ] Weather service integration (Open-Meteo)
- [ ] Weather Home view with hero
- [ ] Hourly timeline (focusable)
- [ ] 7-day forecast grid
- [ ] Basic focus navigation

**Deliverable**: App displays weather for hardcoded location

### Phase 2: Multi-Location (Weeks 3-4)

**Goal**: Full location management

- [ ] Locations grid view
- [ ] Add/remove locations
- [ ] Geocoding service integration
- [ ] Location persistence (UserDefaults)
- [ ] Location switching
- [ ] Weather data caching

**Deliverable**: Users can add and switch between locations

### Phase 3: Alerts & Details (Week 5)

**Goal**: Complete weather information

- [ ] Weather alerts (NOAA/EU)
- [ ] Alert modal (full-screen)
- [ ] Weather details grid
- [ ] Air quality card
- [ ] Activity recommendations
- [ ] Animated weather backgrounds

**Deliverable**: Full weather feature set

### Phase 4: Voice & Extensions (Week 6)

**Goal**: Siri and tvOS integrations

- [ ] Siri voice commands
- [ ] Top Shelf extension
- [ ] Basic iCloud sync
- [ ] Settings view
- [ ] Deep linking

**Deliverable**: Voice control and Home Screen presence

### Phase 5: Polish & Launch (Weeks 7-8)

**Goal**: Production-ready app

- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Error handling
- [ ] Unit tests
- [ ] UI tests
- [ ] App Store assets
- [ ] TestFlight distribution
- [ ] App Store submission

**Deliverable**: App Store release

---

## Appendix A: Quick Reference

### API Endpoints

| Service | URL | Auth |
|---------|-----|------|
| Open-Meteo Weather | `https://api.open-meteo.com/v1/forecast` | None |
| Open-Meteo Air Quality | `https://air-quality-api.open-meteo.com/v1/air-quality` | None |
| Nominatim Geocoding | `https://nominatim.openstreetmap.org/search` | User-Agent |
| NOAA Alerts | `https://api.weather.gov/alerts/active` | User-Agent |

### Key Sizes (tvOS)

| Element | Size |
|---------|------|
| Minimum touch target | 80×80 pt |
| Temperature hero font | 180 pt |
| Section header font | 48 pt |
| Body text font | 28-32 pt |
| Minimum text size | 22 pt |
| Card corner radius | 20 pt |
| Screen safe area padding | 80 pt |
| Focus scale effect | 1.05x |

### Color Tokens

| Token | Value |
|-------|-------|
| `textPrimary` | white |
| `textSecondary` | white @ 70% |
| `textTertiary` | white @ 50% |
| `glassSurface` | white @ 15% |
| `glassElevated` | white @ 25% |
| `glassBorder` | white @ 10% |
| `accent` | #007AFF |

---

## Appendix B: File Checklist

When building, create files in this order:

1. [ ] `AuroraWeatherTVApp.swift`
2. [ ] `DesignSystem/LiquidGlass.swift`
3. [ ] `DesignSystem/Typography.swift`
4. [ ] `DesignSystem/Colors.swift`
5. [ ] `Models/WeatherModels.swift`
6. [ ] `Models/LocationModels.swift`
7. [ ] `Models/AlertModels.swift`
8. [ ] `Services/WeatherService.swift`
9. [ ] `Services/GeocodingService.swift`
10. [ ] `App/AppState.swift`
11. [ ] `Views/Components/GlassCard.swift`
12. [ ] `Views/Components/AnimatedBackground.swift`
13. [ ] `Views/Weather/WeatherHeroView.swift`
14. [ ] `Views/Weather/HourlyTimelineView.swift`
15. [ ] `Views/Weather/DailyForecastView.swift`
16. [ ] `Views/Weather/WeatherDetailsGrid.swift`
17. [ ] `Views/Main/WeatherHomeView.swift`
18. [ ] `Views/Main/LocationsGridView.swift`
19. [ ] `Views/Main/SettingsView.swift`
20. [ ] `Views/Main/ContentView.swift`

---

*Document Version: 1.0*
*Created: January 2026*
*Target: tvOS 17.0+*
