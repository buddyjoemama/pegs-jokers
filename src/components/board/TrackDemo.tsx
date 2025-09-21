"use client";
import React from "react";
import { motion } from "framer-motion";
import { useGame, Player } from "./useGame";
import { slotAngle, slotPosition, polarToXY } from "./geometry";

const Track: React.FC<{ size?: number }> = ({ size = 720 }) => {
  const { players, rules, totalSlots, selectedPeg, selectPeg, moveSelectedPegTo } = useGame();

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const slotR = size * 0.012;

  const centers = Array.from({ length: totalSlots }, (_, i) =>
    slotPosition(i, totalSlots, cx, cy, outerR)
  );

  const Marker = ({ index, label, stroke = "#111", color = "#111" } : { index: number; label: string; stroke?: string; color?: string }) => {
    const { x, y } = centers[index];
    return (
      <g>
        <circle cx={x} cy={y} r={slotR * 1.4} fill="none" stroke={stroke} strokeWidth={2} />
        <text x={x} y={y - slotR * 1.8} fontSize={12} textAnchor="middle" fill={color}>{label}</text>
      </g>
    );
  };

  const pegsOnSlot = new Map<number, { player: Player; pegId: string }[]>();
  players.forEach((pl) =>
    pl.pegs.forEach((pg) => {
      if (typeof pg.pos === "number") {
        const arr = pegsOnSlot.get(pg.pos) ?? [];
        arr.push({ player: pl, pegId: pg.pegId });
        pegsOnSlot.set(pg.pos, arr);
      }
    })
  );

  return (
    <div className="w-full h-full grid place-items-center p-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        <defs>
          <radialGradient id="felt" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0f172a"/>
            <stop offset="100%" stopColor="#020617"/>
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={size} height={size} fill="url(#felt)" rx={24} />

        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#334155" strokeWidth={8} />

        {players.map((pl) => {
          const start = pl.startIndex;
          const a0 = slotAngle(start, totalSlots);
          const a1 = slotAngle(start + rules.slotsPerPlayer, totalSlots);
          const steps = rules.slotsPerPlayer;
          const rUnder = outerR + 10;
          const path: string[] = [];
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const a = a0 + t * (a1 - a0);
            const { x, y } = polarToXY(cx, cy, rUnder, a);
            path.push(`${s === 0 ? "M" : "L"}${x},${y}`);
          }
          return (
            <path key={pl.id}
              d={path.join(" ")}
              stroke={pl.color}
              strokeOpacity={0.25}
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {centers.map(({ x, y }, i) => (
          <g key={i} className="cursor-pointer" onClick={() => moveSelectedPegTo(i)}>
            <circle cx={x} cy={y} r={slotR} fill="#0ea5e9" opacity={0.15} />
            <circle cx={x} cy={y} r={slotR * 0.5} fill="#94a3b8" />
            <text x={x} y={y + slotR * 2.4} fontSize={9} textAnchor="middle" fill="#64748b">{i}</text>
          </g>
        ))}

        {players.map((pl) => (
          <g key={`markers-${pl.id}`}>
            <Marker index={pl.startIndex} label={`${pl.name} Start`} color={pl.color} stroke={pl.color} />
            <Marker index={pl.homeEntryIndex} label={`${pl.name} Home`} color={pl.color} stroke={pl.color} />
          </g>
        ))}

        {Array.from(pegsOnSlot.entries()).map(([slot, items]) => {
          const { x, y } = centers[slot];
          return (
            <g key={`slot-pegs-${slot}`}>
              {items.map((it, idx) => (
                <motion.circle
                  key={`${slot}-${it.pegId}`}
                  cx={x + (idx - (items.length - 1) / 2) * (slotR * 0.8)}
                  cy={y - slotR * 1.6}
                  r={slotR * 0.8}
                  fill={it.player.color}
                  stroke="#0b1020"
                  strokeWidth={2}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                />
              ))}
            </g>
          );
        })}

        {players.map((pl) => {
          const base = pl.pegs.filter((p) => p.pos === "BASE");
          if (base.length === 0) return null;
          const midIndex = (pl.startIndex + rules.slotsPerPlayer / 2) % totalSlots;
          const a = slotAngle(midIndex, totalSlots);
          const { x, y } = polarToXY(cx, cy, outerR + 70, a);
          return (
            <g key={`base-${pl.id}`}>
              <text x={x} y={y - 28} fontSize={12} textAnchor="middle" fill={pl.color}>{pl.name} Base</text>
              {base.map((pg, bi) => (
                <g key={pg.pegId} onClick={() => selectPeg(pl.id, pg.pegId)} className="cursor-pointer">
                  <circle cx={x + bi * 18 - (base.length - 1) * 9} cy={y} r={slotR * 0.9} fill={pl.color} stroke="#0b1020" strokeWidth={2} />
                  <text x={x + bi * 18 - (base.length - 1) * 9} y={y + 4} fontSize={9} textAnchor="middle" fill="#111">{pg.pegId}</text>
                </g>
              ))}
            </g>
          );
        })}

        {selectedPeg && (
          <text x={cx} y={cy} fontSize={14} textAnchor="middle" fill="#e2e8f0">
            Selected: {selectedPeg.playerId}/{selectedPeg.pegId} → click any slot
          </text>
        )}
      </svg>

      <div className="mt-4 flex gap-8 flex-wrap justify-center">
        {players.map((pl) => (
          <div key={pl.id} className="px-3 py-2 rounded-2xl shadow bg-white/5 border border-white/10 text-slate-200">
            <div className="font-semibold" style={{ color: pl.color }}>{pl.name}</div>
            <div className="text-xs opacity-80">Start {pl.startIndex} · Home {pl.homeEntryIndex}</div>
            <div className="mt-1 flex gap-2 flex-wrap">
              {pl.pegs.map((pg) => (
                <button
                  key={pg.pegId}
                  onClick={() => selectPeg(pl.id, pg.pegId)}
                  className={`text-xs px-2 py-1 rounded-full border ${typeof pg.pos === "number" ? "border-slate-500 opacity-60" : "border-slate-300"}`}
                >
                  {pg.pegId}: {typeof pg.pos === "number" ? `@${pg.pos}` : pg.pos}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TrackDemo() {
  return (
    <div className="w-screen h-screen bg-slate-900 text-slate-100">
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">Pegs & Jokers – SVG Track Demo</h1>
        <p className="opacity-80 text-sm">Click a peg in a BASE panel, then click a slot to move it (toy interaction)</p>
      </div>
      <Track />
    </div>
  );
}
