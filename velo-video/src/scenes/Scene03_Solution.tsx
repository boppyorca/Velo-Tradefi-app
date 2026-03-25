import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { TechBadge } from "../components/TechBadge";
import { C } from "../lib/theme";
import { useSceneSlideUp } from "../lib/sceneAnimations";

export const Scene03Solution: React.FC = () => {
  const sub = useSceneSlideUp(100, 28);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: 60,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <AnimatedText
          text="INTRODUCING"
          startFrame={10}
          fontSize={12}
          fontWeight={600}
          color={C.lime}
          delay={2}
          style={{ letterSpacing: 6 }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <AnimatedText
          text="Trade smarter."
          startFrame={20}
          fontSize={72}
          fontWeight={800}
          color={C.text}
        />
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <AnimatedText
          text="Predict better."
          startFrame={60}
          fontSize={72}
          fontWeight={800}
          color={C.lime}
        />
      </div>
      <p
        style={{
          marginTop: 32,
          fontSize: 20,
          color: C.textSecondary,
          maxWidth: 700,
          textAlign: "center",
          lineHeight: 1.5,
          ...sub,
        }}
      >
        Real-time VN & US stocks · AI forecasting · Web3 · Memecoins — all in one
        terminal.
      </p>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <TechBadge name="Stock Tracking" color={C.lime} startFrame={130} />
        <TechBadge name="AI Predict" color={C.indigo} startFrame={138} />
        <TechBadge name="Web3" color={C.purple} startFrame={146} />
        <TechBadge name="Memecoins" color={C.amber} startFrame={154} />
        <TechBadge name="News Feed" color={C.textSecondary} startFrame={162} />
      </div>
    </AbsoluteFill>
  );
};
