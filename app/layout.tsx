import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Seegro",
  description: "Cafe24 sales and margin dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
