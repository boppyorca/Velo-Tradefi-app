import React from "react";
import { useSceneCountUp } from "../lib/sceneAnimations";
import { C } from "../lib/theme";

type Props = {
  from: number;
  to: number;
  startFrame: number;
  endFrame: number;
  label: string;
  color?: string;
  suffix?: string;
};

export const PriceCounter: React.FC<Props> = ({
  from,
  to,
  startFrame,
  endFrame,
  label,
  color = C.lime,
  suffix = "",
}) => {
  const n = useSceneCountUp(startFrame, endFrame, from, to);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 36,
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          color,
        }}
      >
        {n}
        {suffix}
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
};
