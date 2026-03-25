import { Composition } from "remotion";
import { VeloTradefiVideo } from "./VeloTradefiVideo";

export const VeloRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VeloTradefiVideo"
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        component={VeloTradefiVideo}
        defaultProps={{
          stockPrice: "$127.45",
          changePercent: "+2.34%",
          marketCap: "$2.8T",
          tokenName: "VELO",
          userName: "Alex Trader",
          topMovers: [
            { symbol: "AAPL", price: "$187.32", change: "+1.2%" },
            { symbol: "TSLA", price: "$248.50", change: "+3.8%" },
            { symbol: "NVDA", price: "$875.40", change: "+5.1%" },
          ],
        }}
      />
    </>
  );
};
