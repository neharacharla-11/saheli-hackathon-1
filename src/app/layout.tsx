import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Figtree } from "next/font/google";
import { ThemeController, themeBootScript } from "@/components/ThemeController";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saheli-app.vercel.app";
const DESCRIPTION =
  "Every app tracks her cycle. None of them understand her. Saheli is a caring AI companion that adapts food, movement, mind and health care to how her body feels today.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Saheli · Made for every version of her by her",
    template: "%s · Saheli",
  },
  description: DESCRIPTION,
  applicationName: "Saheli",
  openGraph: {
    type: "website",
    siteName: "Saheli",
    title: "Saheli · Made for every version of her by her",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Saheli · Made for every version of her by her",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FDF4F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="rose"
      data-mode="light"
      className={`${dmSerif.variable} ${figtree.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <ThemeController />
        {children}
      </body>
    </html>
  );
}
