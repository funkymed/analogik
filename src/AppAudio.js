import { useState, useEffect } from "react";
import App from "./App";
import ActivateAudio from "./ActivateAudio";

const isElectron = !!(window.electronAPI);

function AppAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const [audioLock, setAudioLock] = useState(!isElectron);
  const [context, setContext] = useState(isElectron ? ctx : false);

  const updatedContext = () => {
    setContext(ctx);
    setAudioLock(false);
  };

  // Auto-unlock audio in Electron (no user gesture required)
  useEffect(() => {
    if (isElectron) {
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
