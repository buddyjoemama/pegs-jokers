# Pegs & Jokers – Next.js + Tailwind + Zustand + Framer Motion

A minimal board rendering demo (SVG) using Zustand for state. Click a peg in BASE, then click any slot to move it (toy interaction).

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Structure

- `src/app/page.tsx` – client entry page that renders the board
- `src/components/board/TrackDemo.tsx` – main SVG board component
- `src/components/board/useGame.ts` – Zustand store and types
- `src/components/board/geometry.ts` – geometry helpers
- Tailwind is preconfigured in `tailwind.config.ts` and `src/app/globals.css`

## Notes

- This is a visual demo. It does not implement real Pegs & Jokers rules.
- Geometry is clean and swappable (you can change the track shape later).
- Ready to extend with SignalR/WebSockets for multiplayer.
