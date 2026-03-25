import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { ScreenMockup } from "../components/ScreenMockup";
import { C } from "../lib/theme";
import { useSceneFrame } from "../SceneFrameContext";

export const Scene06AiPredict: React.FC = () => {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  const scaleProgress = spring({
    frame: f - 40,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const mockupScale = interpolate(scaleProgress, [0, 1], [0.88, 1]);
  const mockupOpacity = interpolate(f, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pill1Opacity = interpolate(f, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pill1Y = interpolate(scaleProgress, [0, 1], [-20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0A0A0C 0%, #0d0d14 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 100px 60px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span
          style={{
            fontSize: 11,
            color: C.indigo,
            letterSpacing: 5,
            textTransform: "uppercase",
            opacity: interpolate(f, [10, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          POWERED BY LSTM + PROPHET
        </span>
        <div style={{ marginTop: 16 }}>
          <AnimatedText
            text="AI Price Prediction"
            startFrame={20}
            fontSize={60}
            fontWeight={800}
            color={C.text}
          />
        </div>
      </div>

      <div style={{ position: "relative", width: "75%", maxWidth: 1000 }}>
        <div
          style={{
            transform: `scale(${mockupScale})`,
            opacity: mockupOpacity,
            transformOrigin: "center center",
          }}
        >
          <ScreenMockup src="ai-predict.png" borderColor="#6366F1" style={{ width: "100%" }} />
        </div>

        <div
          style={{
            position: "absolute",
            top: 48,
            left: -12,
            opacity: pill1Opacity,
            transform: `translateY(${pill1Y}px)`,
            background: "rgba(20, 20, 30, 0.95)",
            border: "1px solid rgba(99, 102, 241, 0.5)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#6366F1",
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 500,
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          LSTM Model
        </div>

        <div
          style={{
            position: "absolute",
            top: 48,
            right: -12,
            opacity: pill1Opacity,
            transform: `translateY(${pill1Y}px)`,
            background: "rgba(20, 20, 30, 0.95)",
            border: "1px solid rgba(99, 102, 241, 0.5)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#A3E635",
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 500,
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          ● 87% conf
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 24,
            opacity: pill1Opacity,
            background: "rgba(20, 20, 30, 0.95)",
            border: "1px solid rgba(163, 230, 53, 0.4)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#A3E635",
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
            whiteSpace: "nowrap",
          }}
        >
          ↑ 7D Target $199.20
        </div>
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: C.textMuted,
          opacity: interpolate(f, [120, 132], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        ⚠ For educational purposes only. Not financial advice.
      </p>
    </AbsoluteFill>
  );
};
