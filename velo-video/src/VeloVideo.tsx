import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneFrameProvider } from "./SceneFrameContext";
import { getSceneStackOpacity } from "./lib/animations";
import { SCENE_DURATION, C } from "./lib/theme";
import { Scene01Intro } from "./scenes/Scene01_Intro";
import { Scene02Problem } from "./scenes/Scene02_Problem";
import { Scene03Solution } from "./scenes/Scene03_Solution";
import { Scene04Dashboard } from "./scenes/Scene04_Dashboard";
import { Scene05Markets } from "./scenes/Scene05_Markets";
import { Scene06AiPredict } from "./scenes/Scene06_AiPredict";
import { Scene07Web3 } from "./scenes/Scene07_Web3";
import { Scene08News } from "./scenes/Scene08_News";
import { Scene09TechStack } from "./scenes/Scene09_TechStack";
import { Scene10CTA } from "./scenes/Scene10_CTA";

const { fontFamily } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800", "900"],
});

const SCENES = [
  Scene01Intro,
  Scene02Problem,
  Scene03Solution,
  Scene04Dashboard,
  Scene05Markets,
  Scene06AiPredict,
  Scene07Web3,
  Scene08News,
  Scene09TechStack,
  Scene10CTA,
];

const NoiseOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.025,
      pointerEvents: "none",
      zIndex: 998,
      mixBlendMode: "overlay",
      backgroundImage: `
        repeating-linear-gradient(
          0deg,
          transparent 0,
          transparent 3px,
          rgba(255,255,255,0.06) 3px,
          rgba(255,255,255,0.06) 4px
        ),
        repeating-linear-gradient(
          90deg,
          transparent 0,
          transparent 3px,
          rgba(255,255,255,0.05) 3px,
          rgba(255,255,255,0.05) 4px
        )
      `,
    }}
  />
);

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      zIndex: 999,
      background:
        "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
    }}
  />
);

export const VeloVideo: React.FC = () => {
  const compositionFrame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background: C.bg,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {SCENES.map((Scene, i) => (
        <AbsoluteFill
          key={i}
          style={{
            opacity: getSceneStackOpacity(
              compositionFrame,
              i,
              SCENE_DURATION
            ),
          }}
        >
          <SceneFrameProvider sceneStart={i * SCENE_DURATION}>
            <Scene />
          </SceneFrameProvider>
        </AbsoluteFill>
      ))}
      <NoiseOverlay />
      <Vignette />
    </AbsoluteFill>
  );
};
