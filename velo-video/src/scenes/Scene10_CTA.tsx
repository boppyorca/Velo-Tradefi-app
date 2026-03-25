import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { GlowLine } from "../components/GlowLine";
import { PriceCounter } from "../components/PriceCounter";
import { C, springSmooth } from "../lib/theme";
import { useSceneFrame } from "../SceneFrameContext";

export const Scene10CTA: React.FC = () => {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(f, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(f, [160, 179], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = fadeIn * fadeOut;

  const logoS = spring({
    frame: f - 10,
    fps,
    config: springSmooth,
  });
  const logoScale = interpolate(logoS, [0, 1], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teamOp = interpolate(f, [80, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlOp = interpolate(f, [140, 152], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: op,
      }}
    >
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: f < 10 ? 0 : 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            backgroundColor: C.lime,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
          }}
        >
          ⚡
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 80,
            fontWeight: 900,
            color: C.text,
            letterSpacing: -2,
          }}
        >
          VELO
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <AnimatedText
          text="One terminal."
          startFrame={40}
          fontSize={64}
          fontWeight={800}
          color={C.text}
        />
      </div>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <AnimatedText
          text="Infinite edge."
          startFrame={78}
          fontSize={64}
          fontWeight={800}
          color={C.lime}
        />
      </div>

      <p
        style={{
          marginTop: 40,
          fontSize: 16,
          color: C.textMuted,
          textAlign: "center",
          letterSpacing: 2,
          opacity: teamOp,
          maxWidth: 720,
        }}
      >
        Đồ án môn Lập trình Web · Nhóm 2–3 người · 2026
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 64,
          marginTop: 36,
          justifyContent: "center",
        }}
      >
        <PriceCounter
          from={0}
          to={5}
          startFrame={100}
          endFrame={118}
          label="+ Modules"
          color={C.lime}
        />
        <PriceCounter
          from={0}
          to={3}
          startFrame={104}
          endFrame={122}
          label="Services"
          color={C.text}
        />
        <PriceCounter
          from={0}
          to={8}
          startFrame={108}
          endFrame={126}
          label="Weeks"
          color={C.textSecondary}
        />
      </div>

      <div style={{ marginTop: 40, width: 1920, maxWidth: "100%" }}>
        <GlowLine width={1920} startFrame={130} />
      </div>

      <span
        style={{
          marginTop: 24,
          fontSize: 14,
          color: C.textMuted,
          fontFamily: "ui-monospace, monospace",
          opacity: urlOp,
        }}
      >
        localhost:3000
      </span>
    </AbsoluteFill>
  );
};
