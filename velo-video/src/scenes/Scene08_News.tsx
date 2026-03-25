import React from "react";
import { AbsoluteFill } from "remotion";
import { ScreenMockup } from "../components/ScreenMockup";
import { C } from "../lib/theme";
import { useSceneSlideUp } from "../lib/sceneAnimations";

export const Scene08News: React.FC = () => {
  const label = useSceneSlideUp(10, 20);
  const title = useSceneSlideUp(18, 20);
  const desc = useSceneSlideUp(26, 20);
  const bullets = useSceneSlideUp(34, 20);
  const mock = useSceneSlideUp(40, 30);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(245,158,11,0.04)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "100%",
          padding: "80px 72px",
          gap: 56,
        }}
      >
        <div style={{ width: "48%", flexShrink: 0 }}>
          <div style={label}>
            <span
              style={{
                fontSize: 11,
                color: C.amber,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              04
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
              AI News Feed
            </h2>
          </div>
          <div style={{ ...desc, marginTop: 16 }}>
            <p
              style={{
                fontSize: 17,
                color: C.textSecondary,
                lineHeight: 1.6,
                maxWidth: 440,
                margin: 0,
              }}
            >
              Aggregated AI, tech, crypto & stock news from Hacker News API. Live
              updates every 5 minutes.
            </p>
          </div>
          <ul style={{ ...bullets, marginTop: 24, paddingLeft: 0, listStyle: "none" }}>
            {[
              "Real-time article feed",
              "Category filters: AI, Tech, Crypto, Stock",
              "Vote + comment counts",
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
        <div style={{ width: "52%", ...mock }}>
          <ScreenMockup src="news.png" borderColor="#F59E0B" style={{ width: "100%" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
