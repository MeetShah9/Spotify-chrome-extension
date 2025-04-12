# 🎧 Spotify Lyrics Viewer Chrome Extension

A sleek Chrome extension that displays **synchronized lyrics** for your currently playing **Spotify** tracks. Connect your account and enjoy real-time lyric scrolling with a modern UI inspired by Spotify.

---

## 🚀 Features

- 🔐 **Secure OAuth authentication** with Spotify  
- 🎵 **Real-time playback tracking** of the currently playing song  
- 📝 **Automatic lyrics fetching** via the Genius API  
- 🔄 **Smooth auto-scrolling lyrics** synced with song progress  
- 💾 **Lyrics caching** to minimize network requests  
- 🎨 **Spotify-themed design** using dominant album colors  

---

## 📸 Screenshots

| Auth Screen | Player Screen |
|-------------|---------------|
| ![Auth Screen](screenshots/auth-screen.png) | ![Player Screen](screenshots/player-screen.png) |

---

## 🧠 How It Works

The extension connects with the **Spotify Web API** to fetch details of your currently playing track. Then, it retrieves and formats the lyrics via a **custom Flask API server**, enabling smooth, progress-based auto-scrolling.

---

## 🧱 Architecture Overview

### 1. Background Service Worker

- Handles **OAuth authentication**
- Makes secure requests to the Spotify API

### 2. Popup UI

- Displays track name, artist, and album art
- Fetches and renders synced lyrics
- UI dynamically changes color based on album art using **Color Thief**

### 3. Flask API Server

- Accepts a track name and artist
- Queries **Genius API** for lyrics
- Cleans, formats, and serves them in structured sections

---

## 📦 Installation

### 🖥️ Chrome Extension Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/spotify-lyrics-viewer.git
