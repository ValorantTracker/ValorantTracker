# Valorant Match Tracker

<div align="center">

![Valorant Tracker Icon](assets/icon.png)

**A sleek, real-time Valorant match tracker with agent auto-lock and player statistics**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://github.com/ValorantTracker/valorant-tracker)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F.svg)](https://www.electronjs.org/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Building](#-building) • [Contributing](#-contributing)

</div>

---

## ⚡ Features

### 🎯 Core Features
- **Real-time Match Tracking** - Automatically detects and displays match information during agent select and in-game
- **Agent Auto-Lock** - Select your favorite agent and auto-lock it when matches start
- **Player Statistics** - View rank, level, and competitive tier for all players in your match
- **Match History** - Track all your recent matches with timestamps and map information
- **Dynamic Window Sizing** - Window automatically adjusts based on player count for optimal viewing

### ✨ Enhanced Features
- **Quick Copy Names** - Click any player name to instantly copy it to clipboard
- **Agent Favorites ⭐** - Star your main agents to show them at the top of the selection modal
- **Performance Mode ⚡** - Toggle to disable animations for better performance on lower-end systems
- **Loading Indicators** - Visual feedback when fetching data - no more blank screens
- **Beautiful UI** - Valorant-themed interface with smooth animations and responsive design
- **System Tray Integration** - Minimize to tray and keep tracking in the background

### 🎨 Interface
- **Immersive Map Backgrounds** - Full-screen map splash images with blur effects
- **Grid Agent Selection** - Beautiful modal with agent portraits and favorite system
- **Clean Match View** - Auto-hides controls during matches for a distraction-free experience
- **Dark Theme** - Sleek dark interface matching Valorant's aesthetic with signature red and blue accents

---

## 📋 Requirements

- **Windows 10/11** (64-bit)
- **Valorant** must be installed and running
- **Node.js 16+** (for development only)
- **Python 3.8+** (for development only)

---

## 🚀 Installation

### Option 1: Download Pre-built Release (Recommended)

1. Go to [Releases](https://github.com/ValorantTracker/valorant-tracker/releases/latest)
2. Download the latest version:
   - **`Valorant-Tracker-Setup-x.x.x.exe`** - Full installer with desktop shortcut
   - **`Valorant-Tracker-x.x.x.exe`** - Portable version (no installation required)
3. Run the installer or portable executable
4. Launch Valorant Match Tracker

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/ValorantTracker/valorant-tracker.git
cd valorant-tracker

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Run the app
npm start
```

---

## 🎮 Usage

### Getting Started

1. **Launch Valorant** - Make sure Valorant is running and you're logged in
2. **Open the Tracker** - Launch Valorant Match Tracker
3. **Select Region** - Choose your region from the dropdown (NA, EU, AP, KR, LATAM, BR)
4. **Connect** - Click "Connect" button
5. **Queue for a Match** - Join any Valorant queue to see match data

### Setting Up Auto-Lock

1. Open **Controls** panel at the bottom (⚙ CONTROLS button)
2. Click **"Select Agent..."** button
3. **Star your favorites** (click ★ on agent cards) - they'll appear at the top
4. **Select an agent** by clicking on their card
5. Click **"Enable"** to activate auto-lock

> ⚠️ **Warning**: Auto-lock interacts with Valorant's client and may be detected by Vanguard. Use at your own risk!

### Features Guide

**Quick Copy Names**
- Click any player's name in the match view to copy it to clipboard
- Perfect for reporting, adding friends, or taking notes

**Agent Favorites**
- Star agents in the selection modal (☆ → ★)
- Favorited agents show at the top with a golden glow
- Persists across sessions

**Performance Mode**
- Toggle in Controls > Performance Mode
- Disables all animations for smoother performance
- Recommended for lower-end systems or laptops

**Match View**
- Automatically appears when you enter agent select or a game
- Shows all players with their agent, rank, and level
- Control panel auto-hides during matches for a clean view
- Window resizes dynamically based on player count

---

## 🛠️ Building

### Install Build Tools

```bash
npm install electron-builder --save-dev
```

### Build Commands

```bash
# Build Windows installer + portable
npm run build:win

# Build for all platforms
npm run build
```

### Output

Built files will be in the `dist/` folder:
- **`Valorant Tracker Setup x.x.x.exe`** - NSIS installer (recommended)
- **`Valorant Tracker x.x.x.exe`** - Portable executable

---

## 📦 Project Structure

```
valorant-tracker/
├── assets/              # Icons and images
│   ├── icon.png        # App icon (256x256)
│   ├── icon.ico        # Windows executable icon
│   └── icon-*.png      # Various icon sizes
├── backend/             # Python Flask backend
│   ├── server.py       # API server for Valorant client
│   └── requirements.txt
├── main.js             # Electron main process
├── renderer.js         # Frontend logic
├── index.html          # UI structure
├── styles.css          # Styling
├── package.json        # Dependencies and build config
└── .gitignore          # Git ignore rules
```

---

## 🔧 Technologies

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[Python Flask](https://flask.palletsprojects.com/)** - Lightweight backend API
- **[valclient.py](https://github.com/colinhartigan/valclient.py)** - Valorant client interaction
- **[Axios](https://axios-http.com/)** - HTTP client for API requests
- **[Valorant API](https://valorant-api.com/)** - Agent and map assets

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Mode

```bash
# Run with DevTools for debugging
npm run dev

# Run backend separately for testing
cd backend
python server.py
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This project is **not affiliated with, endorsed by, or officially connected to Riot Games**. Valorant and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

**USE AT YOUR OWN RISK.** The auto-lock feature interacts with the Valorant client and may be detected by Riot's anti-cheat system (Vanguard). This could potentially result in account penalties. The developers are not responsible for any consequences.

This tool uses Valorant's unofficial client API, which may change without notice. Always respect Riot Games' Terms of Service.

---

## 🙏 Acknowledgments

- **[valclient.py](https://github.com/colinhartigan/valclient.py)** by colinhartigan - Valorant client wrapper
- **[Valorant API](https://valorant-api.com/)** - Agent, map, and rank data
- **[VAL API Docs](https://valapidocs.techchrism.me/)** by techchrism - Client API documentation
- The Valorant community for feedback and support

---

## 📞 Support & Issues

- **Bug Reports**: [GitHub Issues](https://github.com/ValorantTracker/valorant-tracker/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/ValorantTracker/valorant-tracker/discussions)
- **Troubleshooting**: Check the [Wiki](https://github.com/ValorantTracker/valorant-tracker/wiki)

---

<div align="center">

**Made with ❤️ for the Valorant community**

**Star ⭐ this repo if you found it helpful!**

[Report Bug](https://github.com/ValorantTracker/valorant-tracker/issues) • [Request Feature](https://github.com/ValorantTracker/valorant-tracker/issues) • [View Releases](https://github.com/ValorantTracker/valorant-tracker/releases)

</div>
