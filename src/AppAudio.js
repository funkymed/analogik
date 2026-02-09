import { useState } from "react";
import App from "./App";
import ActivateAudio from "./ActivateAudio";

function AppAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const [audioLock, setAudioLock] = useState(true); 
  const [context, setContext] = useState(audioLock ? false : ctx);

  const updatedContext = () => {
    setContext(ctx);
    setAudioLock(false);
  };

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
