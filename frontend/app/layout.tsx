import "./globals.css";

export const metadata = {
  title: "AERO-SENTINEL",
  description: "AI-Enabled Digital Twin for MALE UAV Engine Reliability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}