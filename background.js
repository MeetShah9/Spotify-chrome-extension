// Spotify API credentials
const SPOTIFY_CLIENT_ID = '';
const SPOTIFY_SCOPE = 'user-read-currently-playing user-read-playback-state user-read-playback-position' ;
const SPOTIFY_REDIRECT_URI = chrome.identity.getRedirectURL();
const GENIUS_TOKEN = '';


async function getCurrentTrack() {
  const token = await getSpotifyToken();

  console.log("Fetching current track with token:", token.substring(0, 5) + "...");

  const response = await fetch('https://api.spotify.com/v1/me/player', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    chrome.storage.local.remove(['spotify_token', 'token_timestamp']);
    throw new Error("Spotify token expired. Please re-authenticate.");
  }

  if (response.status === 204) {
    throw new Error("No song is currently playing");
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.is_playing || !data.item) {
    throw new Error("No song is currently playing");
  }

  const track = data.item;

  const trackData = {
    trackId: track.id,
    trackName: track.name,
    artistName: track.artists.map(a => a.name).join(", "),
    albumName: track.album.name,
    albumImageUrl: track.album.images[0].url,
    progressMs: data.progress_ms,
    durationMs: track.duration_ms,
    isPlaying: data.is_playing
  };

  console.log("✅ Sending to popup:", trackData);
  return trackData;
}


// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticate") {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPE)}&show_dialog=true`;

    console.log("Launching auth flow with URL:", authUrl);

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error("Auth Error:", chrome.runtime.lastError?.message || chrome.runtime.lastError);
          sendResponse({ success: false, error: "Auth Error: Could not load authorization page." });
          return;
        }

        console.log("Redirect URL returned:", redirectUrl);

        const tokenMatch = redirectUrl.match(/[#&]access_token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const accessToken = tokenMatch[1];
          chrome.storage.local.set({ spotify_token: accessToken, token_timestamp: Date.now() }, () => {
            console.log("Access token saved.");
            sendResponse({ success: true });
          });
        } else {
          console.error("Access token not found in redirect URL");
          sendResponse({ success: false, error: "Access token not found in redirect URL." });
        }
      }
    );

    return true; // Required to keep sendResponse active
  }

  if (request.action === "getCurrentTrack") {
    getCurrentTrack()
      .then(trackData => sendResponse({ success: true, data: trackData }))
      .catch(error => {
        console.error("Track error:", error);
        sendResponse({ success: false, error: error.toString() });
      });
    return true;
  }

  if (request.action === "getLyrics") {
    getLyricsFromFlask(request.artist, request.track)
      .then(lyrics => sendResponse({ success: true, lyrics }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }

  if (request.action === "logout") {
    chrome.storage.local.remove(['spotify_token', 'token_timestamp'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});


// Fetch lyrics from your Flask server
async function getLyricsFromFlask(artist, track) {
  const url = `https://chrome-extension-production-71f9.up.railway.app/get_lyrics?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;


  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.lyrics || "Lyrics not found.";
  } catch (err) {
    console.error("Failed to fetch lyrics from Flask:", err);
    return "Could not retrieve lyrics.";
  }
}

// Retrieve token from storage
async function getSpotifyToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['spotify_token', 'token_timestamp'], (result) => {
      if (result.spotify_token) {
        const now = Date.now();
        const tokenAge = now - (result.token_timestamp || 0);

        if (tokenAge > 3300000) { // 55 minutes
          reject(new Error("Token likely expired. Please re-authenticate."));
        } else {
          resolve(result.spotify_token);
        }
      } else {
        reject(new Error("No Spotify token found. Please authenticate first."));
      }
    });
  });
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLyricsAndUpdate") {
    getCurrentTrack().then(track => {
      updateLyricsDisplay(track.artistName, track.trackName, track.progress_ms, track.duration_ms);
      sendResponse({ success: true });
    }).catch(err => {
      console.error("Failed to update lyrics:", err);
      sendResponse({ success: false });
    });
    return true;
  }
});


