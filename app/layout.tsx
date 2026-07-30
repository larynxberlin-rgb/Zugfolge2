import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const requestHost = forwardedHost ?? requestHeaders.get("host") ?? "";
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(requestHost)
    ? requestHost
    : "localhost:3000";
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : safeHost.startsWith("localhost")
        ? "http"
        : "https";
  const metadataBase = new URL(`${protocol}://${safeHost}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    applicationName: "Zugfolge",
    title: {
      default: "Zugfolge",
      template: "%s | Zugfolge",
    },
    description:
      "Plane präzise. Fahre profitabel. Die realistische Eisenbahn-Unternehmenssimulation.",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: "Zugfolge",
      title: "Zugfolge",
      description:
        "Plane präzise. Fahre profitabel. Die realistische Eisenbahn-Unternehmenssimulation.",
      images: [
        {
          url: socialImage,
          width: 1800,
          height: 900,
          alt: "Abstrakte Blockbelegung im Zugfolge-Pilotnetz",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Zugfolge",
      description:
        "Plane präzise. Fahre profitabel. Die realistische Eisenbahn-Unternehmenssimulation.",
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0B1016",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
