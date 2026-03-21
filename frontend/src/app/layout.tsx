import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/Providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velo — AI Stock & Crypto Intelligence",
  description:
    "AI-powered stock prediction and crypto tracking platform for VN & US markets",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} bg-[#0A0A0C] text-[#F0F0F0] antialiased`}
      >
        {/* Wallet extensions (MetaMask + others) can throw when both try to own window.ethereum — silence so Next dev overlay does not block the app */}
        <Script id="velo-wallet-extension-noise" strategy="beforeInteractive">
          {`
(function () {
  var patterns = [
    "Cannot redefine property: ethereum",
    "Cannot redefine property: web3",
    "Cannot set property ethereum"
  ];
  function shouldIgnore(msg) {
    if (!msg) return false;
    for (var i = 0; i < patterns.length; i++) {
      if (msg.indexOf(patterns[i]) !== -1) return true;
    }
    return false;
  }
  window.addEventListener(
    "error",
    function (e) {
      if (shouldIgnore(e.message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    var msg = typeof r === "string" ? r : (r && r.message) || String(r);
    if (shouldIgnore(msg)) e.preventDefault();
  });
})();
          `}
        </Script>
        <Providers>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
