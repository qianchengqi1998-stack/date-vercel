import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fff9f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || "date-invite-yueyixia.qianchengqi1998.chatgpt.site";
  const protocol = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "DATE｜一起见面，做点有趣的事",
    description: "朋友见面或两人邀约都适用。对方先回应，再选择活动、时间和地点。",
    applicationName: "DATE",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "DATE", statusBarStyle: "default" },
    icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icon-192.png" }] },
    openGraph: { title: "DATE", description: "一起见面，做点有趣的事", type: "website", images: [{ url: new URL("/og.png", base), width: 1536, height: 1024, alt: "DATE 见面邀请 App" }] },
    twitter: { card: "summary_large_image", title: "DATE", description: "一起见面，做点有趣的事", images: [new URL("/og.png", base)] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
