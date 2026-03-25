import React from "react";
import { interpolate } from "remotion";
import { useSceneFrame } from "../SceneFrameContext";

type Props = {
  width?: number;
  startFrame?: number;
};

export const GlowLine: React.FC<Props> = ({ width = 400, startFrame = 0 }) => {
  const f = useSceneFrame();
  const wPct = interpolate(f, [startFrame, startFrame + 40], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width, height: 2 }}>
      <div
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "rgba(163,230,53,0.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: 2,
          width: `${wPct}%`,
          backgroundColor: "#A3E635",
          borderRadius: 1,
          boxShadow: "0 0 12px #A3E635, 0 0 24px rgba(163,230,53,0.4)",
        }}
      />
    </div>
  );
};
