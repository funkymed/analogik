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
        "Unlocking your Tesla",
        "Overclocking your Nvidia's card to mine Bitcoin",
        "Reconnecting your 56k modem",
        "Spamming scam from your IP",
        "Accessing your personnal data",
        "Sending your nude's photos to all your friends",
        "Hacking your wallet",
      ])}
    />
  );
};

export default Loader;
