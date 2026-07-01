# Tara Mobile App

> AI-powered Astral/Vedic Life Guide — React Native / Expo

---

## What is Tara?

Tara is not a horoscope app. It is an AI-powered Astral/Vedic Life Guide that helps users understand their daily energy, emotional state, relationships, career, wellness, and life direction — using Western astrology (Astral) and Indian astrology (Vedic) as a lens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.4 |
| Platform | Expo SDK 54 |
| Language | TypeScript |
| React | 19.1.0 |
| Navigation | React Navigation v7 (Stack only) |
| Auth | Firebase REST API (Identity Toolkit) |
| Storage | AsyncStorage |
| HTTP | Axios with interceptors |
| SVG | react-native-svg |

---

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android Emulator
- Or the Expo Go app on a physical device
- Backend running at `http://10.0.0.10:8080/api`

---

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd tara-mobile
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the app

```bash
npx expo start --clear
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Project Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx          # Stack navigator — auth flow controller
├── screens/
│   ├── SplashScreen.tsx          # Launch screen — chakra animation
│   ├── LoginScreen.tsx           # Firebase email/password login
│   ├── SignupScreen.tsx          # New account creation via Firebase
│   ├── OnboardingScreen.tsx      # 5-step onboarding flow
│   ├── MainScreen.tsx            # Persistent nav bar + tab switcher
│   ├── HomeScreen.tsx            # Main home — editorial bold design
│   ├── ChartScreen.tsx           # Birth chart — Astral/Vedic toggle
│   ├── AskTaraScreen.tsx         # AI chat interface
│   ├── JournalScreen.tsx         # Journal entries + Tara prompts
│   ├── ProfileScreen.tsx         # User profile + settings
│   └── EditBirthDetailsScreen.tsx # Edit birth details modal
├── components/
│   ├── EmotionalTab.tsx          # Headspace-style exercises
│   ├── GuidedWriting.tsx         # 3-step guided writing + AI response
│   ├── PremiumModal.tsx          # Paywall bottom sheet
│   ├── MorningCheckInModal.tsx   # Daily check-in flow
│   ├── WeeklyMoodChart.tsx       # Weekly mood visualisation
│   ├── AstroInsights.tsx         # Astrology insight cards
│   ├── SleepTracker.tsx          # Sleep quality tracker
│   ├── StreakTracker.tsx         # Journaling/check-in streak
│   ├── LunarCycleTracker.tsx     # Current lunar phase
│   └── BodyTensionModal.tsx      # Body tension exercise
├── services/
│   └── api.ts                    # All API calls + Firebase auth interceptors
├── constants/
│   └── index.ts                  # COLORS, MOODS, and other shared constants
└── utils/
    └── seedTestData.ts           # Dev utility to seed test data
```

---

## Navigation Architecture

> This is critical — misunderstanding this causes duplicate nav bars and broken routing.

The app uses a **Stack navigator only** — there is no `createBottomTabNavigator` anywhere in the codebase.

```
AppNavigator (Stack)
├── SplashScreen         — checks AsyncStorage token on load
├── LoginScreen          — email/password via Firebase
├── SignupScreen         — new account via Firebase signUp API
├── OnboardingScreen     — 5-step birth details + preferences
└── MainScreen           — all 5 tabs live here as state, not as Stack screens
    ├── HomeScreen        (activeTab === 'Home')
    ├── ChartScreen       (activeTab === 'Chart')
    ├── AskTaraScreen     (activeTab === 'Ask Tara')
    ├── JournalScreen     (activeTab === 'Journal')
    └── ProfileScreen     (activeTab === 'Profile')
```

`MainScreen` owns a single `activeTab` state and renders the correct screen alongside a persistent bottom nav bar. Screens do not receive a `navigation` prop — they receive `setActiveTab` from `MainScreen` to switch tabs, and `onLogout` where needed.

### Auth Flow

```
App opens
    ↓
SplashScreen (animation)
    ↓
checkAuth() reads AsyncStorage
    ↓
No token         → LoginScreen / SignupScreen
Token, no profile → OnboardingScreen
Token + profile  → MainScreen
```

---

## Theme — Warm Editorial

All screens share a consistent warm cream design system.

