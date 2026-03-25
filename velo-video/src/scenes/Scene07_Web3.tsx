import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { ScreenMockup } from "../components/ScreenMockup";
import { C } from "../lib/theme";
import { useSceneSlideUp } from "../lib/sceneAnimations";
import { useSceneFrame } from "../SceneFrameContext";

export const Scene07Web3: React.FC = () => {
  const f = useSceneFrame();
  const label = useSceneSlideUp(10, 20);
  const title = useSceneSlideUp(18, 20);
  const desc = useSceneSlideUp(26, 20);
  const bullets = useSceneSlideUp(34, 20);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(139,92,246,0.03)",
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
          gap: 48,
        }}
      >
        <div style={{ width: "50%", flexShrink: 0 }}>
          <div style={label}>
            <span
              style={{
                fontSize: 11,
                color: C.purple,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              03
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
              Web3 Wallet
            </h2>
          </div>
          <div style={{ ...desc, marginTop: 16 }}>
            <p
              style={{
                fontSize: 17,
                color: C.textSecondary,
                lineHeight: 1.6,
                maxWidth: 460,
                margin: 0,
              }}
            >
              Connect MetaMask to view ETH & ERC-20 balances. Track top memecoins
              live via CoinGecko API.
            </p>
          </div>
          <ul style={{ ...bullets, marginTop: 24, paddingLeft: 0, listStyle: "none" }}>
            {[
              "MetaMask wallet connection",
              "ETH, USDC, BNB balances",
              "Live memecoin tracker",
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
        <div
          style={{
            width: "50%",
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ position: "relative", width: "100%", maxWidth: 720 }}>
            <ScreenMockup src="web3.png" borderColor="#8B5CF6" style={{ width: "100%" }} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const startFrame = 50 + i * 8;
              const particleProgress = interpolate(f, [startFrame, startFrame + 60], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const xPositions = [15, 28, 42, 57, 70, 85];
              const colors = ["#8B5CF6", "#A3E635", "#F59E0B", "#8B5CF6", "#6366F1", "#A3E635"];
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${xPositions[i]}%`,
                    bottom: `${interpolate(particleProgress, [0, 1], [10, 80])}%`,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: colors[i],
                    opacity: interpolate(
                      particleProgress,
                      [0, 0.2, 0.8, 1],
                      [0, 0.8, 0.8, 0]
                    ),
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
