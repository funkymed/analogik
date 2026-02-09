import { useState, useEffect } from "react";
import App from "./App";
import ActivateAudio from "./ActivateAudio";

const isElectron = !!(window.electronAPI);
const isTauri = !!(window.__TAURI__);
const isDesktop = isElectron || isTauri;

function AppAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const [audioLock, setAudioLock] = useState(!isDesktop);
  const [context, setContext] = useState(isDesktop ? ctx : false);

  const updatedContext = () => {
    setContext(ctx);
    setAudioLock(false);
  };

  // Auto-unlock audio in desktop apps (no user gesture required)
  useEffect(() => {
    if (isDesktop) {
      ctx.resume();
    }
  }, []);

  const unlockAudio = () => {
    ctx.createGain();
    ctx.resume();
    if (ctx.state === "running") {
      updatedContext();
    } else {
      ctx.onstatechange = () => {
        updatedContext();
      };
    }
  };

  return audioLock ? (
    <ActivateAudio unlockAudio={unlockAudio} />
  ) : (
    <App context={context} />
  );
}

export default AppAudio;
