import { Composition } from "remotion";
import { VeloVideo } from "./VeloVideo";

export const RemotionRoot = () => (
  <Composition
    id="VeloVideo"
    component={VeloVideo}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
  />
);
