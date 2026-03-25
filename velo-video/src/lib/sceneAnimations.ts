import { interpolate, spring, useVideoConfig } from "remotion";
import { useSceneFrame } from "../SceneFrameContext";

export function useSceneFadeIn(startFrame = 0, duration = 20) {
  const f = useSceneFrame();
  return interpolate(f, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useSceneSlideUp(startFrame = 0, distance = 40) {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: f - startFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  return {
    opacity: interpolate(f, [startFrame, startFrame + 10], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

export function useSceneScaleIn(startFrame = 0) {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: f - startFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  return {
    opacity: interpolate(progress, [0, 0.3], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `scale(${interpolate(progress, [0, 1], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
  };
}

export function useSceneCountUp(
  startFrame: number,
  endFrame: number,
  from: number,
  to: number
) {
  const f = useSceneFrame();
  return Math.round(
    interpolate(f, [startFrame, endFrame], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
}

export function useSceneSpring(
  startFrame: number,
  config: { damping: number; stiffness: number; mass?: number }
) {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - startFrame, fps, config });
}
