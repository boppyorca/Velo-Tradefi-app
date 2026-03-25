import React from "react";
import { useSceneScaleIn } from "../lib/sceneAnimations";

type Props = {
  name: string;
  color: string;
  startFrame: number;
};

export const TechBadge: React.FC<Props> = ({ name, color, startFrame }) => {
  const anim = useSceneScaleIn(startFrame);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid ${color}40`,
        background: `${color}12`,
        color,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        ...anim,
      }}
    >
      {name}
    </div>
  );
};
