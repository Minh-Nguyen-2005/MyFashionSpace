// Author: Minh Nguyen
// Backend

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
  const renderToggle = () => {
    toggle.innerHTML = audio.muted
      ? '<img src="/pictures/shhhh.gif" alt="Muted">'
      : '<img src="/pictures/music.gif" alt="Playing">';
  };
  renderToggle();
  document.body.appendChild(toggle);

  if (!document.querySelector(".site-credit")) {
    const credit = document.createElement("div");
    credit.className = "yours-truly-credit site-credit";
    credit.textContent = "Minh Tai Nguyen © 2026";
    document.body.appendChild(credit);
  }

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
      renderToggle();
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
    const stored = sessionStorage.getItem("audioMuted");
    audio.muted = stored === "true";
    renderToggle();
    if (!audio.muted) {
      const latestTime = parseFloat(sessionStorage.getItem(`audioTime:${group}`) || "0");
      if (!Number.isNaN(latestTime) && latestTime > 0) {
        audio.currentTime = latestTime;
      }
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
    renderToggle();
    if (!audio.muted) {
      tryPlay();
    }
  });

  const saveTime = () => {
    sessionStorage.setItem(`audioTime:${group}`, String(audio.currentTime || 0));
  };
  audio.addEventListener("timeupdate", saveTime);
  window.addEventListener("beforeunload", saveTime);
  window.addEventListener("pagehide", saveTime);
})();
