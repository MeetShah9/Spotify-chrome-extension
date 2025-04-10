// popup.js - Spotify Lyrics Viewer
let userIsScrolling = false;
let scrollPauseTimeout = null;


document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get('spotify_token', function (result) {
    if (result.spotify_token) {
      showPlayerScreen();
      updateNowPlaying();
    } else {
      showAuthScreen();
    }
    const lyricsBox = document.querySelector('.lyrics-box');
    if (lyricsBox) {
      lyricsBox.addEventListener('scroll', () => {
        userIsScrolling = true;
        clearTimeout(scrollPauseTimeout);

        scrollPauseTimeout = setTimeout(() => {
          userIsScrolling = false;
        }, 3000); // pause auto-scroll for 3 seconds after user scrolls
      });
    }
  });

  document.getElementById('auth-button').addEventListener('click', function () {
    const authButton = document.getElementById('auth-button');
    authButton.textContent = "Connecting...";
    authButton.disabled = true;

    chrome.runtime.sendMessage({ action: "authenticate" }, function (response) {
      authButton.disabled = false;

      if (response && response.success) {
        showPlayerScreen();
        updateNowPlaying();
      } else {
        authButton.textContent = "Connect to Spotify";
        const errorMsg = response ? response.error : "Authentication failed";
        console.error("Authentication failed:", errorMsg);

        const authScreen = document.getElementById('auth-screen');
        let errorElement = document.getElementById('auth-error');

        if (!errorElement) {
          errorElement = document.createElement('p');
          errorElement.id = 'auth-error';
          errorElement.className = 'error-message';
          authScreen.appendChild(errorElement);
        }

        errorElement.textContent = "Authentication failed. Please try again.";
      }
    });
  });
  const reconnectButton = document.getElementById('reconnect-button');
  if (reconnectButton) {
    reconnectButton.addEventListener('click', function () {
      reconnectButton.textContent = "Reconnecting...";
      reconnectButton.disabled = true;

      chrome.runtime.sendMessage({ action: "authenticate" }, function (response) {
        reconnectButton.disabled = false;
        reconnectButton.textContent = "Reconnect to Spotify";

        if (response && response.success) {
          showPlayerScreen();
          updateNowPlaying();
        } else {
          const errorMsg = response ? response.error : "Re-authentication failed";
          console.error("Re-auth failed:", errorMsg);
          showErrorScreen("Re-authentication failed. Please try again.");
        }
      });
    });
}


  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      chrome.runtime.sendMessage({ action: "logout" }, function () {
        showAuthScreen();
      });
    });
  }
});

function updateNowPlaying() {
  chrome.runtime.sendMessage({ action: "getCurrentTrack" }, function (response) {
    if (response && response.success) {
      const data = response.data;

      // Always show player UI even if song is paused
      showPlayerScreen();

      document.getElementById('track-name').textContent = data.trackName;
      document.getElementById('artist-name').textContent = data.artistName;
      document.getElementById('album-art').src = data.albumImageUrl;

      // Update title based on playing/paused state
      const nowPlayingTitle = document.querySelector('.now-playing-title');
      nowPlayingTitle.textContent = data.isPlaying ? "Now Playing" : "Paused";

      // Auto-scroll based on progress
      autoScrollLyrics(data.progressMs, data.durationMs);

      // Fetch and display lyrics
      fetchLyrics(data.artistName, data.trackName, data.trackId);

      // Schedule next update
      setTimeout(updateNowPlaying, 1000);

    } else if (response && response.error && response.error.includes("token expired")) {
      // Token expired - show reconnect UI
      showAuthScreen();

      const authScreen = document.getElementById('auth-screen');
      let errorElement = document.getElementById('auth-error');

      if (!errorElement) {
        errorElement = document.createElement('p');
        errorElement.id = 'auth-error';
        errorElement.className = 'error-message';
        authScreen.appendChild(errorElement);
      }

      errorElement.textContent = "Session expired. Please reconnect.";

    } else {
      // For other errors (like no track playing), show error message only
      showErrorScreen("No track is currently playing");

      // 🔥 Hide reconnect button unless it's truly a token error
      const reconnectButton = document.getElementById('reconnect-button');
      if (reconnectButton) reconnectButton.style.display = 'none';
    }
  });
}


function fetchLyrics(artist, track, trackId) {
  const lyricsContainer = document.getElementById('lyrics-text');
  const cacheKey = `lyrics_${trackId}`;

  // Try to get from local cache
  chrome.storage.local.get([cacheKey], (result) => {
    if (result[cacheKey]) {
      console.log("✅ Loaded lyrics from cache");
      lyricsContainer.innerHTML = formatLyricsIntoSections(result[cacheKey]);
    } else {
      console.log("🔄 Fetching lyrics from Flask");

      lyricsContainer.textContent = "Loading...";

      chrome.runtime.sendMessage({
        action: "getLyrics",
        artist: artist,
        track: track
      }, function (response) {
        if (response && response.success) {
          const rawLyrics = response.lyrics;

          // 🧹 Clear previously cached lyrics
          chrome.storage.local.get(null, (items) => {
            for (let key in items) {
              if (key.startsWith("lyrics_") && key !== cacheKey) {
                chrome.storage.local.remove(key);
              }
            }

            // 💾 Store new lyrics after cleaning
            chrome.storage.local.set({ [cacheKey]: rawLyrics }, () => {
              console.log("📝 Cached new lyrics");
            });
          });

          // 🎤 Display formatted lyrics
          lyricsContainer.innerHTML = formatLyricsIntoSections(rawLyrics);
        } else {
          lyricsContainer.textContent = "Lyrics not found.";
        }
      });
    }
  });
}
function formatLyricsIntoSections(rawLyrics) {
  const match = rawLyrics.match(/lyrics/i);
  const lyrics = match ? rawLyrics.slice(match.index + match[0].length).trim() : rawLyrics.trim();

  const sections = lyrics.split(/\n\s*\n/);

  return sections.map((section, index) => {
    const safeText = section.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div class="lyric-section" data-section-index="${index}">${safeText}</div>`;
  }).join('');
}


function autoScrollLyrics(progressMs, durationMs) {
  if (userIsScrolling) return;

  const lyricsBox = document.querySelector('.lyrics-box');
  if (!lyricsBox) return;

  const scrollHeight = lyricsBox.scrollHeight - lyricsBox.clientHeight;

  const percent = progressMs / durationMs;

  const START_SCROLL_THRESHOLD = 0.05;  // ⏳ Don’t scroll until 8% into song
  const ADJUSTMENT_FACTOR = 1.15;

  if (percent < START_SCROLL_THRESHOLD) {
    // Stay at top early in the song
    lyricsBox.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    return;
  }

  // Once past threshold, scroll proportionally
  const adjustedPercent = (percent - START_SCROLL_THRESHOLD) / (1 - START_SCROLL_THRESHOLD);
  const targetScrollTop = scrollHeight * adjustedPercent * ADJUSTMENT_FACTOR;

  lyricsBox.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  });
}





function showPlayerScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'none';
  document.getElementById('player-screen').style.display = 'flex';
}

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('error-screen').style.display = 'none';
  document.getElementById('player-screen').style.display = 'none';
}

function showErrorScreen(errorMsg) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('player-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'flex';
  document.querySelector('#error-screen p').textContent = errorMsg || "Start playing a song on Spotify to see lyrics.";
}
