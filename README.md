# 🐟 FisherMart — Mobile Application for Fishery Inventory & Marketplace

**FisherMart** is a modern, offline-first mobile application built for artisanal fishers, traders, and seafood market managers. It provides seamless inventory tracking, marketplace operations, sales analytics, and dynamic cloud synchronization.

---

## 🛠️ Tech Stack & Technologies Used

FisherMart is built using a modern mobile development stack tailored for high performance, offline usability, and real-time cloud sync:

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | [React Native](https://reactnative.dev/) (v0.86) | Cross-platform native mobile application framework |
| **Tooling & Platform** | [Expo SDK](https://expo.dev/) (v57) | Application environment, build pipeline & native modules |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript for robust code maintenance |
| **Local Database** | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Embedded SQLite engine for offline-first data persistence |
| **Cloud Backend & Database** | [Supabase](https://supabase.com/) (`@supabase/supabase-js`) | PostgreSQL cloud database, authentication, and sync backend |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) (v5) | Lightweight, predictable state management |
| **Navigation** | [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs) | Smooth screen transitions and tab navigation |
| **UI Components & Styling** | [React Native Paper](https://reactnativepaper.com/) & `expo-linear-gradient` | Material Design UI framework & customizable gradient themes |
| **Icons & Typography** | Expo Vector Icons & Outfit Font (`@expo-google-fonts/outfit`) | Clean visual assets and custom branding fonts |
| **Data Visualization** | `react-native-chart-kit` & `react-native-svg` | Sales analytics graphs and visual reports |
| **Local Storage** | `@react-native-async-storage/async-storage` | Key-value storage for app settings & session tokens |

---

## 📱 Key Features

- **Offline-First Architecture**: Perform full inventory management, log catches, and create sales orders without an active internet connection using local SQLite.
- **Background Cloud Synchronization**: Automatically sync local records with Supabase cloud PostgreSQL backend when internet connection becomes available.
- **Inventory Management**: Track fish species, catch date, quantity (kg), unit pricing, and stock status in real-time.
- **Digital Marketplace**: List fish products for buyers with details on location, pricing, and fisher profile.
- **Order & Sales Tracking**: Log sales, track pending/completed orders, and maintain transactional histories.
- **Analytics Dashboard**: Visual breakdown of total revenue, catch trends, and category distribution with interactive charts.
- **User Profiles & Role Configuration**: Manage fisher profile details, fishing zones, village location, and boat numbers.

---

## 📁 Project Structure

```text
FisherMart/
├── src/
│   ├── components/      # Reusable UI components (ProductCard, SyncStatusBadge, etc.)
│   ├── database/        # Local SQLite database schemas, migrations, and queries
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # React Navigation tab & stack navigators
│   ├── screens/         # App screens (Auth, Dashboard, Inventory, Marketplace, Orders, Analytics)
│   ├── services/        # Supabase API integration, auth, and offline sync service
│   ├── store/           # Zustand state management stores
│   ├── theme/           # Color palettes, typography, and theme definitions
│   └── utils/           # Helper functions and formatted utilities
├── assets/              # App images, icons, and splash screens
├── android/             # Native Android build project files
├── app.json             # Expo project configuration
├── SUPABASE_SETUP.md    # Guide for setting up Supabase backend tables & RLS policies
└── package.json         # Project dependencies and script definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo Go** app on your iOS/Android device OR **Android Studio** for Android Emulator

### Installation

1. **Clone the repository**:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd FisherMart
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm start
   ```

5. **Run on Android / iOS**:
   - Press `a` in the terminal for Android Emulator.
   - Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
