export const metadata = {
  title: "Pegs & Jokers – SVG Track Demo",
  description: "Next.js + Tailwind + Zustand + Framer Motion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
