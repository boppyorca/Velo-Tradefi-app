import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { TechBadge } from "../components/TechBadge";
import { C } from "../lib/theme";
import { useSceneFrame } from "../SceneFrameContext";

export const Scene09TechStack: React.FC = () => {
  const f = useSceneFrame();
  const gridDraw = interpolate(f, [120, 170], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: 60,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle circuit grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(90deg, ${C.lime} 1px, transparent 1px),
            linear-gradient(${C.lime} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          clipPath: `inset(0 ${100 - gridDraw}% 0 0)`,
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <AnimatedText
          text="Built with modern tech"
          startFrame={10}
          fontSize={52}
          fontWeight={700}
          color={C.text}
        />
      </div>
      <p
        style={{
          marginTop: 20,
          fontSize: 18,
          color: C.textSecondary,
          textAlign: "center",
          zIndex: 1,
          opacity: interpolate(f, [30, 42], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Production-grade stack. Deployable. Scalable.
      </p>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <TechBadge name="Next.js 14" color="#F0F0F0" startFrame={50} />
          <TechBadge name="ASP.NET Core 8" color={C.indigo} startFrame={62} />
          <TechBadge name="Python FastAPI" color={C.amber} startFrame={74} />
          <TechBadge name="TailwindCSS" color={C.cyan} startFrame={86} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <TechBadge name="Supabase" color={C.supabase} startFrame={100} />
          <TechBadge name="Redis" color={C.red} startFrame={112} />
          <TechBadge name="SignalR" color={C.purple} startFrame={124} />
          <TechBadge name="Vercel + Railway" color="#F0F0F0" startFrame={136} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <TechBadge name="LSTM (Keras)" color={C.lime} startFrame={150} />
          <TechBadge name="Prophet" color={C.lime} startFrame={162} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