| Token | Value | Usage |
|---|---|---|
| `CREAM` | `#F2EFE8` | Background |
| `DARK_CREAM` | `#E8E3D8` | Cards, dividers, inactive chips |
| `ORANGE` | `#F5A623` | Primary accent, active states, CTA buttons |
| `DARK` | `#1F2937` | Text, dark buttons |
| `SAFFRON` | `#C1560A` | Vedic mode accent |
| `SAFFRON_BG` | `#FFFAF4` | Vedic mode background |

**Typography:** 900 weight for headlines, 300 weight for subtitles, 500 for body.

**Vedic mode** keeps its own distinct saffron palette and Om watermark — never override these with the default orange theme.

---

## API Service

All API calls live in `src/services/api.ts`. An Axios instance handles auth automatically via request/response interceptors.

### Request interceptor
Reads the Firebase `idToken` from `AsyncStorage` and injects it as `Authorization: Bearer <token>` on every request.

### Response interceptor
On a `401` response, automatically calls Firebase's token refresh endpoint using the stored `refreshToken`, saves the new tokens, and retries the original request once. This means the app handles Firebase's 1-hour token expiry silently without requiring the user to log out.

### Available API modules

```typescript
authAPI.login(email, password)             // Firebase signInWithPassword
authAPI.signUp(email, password)            // Firebase signUp (in SignupScreen)

userAPI.getUser()                          // GET /user — auto-registers on first call
userAPI.updateUser(data)                   // PATCH /user

profileAPI.createBirthProfile(data)        // POST /profile/birth
profileAPI.getBirthProfile()               // GET /profile/birth
profileAPI.updateBirthProfile(data)        // PUT /profile/birth — regenerates charts

chartAPI.getWesternChart()                 // GET /charts/western
chartAPI.getVedicChart()                   // GET /charts/vedic

planetAPI.getTodayPlanets()                // GET /planets/today

moodAPI.saveMood(data)                     // POST /mood
moodAPI.getLatestMood()                    // GET /mood/latest

homeAPI.getHome()                          // GET /home

taraAPI.chat(data)                         // POST /taraAi/chat
                                           // ⚠️ field must be "question" not "message"

journalAPI.getEntries()                    // GET /journal
journalAPI.createEntry(data)               // POST /journal
```

---

## Screen Reference

### SplashScreen
Warm cream background with Anahata Heart Chakra SVG animation. Features:
- Spring-bounce entrance scale
- Continuous slow mandala rotation (30s per revolution)
- Orbiting orange particle around the outer ring
- Letter-by-letter "Tara" wordmark reveal
- Soft radial orange glow behind the mandala
- Smooth fade+scale exit transition

### LoginScreen
Firebase email/password login. Saves both `idToken` and `refreshToken` to AsyncStorage on success. Includes "Don't have an account? Sign up" link.

### SignupScreen
Creates a Firebase account via `accounts:signUp` API. On success, calls `GET /user` to trigger backend auto-registration, then routes to Onboarding.

### OnboardingScreen
5-step flow with orange progress bar and fade transitions between steps:
1. Birth details (name, DOB, time, place)
2. Astrology preference (Astral / Vedic / Both)
3. What are you looking for? (multi-select intentions)
4. How are you feeling lately? (single select)
5. Frequency preference + profile summary card

All answers saved to AsyncStorage: `token`, `refreshToken`, `hasProfile`, `preference`, `intentions`, `feeling`, `frequency`.

### HomeScreen
Editorial bold design. Key features:
- Astral/Vedic toggle — functional, switches between `☀ Sun · ☽ Moon · ↑ Rising` and `🌙 Rashi · ⭐ Nakshatra · ↑ Lagna · ☊ Rahu/Ketu`
- City name turns saffron when Vedic mode is active
- Astro pills are tappable — navigate to ChartScreen
- Cosmic score (real or check-in prompt)
- Today/Career/Love/Health/Emotional tabs with orange underline
- Blueprint cards — Core identity free, others locked behind PremiumModal
- Mood chip selection with Tara response card
- "See full support" button for Low/Anxious/Confused moods → Emotional tab
- Ask Tara quick question cards → AskTaraScreen
- Pulls real birth location from `/profile/birth` — not hardcoded

