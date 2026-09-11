# 🏎️ TURBO RACER 3D - Online Multiplayer Car Racing Game

A real-time 3D online multiplayer car racing game built with **Three.js, WebGL, Node.js, and Socket.io**, designed for both PC and Mobile (Android App / Web).

---

## 🎮 Game Features

- **3D Graphics & Sound:** Neon Grand Prix Circuit, asphalt textures, stadium floodlights, dynamic headlights/taillights, exhaust flames, nitro boost, and synthesized engine sounds.
- **Online Multiplayer:** Room-based matchmaking (`Create Room`, `Join Room`, `Quick Play`) with 4-letter room codes.
- **Real-Time Synchronization:** Smooth interpolation (30 FPS network tick) of car positions, rotation, drift angle, nitro flames, checkpoints, and lap counters.
- **Dual Controls:**
  - **PC:** `W`/`Up` (Gas), `S`/`Down` (Brake/Reverse), `A`/`Left` & `D`/`Right` (Steer), `Shift` (Nitro), `Space` (Drift), `C` (Change Cam).
  - **Mobile:** On-screen touch buttons for Steering, Gas, Brake, and Nitro.
- **In-Game HUD:** Digital Speedometer, Nitro gauge, 2D Minimap radar, Live Leaderboard ranking, 3-2-1-GO countdown, and Podium celebration screen.

---

## 🚀 How to Run the Game

### 1. Install Dependencies
Open your terminal / command prompt in this folder and run:
```bash
npm install
```

### 2. Start the Game Server
```bash
npm start
```

### 3. Open in Browser
- **On your PC:** Open [http://localhost:3000](http://localhost:3000)
- **Multiplayer Testing on Same PC:** Open [http://localhost:3000](http://localhost:3000) in two different browser windows or incognito tab!
  - Window 1: Click **"CREATE ROOM"** and copy the 4-letter code.
  - Window 2: Enter the 4-letter code and click **"JOIN"**.
  - Host clicks **"START RACE 🏁"** to start the countdown!

### 4. Play with Friends on Mobile (HOTSPOT / OFFLINE WI-FI - 0 INTERNET!)
**इंटरनेट की कोई ज़रूरत नहीं है!**
1. **Phone 1 (Host):** अपने मोबाइल का **Personal Hotspot** ऑन करें।
2. **Phone 2, 3, 4 (Friends):** Phone 1 के Hotspot Wi-Fi से कनेक्ट करें।
3. **Phone 1:** गेम में **"HOTSPOT / OFFLINE WI-FI"** टैब चुनकर **"HOST HOTSPOT GAME"** पर क्लिक करें।
4. **Friends:** गेम में **"JOIN HOST"** पर क्लिक करें (यह ऑटोमैटिक `192.168.43.1` हॉटस्पॉट गेटवे से कनेक्ट कर देगा)।
5. रेस शुरू हो जाएगी! 🏎️💨

---

## 📱 How to Build Android APK (Mobile App)

आप 1-क्लिक में Android APK बना सकते हैं:

1. **Option A (Automated Script):**
   `build_apk.bat` पर डबल क्लिक करें।

2. **Option B (Manual Commands):**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npx cap sync
   npx cap open android
   ```
3. **Android Studio** में:
   - ऊपर मेनू में जाएं: **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**
   - कुछ ही सेकंड में आपकी `.apk` फ़ाइल बनकर तैयार हो जाएगी जिसे आप किसी भी Android फ़ोन में इनस्टॉल कर सकते हैं!
