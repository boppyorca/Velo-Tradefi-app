import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { C } from "../lib/theme";
import { useSceneSlideUp } from "../lib/sceneAnimations";
import { useSceneFrame } from "../SceneFrameContext";

const rows = [
  "Stock data scattered across 5+ different platforms",
  "AI predictions require expensive Bloomberg terminals",
  "No unified view for stocks + crypto + news",
];

export const Scene02Problem: React.FC = () => {
  const f = useSceneFrame();
  const sweep = interpolate(f, [130, 179], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentDim = interpolate(f, [130, 160], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ opacity: contentDim, maxWidth: 900, padding: 40 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <AnimatedText
            text="The problem."
            startFrame={10}
            fontSize={52}
            fontWeight={700}
            color={C.textSecondary}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {rows.map((text, i) => (
            <ProblemRow key={text} text={text} startFrame={30 + i * 25} />
          ))}
        </div>
      </div>
      {/* Lime sweep line — brand thread */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: `${sweep}%`,
          height: 2,
          background: C.lime,
          boxShadow: `0 0 20px ${C.lime}`,
          opacity: f >= 130 ? 1 : 0,
        }}
      />
    </AbsoluteFill>
  );
};

const ProblemRow: React.FC<{ text: string; startFrame: number }> = ({
  text,
  startFrame,
}) => {
  const anim = useSceneSlideUp(startFrame, 30);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        ...anim,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: "rgba(240,82,82,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.red,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✕
      </div>
      <div style={{ fontSize: 22, color: C.text, fontWeight: 400 }}>{text}</div>
    </div>
  );
};
