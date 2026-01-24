(() => {
  const body = document.body;
  if (!body) return;

  const isAuthGroup =
    body.classList.contains("home-page") ||
    body.classList.contains("login-page") ||
    body.classList.contains("signup-page");
  const group = isAuthGroup ? "auth" : "main";

  const AUTH_SRC = "/music/Cassie_-_Long_Way_2_Go_Instrumental_Instrumental_(mp3.pm).mp3";
  const MAIN_SRC = "/music/1, 2 Step-Master Mix.mp3";
  const src = isAuthGroup ? AUTH_SRC : MAIN_SRC;

  const audio = document.createElement("audio");
  audio.id = "bg-audio";
  audio.src = encodeURI(src);
  audio.loop = true;
  audio.preload = "auto";

  const lastGroup = sessionStorage.getItem("lastAudioGroup");
  if (lastGroup !== group) {
    sessionStorage.removeItem(`audioTime:${group}`);
  }
  const savedTime = parseFloat(sessionStorage.getItem(`audioTime:${group}`) || "0");
  if (!Number.isNaN(savedTime) && savedTime > 0) {
    audio.currentTime = savedTime;
  }
  sessionStorage.setItem("lastAudioGroup", group);

  const storedMuted = sessionStorage.getItem("audioMuted");
  audio.muted = storedMuted === "true";

  document.body.appendChild(audio);

  const toggle = document.createElement("button");
  toggle.className = "audio-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Toggle music");
  toggle.textContent = audio.muted ? "🔇" : "🔊";
  document.body.appendChild(toggle);

  const tryPlay = () => {
    return audio.play().catch(() => false);
  };

  const showStartOverlay = () => {
    if (document.getElementById("audio-start-overlay")) return;
    const overlay = document.createElement("button");
    overlay.id = "audio-start-overlay";
    overlay.type = "button";
    overlay.textContent = "Tap to play music";
    overlay.addEventListener("click", async () => {
      audio.muted = false;
      sessionStorage.setItem("audioMuted", "false");
      toggle.textContent = "🔊";
      await tryPlay();
      overlay.remove();
    });
    document.body.appendChild(overlay);
  };

  tryPlay().then((ok) => {
    if (ok === false) {
      showStartOverlay();
    }
  });

  window.addEventListener("pageshow", () => {
    if (!audio.muted) {
      tryPlay().then((ok) => {
        if (ok === false) {
          showStartOverlay();
        }
      });
    }
  });

  toggle.addEventListener("click", () => {
    audio.muted = !audio.muted;
    sessionStorage.setItem("audioMuted", String(audio.muted));
    toggle.textContent = audio.muted ? "🔇" : "🔊";
    if (!audio.muted) {
      tryPlay();
    }
  });

  const saveTime = () => {
    sessionStorage.setItem(`audioTime:${group}`, String(audio.currentTime || 0));
  };
  window.addEventListener("beforeunload", saveTime);
  window.addEventListener("pagehide", saveTime);
})();
