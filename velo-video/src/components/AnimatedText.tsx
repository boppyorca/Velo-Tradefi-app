import React from "react";
import { interpolate } from "remotion";
import { useSceneFrame } from "../SceneFrameContext";

type Props = {
  text: string;
  startFrame?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  delay?: number;
  style?: React.CSSProperties;
};

export const AnimatedText: React.FC<Props> = ({
  text,
  startFrame = 0,
  color = "#F0F0F0",
  fontSize = 48,
  fontWeight = 600,
  delay = 1.5,
  style,
}) => {
  const f = useSceneFrame();
  const chars = [...text];

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "Inter, sans-serif",
        ...style,
      }}
    >
      {chars.map((char, i) => {
        const t0 = startFrame + i * delay;
        const opacity = interpolate(f, [t0, t0 + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(f, [t0, t0 + 8], [6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`${i}-${char}`}
            style={{
              display: "inline-block",
              opacity,
              color,
              fontSize,
              fontWeight,
              transform: `translateY(${y}px)`,
              whiteSpace: char === " " ? "pre" : undefined,
            }}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        );
      })}
    </span>
  );
};
