import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SceneSpeak — Learn the line behind the subtitle",
  description: "Turn memorable Hindi and French movie lines into practical, culturally aware language lessons.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
