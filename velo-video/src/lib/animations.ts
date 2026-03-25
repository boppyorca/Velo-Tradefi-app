import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export function useFadeIn(startFrame = 0, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useSlideUp(startFrame = 0, _duration = 25, distance = 40) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  return {
    opacity: interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

export function useScaleIn(startFrame = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - startFrame,
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

export function useCountUp(
  startFrame: number,
  endFrame: number,
  from: number,
  to: number
) {
  const frame = useCurrentFrame();
  return Math.round(
    interpolate(frame, [startFrame, endFrame], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
}

/** Composition-level crossfade between stacked scenes */
export function getSceneStackOpacity(
  compositionFrame: number,
  sceneIndex: number,
  sceneDuration = 180
) {
  const start = sceneIndex * sceneDuration;
  const end = start + sceneDuration - 1;
  let fadeIn: number;
  if (sceneIndex === 0) {
    fadeIn = interpolate(compositionFrame, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else {
    fadeIn = interpolate(compositionFrame, [start - 5, start + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  const fadeOut = interpolate(compositionFrame, [end - 14, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (compositionFrame < start - 5 || compositionFrame > end) {
    return 0;
  }
  return fadeIn * fadeOut;
}
