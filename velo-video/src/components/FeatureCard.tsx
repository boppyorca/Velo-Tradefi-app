import React from "react";
import { useSceneSlideUp } from "../lib/sceneAnimations";
import { C } from "../lib/theme";

type Props = {
  title: string;
  description: string;
  accentColor: string;
  startFrame: number;
  icon?: React.ReactNode;
};

export const FeatureCard: React.FC<Props> = ({
  title,
  description,
  accentColor,
  startFrame,
  icon,
}) => {
  const anim = useSceneSlideUp(startFrame, 24);
  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 20,
        maxWidth: 320,
        ...anim,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${accentColor}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              fontSize: 20,
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.textMuted,
              marginBottom: 6,
            }}
          >
            Feature
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
