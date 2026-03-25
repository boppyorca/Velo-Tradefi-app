import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  random,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

/* ──────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */
type TopMover = { symbol: string; price: string; change: string };

type VideoProps = {
  stockPrice: string;
  changePercent: string;
  marketCap: string;
  tokenName: string;
  userName: string;
  topMovers: TopMover[];
};

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
const BRAND = {
  primary: "#00D2FF",     // Cyan neon
  secondary: "#7B2FFF",   // Purple neon
  accent: "#00FF88",      // Green neon
  dark: "#0a0f1e",       // Deep navy
  surface: "#111827",     // Card background
  text: "#F9FAFB",
  textMuted: "#9CA3AF",
  border: "#1F2937",
};

/* Animate-in from bottom + opacity */
const slideUp = (
  frame: number,
  delay: number,
  distance = 40,
  duration = 20
) => {
  const t = Math.max(0, frame - delay);
  const progress = Math.min(1, t / duration);
  return {
    opacity: interpolate(progress, [0, 0.8], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
};

/* Glow pulse */
const glowPulse = (frame: number, period = 60) =>
  interpolate(frame % period, [0, period / 2, period], [0.3, 0.9, 0.3]);

/* ──────────────────────────────────────────────────────────
   Scene 1: Title Screen
────────────────────────────────────────────────────────── */
const TitleScene: React.FC<{ frame: number; fps: number; tokenName: string }> = ({
  frame,
  fps,
  tokenName,
}) => {
  const logoScale = spring({ fps, frame, config: { damping: 12 } });
  const subtitleDelay = 30;
  const taglineDelay = 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background gradient orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)`,
          opacity: glowPulse(frame, 90),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.secondary}44 0%, transparent 70%)`,
          opacity: glowPulse(frame + 30, 90),
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          ...slideUp(frame, 0),
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px ${BRAND.primary}66`,
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            V
          </span>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          ...slideUp(frame, subtitleDelay),
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            background: `linear-gradient(90deg, ${BRAND.text}, ${BRAND.primary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
          }}
        >
          Velo {tokenName}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: BRAND.textMuted,
            marginTop: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Tradefi Platform
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 40,
          fontSize: 20,
          color: BRAND.textMuted,
          ...slideUp(frame, taglineDelay),
        }}
      >
        AI-Powered Real-Time Trading Intelligence
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Scene 2: Dashboard Overview
────────────────────────────────────────────────────────── */
const DashboardScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const cardDelay = 20;
  const dataDelay = 60;

  const card = (
    delay: number,
    x: number,
    y: number,
    w: number,
    h: number,
    children: React.ReactNode
  ) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        backgroundColor: BRAND.surface,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16,
        padding: 20,
        overflow: "hidden",
        ...slideUp(frame, delay, 30),
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          height: 2,
          background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
          borderRadius: 2,
          opacity: 0.8,
        }}
      />
      {children}
    </div>
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: BRAND.dark, alignItems: "center", justifyContent: "center" }}
    >
      {/* Section title */}
      <div style={{ ...slideUp(frame, 0), marginBottom: 32 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: BRAND.text,
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          Real-Time Dashboard
        </div>
        <div
          style={{
            fontSize: 20,
            color: BRAND.textMuted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Live market data, AI predictions, and portfolio tracking
        </div>
      </div>

      {/* Cards row */}
      <div
        style={{
          display: "flex",
          gap: 20,
          ...slideUp(frame, cardDelay, 20),
        }}
      >
        {/* Main price card */}
        {card(cardDelay, 0, 0, 380, 220, (
          <>
            <div style={{ fontSize: 14, color: BRAND.textMuted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Main Index
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: BRAND.text,
                marginTop: 12,
                letterSpacing: "-0.04em",
              }}
            >
              $12,745.30
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: BRAND.accent,
                marginTop: 8,
              }}
            >
              +2.34%
            </div>
            <div style={{ fontSize: 13, color: BRAND.textMuted, marginTop: 8 }}>
              vs yesterday close
            </div>
          </>
        ))}

        {/* Market cap card */}
        {card(cardDelay + 15, 0, 0, 300, 220, (
          <>
            <div style={{ fontSize: 14, color: BRAND.textMuted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Market Cap
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: BRAND.primary,
                marginTop: 20,
                letterSpacing: "-0.03em",
              }}
            >
              $2.8T
            </div>
            <div style={{ fontSize: 13, color: BRAND.textMuted, marginTop: 12 }}>
              Total crypto market
            </div>
          </>
        ))}

        {/* Volume card */}
        {card(cardDelay + 30, 0, 0, 300, 220, (
          <>
            <div style={{ fontSize: 14, color: BRAND.textMuted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              24h Volume
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: BRAND.secondary,
                marginTop: 20,
                letterSpacing: "-0.03em",
              }}
            >
              $89.4B
            </div>
            <div style={{ fontSize: 13, color: BRAND.textMuted, marginTop: 12 }}>
              Spot + derivatives
            </div>
          </>
        ))}
      </div>

      {/* Bottom label */}
      <div style={{ ...slideUp(frame, dataDelay + 20, 20), marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: BRAND.surface,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 20,
            padding: "6px 16px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: BRAND.accent,
              boxShadow: `0 0 6px ${BRAND.accent}`,
            }}
          />
          <span style={{ fontSize: 14, color: BRAND.textMuted }}>
            Data updated every 5 seconds via SignalR
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Scene 3: Top Movers Table
────────────────────────────────────────────────────────── */
const TopMoversScene: React.FC<{ frame: number; fps: number; topMovers: TopMover[] }> = ({
  frame,
  fps,
  topMovers,
}) => {
  const rows = topMovers.map((stock, i) => {
    const rowDelay = 20 + i * 15;
    const progress = Math.min(1, Math.max(0, (frame - rowDelay) / 20));
    const isPositive = stock.change.startsWith("+");

    return (
      <div
        key={stock.symbol}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: `1px solid ${BRAND.border}`,
          backgroundColor: i % 2 === 0 ? "transparent" : `${BRAND.primary}08`,
          opacity: interpolate(progress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(progress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${BRAND.primary}33, ${BRAND.secondary}33)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: BRAND.primary,
            }}
          >
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.text }}>
              {stock.symbol}
            </div>
            <div style={{ fontSize: 12, color: BRAND.textMuted }}>NASDAQ</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.text }}>
            {stock.price}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isPositive ? BRAND.accent : "#FF4757",
            }}
          >
            {stock.change}
          </div>
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: BRAND.dark, alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ ...slideUp(frame, 0), marginBottom: 28 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: BRAND.text,
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          Top Movers
        </div>
        <div style={{ fontSize: 18, color: BRAND.textMuted, textAlign: "center", marginTop: 8 }}>
          Real-time price changes · Updated live
        </div>
      </div>

      <div
        style={{
          width: 600,
          borderRadius: 16,
          border: `1px solid ${BRAND.border}`,
          overflow: "hidden",
          backgroundColor: BRAND.surface,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderBottom: `1px solid ${BRAND.border}`,
            backgroundColor: `${BRAND.primary}11`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Symbol
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Price · Change
          </span>
        </div>
        {rows}
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Scene 4: AI Prediction
────────────────────────────────────────────────────────── */
const AIPredictionScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const chartPoints = Array.from({ length: 30 }, (_, i) => {
    const base = 100 + random(`base-${i}`) * 20;
    const trend = i < 18 ? base - 10 : base + 15;
    return { x: (i / 29) * 560, y: 180 - (trend - 90) * 2 };
  });

  const pathD = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <AbsoluteFill
      style={{ backgroundColor: BRAND.dark, alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ ...slideUp(frame, 0), marginBottom: 32 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: BRAND.text,
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          AI Price Prediction
        </div>
        <div style={{ fontSize: 18, color: BRAND.textMuted, textAlign: "center", marginTop: 8 }}>
          LSTM neural network · 94.2% accuracy
        </div>
      </div>

      {/* Chart card */}
      <div
        style={{
          width: 640,
          height: 320,
          backgroundColor: BRAND.surface,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 20,
          padding: 24,
          ...slideUp(frame, 20, 30),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, color: BRAND.textMuted }}>AAPL · 30-day forecast</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: BRAND.text, marginTop: 4 }}>
              $187.32
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: BRAND.textMuted }}>Predicted high</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.accent, marginTop: 4 }}>
              $198.50
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <svg width="592" height="200" viewBox="0 0 592 200" style={{ overflow: "visible" }}>
          {/* Grid lines */}
          {[0, 50, 100, 150, 200].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="592"
              y2={y}
              stroke={BRAND.border}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}
          {/* Historical area */}
          <path
            d={`${pathD.replace("M", "M 0 180 L").replace(" M ", " L ")} L 592 200 L 0 200 Z`}
            fill={`${BRAND.primary}15`}
          />
          {/* Historical line */}
          <path
            d={pathD}
            fill="none"
            stroke={BRAND.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Predicted line (dashed) */}
          <path
            d={`M ${(17 / 29) * 560} 180 L ${(18 / 29) * 560} ${180 - (115 - 90) * 2} L 592 ${180 - (120 - 90) * 2}`}
            fill="none"
            stroke={BRAND.accent}
            strokeWidth="3"
            strokeDasharray="8 4"
            strokeLinecap="round"
          />
          {/* Today marker */}
          <circle
            cx={(17 / 29) * 560}
            cy={180 - (110 - 90) * 2}
            r="6"
            fill={BRAND.primary}
          />
          <text
            x={(17 / 29) * 560}
            y="196"
            fill={BRAND.textMuted}
            fontSize="11"
            textAnchor="middle"
          >
            Today
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Scene 5: Memecoins / Web3
────────────────────────────────────────────────────────── */
const MemecoinsScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const coins = [
    { name: "DOGE", price: "$0.1842", change: "+12.4%", color: "#F7C948" },
    { name: "SHIB", price: "$0.000028", change: "+8.7%", color: "#FF6B6B" },
    { name: "PEPE", price: "$0.000012", change: "+31.2%", color: "#00D2FF" },
  ];

  return (
    <AbsoluteFill
      style={{ backgroundColor: BRAND.dark, alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ ...slideUp(frame, 0), marginBottom: 32 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: BRAND.text,
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          Memecoins
        </div>
        <div style={{ fontSize: 18, color: BRAND.textMuted, textAlign: "center", marginTop: 8 }}>
          Live prices from CoinGecko · Web3 integration
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          ...slideUp(frame, 20, 20),
        }}
      >
        {coins.map((coin, i) => (
          <div
            key={coin.name}
            style={{
              width: 240,
              padding: 24,
              backgroundColor: BRAND.surface,
              border: `1px solid ${coin.color}44`,
              borderRadius: 20,
              textAlign: "center",
              boxShadow: `0 0 30px ${coin.color}22`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${coin.color}22`,
                border: `1px solid ${coin.color}66`,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 900,
                color: coin.color,
              }}
            >
              {coin.name.slice(0, 2)}
            </div>
            <div style={{ fontSize: 14, color: BRAND.textMuted, fontWeight: 600 }}>
              {coin.name}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: BRAND.text,
                marginTop: 6,
                letterSpacing: "-0.02em",
              }}
            >
              {coin.price}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: BRAND.accent,
                marginTop: 8,
              }}
            >
              {coin.change}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Scene 6: CTA / End Screen
────────────────────────────────────────────────────────── */
const CTAScene: React.FC<{ frame: number; fps: number; userName: string }> = ({
  frame,
  fps,
  userName,
}) => {
  const scale = spring({ fps, frame, config: { damping: 10 } });
  const btnDelay = 40;
  const btnProgress = Math.min(1, Math.max(0, (frame - btnDelay) / 20));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Orbs */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.primary}1a 0%, transparent 70%)`,
          opacity: glowPulse(frame, 80),
        }}
      />

      <div style={{ textAlign: "center", ...slideUp(frame, 0) }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary}, ${BRAND.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ready to Trade Smarter?
        </div>

        <div
          style={{
            fontSize: 24,
            color: BRAND.textMuted,
            marginTop: 16,
            marginBottom: 48,
            maxWidth: 600,
          }}
        >
          Join thousands of traders using AI-powered insights and real-time market data
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "inline-block",
            padding: "18px 48px",
            borderRadius: 50,
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
            transform: `scale(${interpolate(btnProgress, [0, 1], [0.8, 1])})`,
            opacity: interpolate(btnProgress, [0, 1], [0, 1]),
            boxShadow: `0 0 40px ${BRAND.primary}55`,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Start Free Today
          </span>
        </div>

        <div style={{ marginTop: 24, fontSize: 14, color: BRAND.textMuted }}>
          No credit card required · Cancel anytime
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────
   Main Composition
────────────────────────────────────────────────────────── */
export const VeloTradefiVideo: React.FC<VideoProps> = ({
  tokenName,
  userName,
  topMovers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <TitleScene frame={frame} fps={fps} tokenName={tokenName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <DashboardScene frame={Math.max(0, frame - 110)} fps={fps} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <TopMoversScene
            frame={Math.max(0, frame - 230)}
            fps={fps}
            topMovers={topMovers}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <AIPredictionScene frame={Math.max(0, frame - 340)} fps={fps} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={60}>
          <MemecoinsScene frame={Math.max(0, frame - 450)} fps={fps} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene frame={Math.max(0, frame - 530)} fps={fps} userName={userName} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
