import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali"],
});

/** Classes that define the font CSS variables used by the type tokens. */
export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoSansBengali.variable,
].join(" ");
