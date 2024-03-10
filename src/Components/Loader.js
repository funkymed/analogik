import { Loader as LoaderRsuite } from "rsuite";
import { getRandomItem } from "../tools";
const Loader = () => {
  return (
    <LoaderRsuite
      speed="fast"
      center={true}
      vertical={true}
      size="lg"
      content={getRandomItem([
        "Ch33p Ch33p",
        "Bleep Bleep",
        "Defragmenting",
        "Downloading the internet",
        "Contacting Elon",
        "Sending data to the FBI",
        "Hacking your computer",
        "Unlocking your Tesla's doors",
        "Reconnecting your 56k modem",
        "Spamming scam from your computer",
        "Accessing your personnal data",
        "Sending your nude photo to all your friends",
        "Uncrypting your wallet",
      ])}
    />
  );
};

export default Loader;
