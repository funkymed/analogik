import { useEffect, useState } from "react";
import App from "./App";
import ActivateAudio from "./ActivateAudio";

function AppAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const state = ctx.state === "running";
  const [audioLock, setAudioLock] = useState(true); //!state);
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

  // useEffect(() => {
  //   if (state) {
  //     // updatedContext();
  //   }
  // }, []);

  return audioLock ? (
    <ActivateAudio unlockAudio={unlockAudio} />
  ) : (
    <App context={context} />
  );
}

export default AppAudio;
