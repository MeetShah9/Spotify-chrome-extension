# 🎧 Spotify Lyrics Viewer Chrome Extension

A sleek Chrome extension that displays **synchronized lyrics** for your currently playing **Spotify** tracks. Connect your account and enjoy real-time lyric scrolling with a modern UI inspired by Spotify.

---

## 🚀 Features

- 🔐 **Secure OAuth authentication** with Spotify  
- 🎵 **Real-time playback tracking** of the currently playing song  
- 📝 **Automatic lyrics fetching** via the Genius API  
- 🔄 **Smooth auto-scrolling lyrics** synced with song progress  
- 💾 **Lyrics caching** to minimize network requests  


---

## 📸 Screenshots

| Auth Screen | Player Screen |
|-------------|---------------|
| ![Auth Screen](https://github.com/user-attachments/assets/d3ae789f-2089-42a5-b1b2-ceba4b1e9c81) | ![Player Screen](https://github.com/user-attachments/assets/da2f94b8-9851-4389-8f2e-089322c93e89) |

---

## 🧠 How It Works

The extension connects with the **Spotify Web API** to fetch details of your currently playing track. Then, it retrieves and formats the lyrics via a **custom Flask API server**, enabling smooth, progress-based auto-scrolling.

---

## ☁️ Hosting the Flask Lyrics API with Railway

To connect my Chrome extension to a backend for fetching and formatting lyrics, I built a custom Flask server and deployed it using **Railway**.

### 🎯 Why Railway?

I wanted a lightweight way to host a simple Python API without dealing with traditional server setup or deployment pipelines. Railway provides:
It was perfect for quickly deploying my Flask server and getting a public URL that my extension could use.

---

### 🧩 What My Flask Server Does

The server receives track metadata (title and artist) from the extension. Then:

1. It uses the **Genius API** to search for the song's lyrics.
2. Parses and cleans up the lyrics (removes metadata, sections like `[Chorus]`, etc.)
3. Divides them into scrollable sections (inspired by how karaoke/teleprompters work).
4. Sends the structured lyrics back as JSON.

This separation between backend and frontend lets me keep the lyrics logic centralized and reuse it across both the Flask web app and the Chrome extension.

---

## 🔍 Flask API Response 

When the Chrome extension sends a request to the Flask API with the song title and artist, it gets back a **cleaned, formatted JSON object** containing the lyrics.

Here’s what that response looks like:

> Example request :https://my-lyrics-api.up.railway.app/lyrics?title=Videotape&artist=Radiohead
![JSON Response](https://github.com/user-attachments/assets/f7af1711-d80c-4c89-b1c4-7d86e2c3b416)

## 🧼 Cleaning the Lyrics

Before returning the lyrics to the extension, the Flask server performs the following cleaning steps:

1. **Removes Contributor Metadata**  
   Strips away any unnecessary contributor information, translation links, and ads.

2. **Strips Section Tags**  
   Removes section markers like `[Chorus]`, `[Verse 1]`, etc., to focus solely on the lyrics.

3. **Replaces Smart Quotes and Weird Unicode**  
   Converts smart quotes and other non-standard Unicode characters into clean, readable formatting.

4. **Ensures Text is Newline-Separated**  
   Ensures that the lyrics are formatted with newline characters for easier processing on the frontend, making it simpler to display and scroll lyrics dynamically.
>Cleaned JSON
>
>![Cleaned JSON](https://github.com/user-attachments/assets/8a26fbed-22fa-4be4-94b6-579608d16a72)





