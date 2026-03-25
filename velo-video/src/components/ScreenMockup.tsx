import React, { useState } from "react";
import { Img, staticFile } from "remotion";

interface ScreenMockupProps {
  src: string;
  style?: React.CSSProperties;
  borderColor?: string;
}

function boxShadowForBorder(borderColor: string): string {
  const ring =
    borderColor.startsWith("#") && borderColor.length === 7
      ? `${borderColor}40`
      : borderColor;
  const glow =
    borderColor.startsWith("#") && borderColor.length === 7
      ? `${borderColor}15`
      : "rgba(255,255,255,0.06)";
  return `0 0 0 1px ${ring}, 0 32px 64px rgba(0,0,0,0.8), 0 0 80px ${glow}`;
}

export const ScreenMockup: React.FC<ScreenMockupProps> = ({
  src,
  style,
  borderColor = "rgba(255,255,255,0.1)",
}) => {
  const [hasError, setHasError] = useState(false);
  const imagePath = staticFile(`screenshots/${src}`);

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: boxShadowForBorder(borderColor),
        background: "#141418",
        ...style,
      }}
    >
      <div
        style={{
          height: 30,
          background: "#1C1C24",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 6,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {[
          { color: "#F05252", label: "close" },
          { color: "#F59E0B", label: "minimize" },
          { color: "#A3E635", label: "maximize" },
        ].map(({ color, label }) => (
          <div
            key={label}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
        ))}

        <div
          style={{
            flex: 1,
            maxWidth: 280,
            margin: "0 auto",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 4,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8px",
          }}
        >
          <span
            style={{
              fontSize: 8,
              color: "#4A4A5A",
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: 0.3,
            }}
          >
            localhost:3000
          </span>
        </div>
      </div>

      {hasError ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#0A0A0C",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 24, opacity: 0.3 }}>⚡</div>
          <span
            style={{
              fontSize: 11,
              color: "#4A4A5A",
              fontFamily: "monospace",
            }}
          >
            {src}
          </span>
        </div>
      ) : (
        <Img
          src={imagePath}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            display: "block",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
};
