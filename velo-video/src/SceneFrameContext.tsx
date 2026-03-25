import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";

const SceneFrameContext = createContext(0);

export const SceneFrameProvider: React.FC<{
  sceneStart: number;
  children: React.ReactNode;
}> = ({ sceneStart, children }) => {
  const f = useCurrentFrame();
  return (
    <SceneFrameContext.Provider value={f - sceneStart}>
      {children}
    </SceneFrameContext.Provider>
  );
};

export function useSceneFrame(): number {
  return useContext(SceneFrameContext);
}
