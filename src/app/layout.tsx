export const metadata = {
  title: "Pegs & Jokers Online - Play Free Multiplayer Board Game",
  description: "Play Pegs & Jokers online with friends! Free multiplayer board game with 4-8 players. Create or join games instantly. No download required - play in your browser.",
  keywords: "pegs and jokers, pegs and jokers online, board game, multiplayer game, card game, family game, jokers and pegs, play online, free game",
  authors: [{ name: "Pegs & Jokers" }],
  openGraph: {
    title: "Pegs & Jokers Online - Play Free Multiplayer Board Game",
    description: "Play Pegs & Jokers online with friends! Free multiplayer board game with 4-8 players.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pegs & Jokers Online - Play Free Multiplayer Board Game",
    description: "Play Pegs & Jokers online with friends! Free multiplayer board game with 4-8 players.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
