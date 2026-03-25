import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { GlowLine } from "../components/GlowLine";
import { ScreenMockup } from "../components/ScreenMockup";
import { C, springSmooth } from "../lib/theme";
import { useSceneFrame } from "../SceneFrameContext";

const tickers = [
  { sym: "NVDA", price: "$192.10", ch: "+2.4%", c: C.lime },
  { sym: "BTC", price: "$67,420", ch: "+3.1%", c: C.lime },
  { sym: "VNM", price: "45,200 ₫", ch: "+1.2%", c: C.lime },
];

export const Scene01Intro: React.FC = () => {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  const bgFade = interpolate(f, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = spring({
    frame: f - 10,
    fps,
    config: springSmooth,
  });
  const endFade = interpolate(f, [140, 160], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentOpacity = bgFade * endFade;

  const landingOpacity = interpolate(f, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const landingX = spring({
    frame: f - 90,
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const landingTranslateX = interpolate(landingX, [0, 1], [120, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: contentOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: -80,
        }}
      >
        <div
          style={{
            transform: `scale(${interpolate(logoScale, [0, 1], [0.5, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: f < 10 ? 0 : 1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: C.lime,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 32,
            }}
          >
            ⚡
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 72,
            fontWeight: 800,
            color: C.text,
            letterSpacing: -2,
            fontFamily: "Inter, sans-serif",
          }}
        >
          VELO
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 18,
            color: C.textSecondary,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          AI-Powered Market Intelligence
        </div>
        {f >= 60 && (
          <div style={{ marginTop: 24 }}>
            <GlowLine width={300} startFrame={60} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            marginTop: 48,
          }}
        >
          {tickers.map((t, i) => {
            const start = 80 + i * 12;
            const prog = spring({
              frame: f - start,
              fps,
              config: springSmooth,
            });
            const y = interpolate(prog, [0, 1], [60, 0]);
            const op = interpolate(f, [start, start + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={t.sym}
                style={{
                  opacity: op * contentOpacity,
                  transform: `translateY(${y}px)`,
                  backgroundColor: C.surface,
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontFamily: "ui-monospace, monospace",
                    color: C.text,
                  }}
                >
                  {t.sym}
                </span>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    color: C.textSecondary,
                  }}
                >
                  {t.price}
                </span>
                <span style={{ color: t.c, fontWeight: 600 }}>{t.ch}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: -180,
          top: "50%",
          transform: `translateY(-50%) translateX(${landingTranslateX}px)`,
          opacity: landingOpacity * 0.75,
          width: 680,
          pointerEvents: "none",
        }}
      >
        <ScreenMockup src="landing.png" borderColor="#A3E635" />
      </div>
    </AbsoluteFill>
  );
};