### ChartScreen
Astral/Vedic toggle. Astral shows Big 3 tiles + expandable story cards. Vedic keeps full saffron theme + Om watermark. Cards expand/collapse on tap.

### AskTaraScreen
Chat interface. Sends `{ question: "..." }` (not `message`) to `POST /taraAi/chat`. Displays `shortAnswer`, `whyTaraSays`, `practicalStep` as the response. Includes suggested quick questions.

### JournalScreen
Streak stats, Tara's daily prompt card, past entries list with mood badges, new entry modal.

### ProfileScreen
Displays real birth details from `/profile/birth` (fetched separately from `/user`). Features:
- Edit button next to "BIRTH DETAILS" → opens EditBirthDetailsScreen modal
- Subscription row is tappable → opens PremiumModal
- Logout clears `token`, `refreshToken`, `hasProfile`, `preference`, `userName` from AsyncStorage and calls `onLogout()` callback which resets AppNavigator state to `'auth'`

### EditBirthDetailsScreen
Pre-filled form with current birth details. Save button is disabled until a change is made. Shows confirmation alert about chart regeneration before submitting. Calls `PUT /profile/birth` and refreshes ProfileScreen on success.

---

## Onboarding → Main App Flow

```
OnboardingScreen (step 5 — "Generate my chart")
    ↓
POST /profile/birth    — creates birth profile, triggers chart generation
AsyncStorage.setItem('hasProfile', 'true')
    ↓
onComplete() callback
    ↓
AppNavigator.checkAuth() re-runs
    ↓
MainScreen (Home tab)
```

---

## EmotionalTab — Exercise Types

Exercises have a `type` field that determines which modal opens:

| Type | Behaviour |
|---|---|
| `breathing` | Animated breathing circle with 4-phase cycle (expand/hold/shrink/hold). Step cycling uses modulo — not `Math.min` — to avoid getting stuck on the last step. |
| `timer` | Step-by-step instructions with a countdown timer. |
| `prompts` | Opens `GuidedWriting` component — 3 writing prompts followed by a Claude AI reflection. |

### GuidedWriting Flow
1. 3 prompts based on the exercise's mood type (write / gratitude / anxious / low / confused)
2. User types a free-form answer for each prompt
3. All 3 answers sent to Claude API (`claude-haiku-4-5-20251001`) directly from the client
4. Tara returns a personalised reflection + suggested next exercise
5. User can save the entry to their journal

---

## Premium / Monetization

`PremiumModal` is a bottom-sheet paywall triggered by:
- Tapping locked blueprint cards on HomeScreen
- Tapping the Subscription row on ProfileScreen

Plans: Monthly ₹499 / Yearly ₹3,999 (Best value) / Lifetime ₹9,999. Includes a 7-day free trial badge. Actual purchase integration is not yet implemented.

---

## Known Issues & Pending Work

### Pending features
- [ ] Real cosmic score calculation (currently shows check-in prompt or hardcoded value)
- [ ] Morning check-in modal (once per day on app open)
- [ ] Sync onboarding intentions/feeling/frequency to backend `user_preferences` table (currently AsyncStorage only)
- [ ] Exercise completion screen with streak celebration
- [ ] Weekly progress view
- [ ] Vedic North Indian chart grid
- [ ] Location autocomplete in onboarding
- [ ] Actual subscription purchase integration

### Known bugs
- Vedic chart data (`rashi`, `nakshatra`, `lagna`) on HomeScreen pulls from `homeData?.vedicData` — verify this field exists in the `/home` API response; may need a separate `/charts/vedic` fetch

---

## Environment

The backend URL is hardcoded in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://10.0.0.10:8080/api';
```

Update this for staging or production. The Firebase API key is also in `api.ts`:

```typescript
const FIREBASE_API_KEY = 'AIzaSyBjgzE1qZzv7EAd1HJOKTw-04uMkFC75_Y';
```

---

## Test Account

| Field | Value |
|---|---|
| Email | test@test.com |
| Password | Test1234! |

> Note: This account uses a different Firebase UID than `sasankreddy7@gmail.com`. The `sasankreddy7@gmail.com` account has real birth profile data (Sasank Reddy Mukku, 1998-11-02, Kanigiri) and should be used for full end-to-end testing.

---

## License

Private — Tara is a proprietary product. All rights reserved.
