import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { ScreenMockup } from "../components/ScreenMockup";
import { C } from "../lib/theme";
import { useSceneSlideUp } from "../lib/sceneAnimations";
import { useSceneFrame } from "../SceneFrameContext";

export const Scene05Markets: React.FC = () => {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();
  const label = useSceneSlideUp(10, 20);
  const title = useSceneSlideUp(18, 20);
  const desc = useSceneSlideUp(26, 20);
  const bullets = useSceneSlideUp(34, 20);

  const mockupProgress = spring({
    frame: f - 40,
    fps,
    config: { damping: 12, stiffness: 90 },
  });
  const mockupX = interpolate(mockupProgress, [0, 1], [-80, 0]);
  const mockupOpacity = interpolate(f, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanY = interpolate(f, [60, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "100%",
          padding: "80px 72px",
          gap: 48,
        }}
      >
        <div
          style={{
            flex: "0 0 55%",
            minWidth: 0,
            transform: `translateX(${mockupX}px)`,
            opacity: mockupOpacity,
          }}
        >
          <div style={{ position: "relative" }}>
            <ScreenMockup src="markets.png" borderColor="#A3E635" style={{ width: "100%" }} />
            <div
              style={{
                position: "absolute",
                top: `${scanY}%`,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, transparent, #A3E635, transparent)",
                opacity: 0.4,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        <div style={{ flex: "0 0 45%", minWidth: 0 }}>
          <div style={label}>
            <span
              style={{
                fontSize: 11,
                color: C.lime,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              02
            </span>
          </div>
          <div style={{ ...title, marginTop: 8 }}>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: C.text,
                margin: 0,
              }}
            >
              Markets
            </h2>
          </div>
          <div style={{ ...desc, marginTop: 16 }}>
            <p
              style={{
                fontSize: 17,
                color: C.textSecondary,
                lineHeight: 1.6,
                maxWidth: 480,
                margin: 0,
              }}
            >
              Real-time VN (HOSE) & US (NASDAQ/NYSE) stock prices. 30-second
              auto-refresh via SignalR with Redis caching.
            </p>
          </div>
          <ul style={{ ...bullets, marginTop: 24, paddingLeft: 0, listStyle: "none" }}>
            {[
              "Live price + change + volume",
              "VN & US market filter",
              "Instant watchlist add/remove",
            ].map((t) => (
              <li
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  fontSize: 16,
                  color: C.text,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: C.lime,
                  }}
                />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AbsoluteFill>
  );
};
