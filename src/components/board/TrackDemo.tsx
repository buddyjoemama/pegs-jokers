"use client";
import React from "react";
import { motion } from "framer-motion";
import { useGame, Player } from "./useGame";
import { slotAngle, polarToXY, getTrackLayout } from "./geometry";

const Track: React.FC<{ size?: number }> = ({ size = 720 }) => {
  const { players, rules, totalSlots, selectedPeg, selectPeg, moveSelectedPegTo, addPlayer, removePlayer, resetGame } = useGame();

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const slotR = size * 0.012;

  const playerCount = players.length;
  const slotSpacing = (outerR * 2 * Math.PI) / totalSlots; // Calculate spacing based on track circumference
  const spacing = slotSpacing; // Use same spacing as track slots for consistency
  
  // Get complete track layout
  const trackLayout = getTrackLayout(playerCount, cx, cy, outerR, spacing);
  const { mainTrack, homes, safes } = trackLayout;

  const Marker = ({ position, label, stroke = "#111", color = "#111" } : { position: {x: number, y: number}, label: string, stroke?: string, color?: string }) => {
    const { x, y } = position;
    return (
      <g>
        <circle cx={x} cy={y} r={slotR * 1.4} fill="none" stroke={stroke} strokeWidth={2} />
        <text x={x} y={y - slotR * 1.8} fontSize={12} textAnchor="middle" fill={color}>{label}</text>
      </g>
    );
  };

  const pegsOnSlot = new Map<number, { player: Player; pegId: string }[]>();
  const pegsInHome = new Map<number, { player: Player; pegId: string }[]>();
  const pegsInSafe = new Map<number, { player: Player; pegId: string }[]>();
  
  players.forEach((pl) =>
    pl.pegs.forEach((pg) => {
      if (typeof pg.pos === "number") {
        const arr = pegsOnSlot.get(pg.pos) ?? [];
        arr.push({ player: pl, pegId: pg.pegId });
        pegsOnSlot.set(pg.pos, arr);
      } else if (pg.pos === "HOME") {
        const playerIdx = players.indexOf(pl);
        const arr = pegsInHome.get(playerIdx) ?? [];
        arr.push({ player: pl, pegId: pg.pegId });
        pegsInHome.set(playerIdx, arr);
      } else if (pg.pos === "SAFE") {
        const playerIdx = players.indexOf(pl);
        const arr = pegsInSafe.get(playerIdx) ?? [];
        arr.push({ player: pl, pegId: pg.pegId });
        pegsInSafe.set(playerIdx, arr);
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

        {/* Polygon outline */}
        <polygon
          points={Array.from({ length: playerCount }, (_, i) => {
            const a = slotAngle(i, playerCount);
            const { x, y } = polarToXY(cx, cy, outerR, a);
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke="#334155"
          strokeWidth={8}
        />

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

        {/* Main track slots */}
        {mainTrack.map((slot) => (
          <g key={`slot-${slot.index}`} className="cursor-pointer" onClick={() => moveSelectedPegTo(slot.index)}>
            <circle cx={slot.x} cy={slot.y} r={slotR} fill="#0ea5e9" opacity={0.15} />
            <circle cx={slot.x} cy={slot.y} r={slotR * 0.5} fill="#94a3b8" />
            <text x={slot.x} y={slot.y + slotR * 2.4} fontSize={9} textAnchor="middle" fill="#64748b" opacity={0}>{slot.index}</text>
          </g>
        ))}

        {/* HOME areas (cross shape) */}
        {homes.map((home, idx) => {
          const pl = players[idx];
          return (
            <g key={`home-${idx}`}>
              {home.positions.map((pos, posIdx) => (
                <g key={`home-${idx}-${posIdx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={slotR}
                    fill={pl.color}
                    opacity={0.15}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={slotR * 0.5}
                    fill={pl.color}
                    fillOpacity={0.6}
                    stroke={pl.color}
                    strokeWidth={1}
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* SAFE areas (L shape) */}
        {safes.map((safe, idx) => {
          const pl = players[idx];
          return (
            <g key={`safe-${idx}`}>
              {safe.positions.map((pos, posIdx) => (
                <g key={`safe-${idx}-${posIdx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={slotR}
                    fill="#10b981"
                    opacity={0.15}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={slotR * 0.5}
                    fill="#10b981"
                    fillOpacity={0.6}
                    stroke={pl.color}
                    strokeWidth={1}
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* Player markers */}
        {players.map((pl) => {
          const startSlot = mainTrack.find(s => s.index === pl.startIndex);
          const safeSlot = mainTrack.find(s => s.index === pl.homeEntryIndex);
          return (
            <g key={`markers-${pl.id}`}>
              {/* Markers removed for cleaner appearance */}
            </g>
          );
        })}

        {/* Pegs on main track */}
        {Array.from(pegsOnSlot.entries()).map(([slot, items]) => {
          const slotPos = mainTrack.find(s => s.index === slot);
          if (!slotPos) return null;
          return (
            <g key={`slot-pegs-${slot}`}>
              {items.map((it, idx) => {
                const isSelected = selectedPeg?.playerId === it.player.id && selectedPeg?.pegId === it.pegId;
                return (
                  <g key={`${slot}-${it.pegId}`}>
                    {isSelected && (
                      <motion.circle
                        cx={slotPos.x}
                        cy={slotPos.y}
                        r={slotR * 1.3}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={3}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      />
                    )}
                    <motion.circle
                      cx={slotPos.x}
                      cy={slotPos.y}
                      r={slotR * 0.8}
                      fill={it.player.color}
                      stroke="#0b1020"
                      strokeWidth={2}
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="cursor-pointer"
                      onClick={() => selectPeg(it.player.id, it.pegId)}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Pegs in HOME */}
        {Array.from(pegsInHome.entries()).map(([playerIdx, items]) => {
          const homePositions = homes[playerIdx].positions;
          return (
            <g key={`home-pegs-${playerIdx}`}>
              {items.map((it, idx) => {
                const pos = homePositions[idx % homePositions.length];
                const isSelected = selectedPeg?.playerId === it.player.id && selectedPeg?.pegId === it.pegId;
                return (
                  <g key={`home-${it.pegId}`}>
                    {isSelected && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={slotR * 0.6}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={3}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      />
                    )}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={slotR * 0.111}
                      fill={it.player.color}
                      stroke={it.player.color}
                      strokeWidth={2}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="cursor-pointer"
                      onClick={() => selectPeg(it.player.id, it.pegId)}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Pegs in SAFE */}
        {Array.from(pegsInSafe.entries()).map(([playerIdx, items]) => {
          const safePositions = safes[playerIdx].positions;
          return (
            <g key={`safe-pegs-${playerIdx}`}>
              {items.map((it, idx) => {
                const pos = safePositions[idx % safePositions.length];
                const isSelected = selectedPeg?.playerId === it.player.id && selectedPeg?.pegId === it.pegId;
                return (
                  <g key={`safe-${it.pegId}`}>
                    {isSelected && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={slotR * 1.3}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={3}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      />
                    )}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={slotR * 0.8}
                      fill={it.player.color}
                      stroke="#0b1020"
                      strokeWidth={2}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="cursor-pointer"
                      onClick={() => selectPeg(it.player.id, it.pegId)}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {selectedPeg && (
          <text x={cx} y={cy} fontSize={14} textAnchor="middle" fill="#e2e8f0">
            Selected: {selectedPeg.playerId}/{selectedPeg.pegId} → click any slot
          </text>
        )}
      </svg>

      <div className="mt-4 flex gap-4 justify-center">
        <button
          onClick={addPlayer}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Add Player
        </button>
        <button
          onClick={removePlayer}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          Remove Player
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Reset Game
        </button>
      </div>

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
      <Track />
    </div>
  );
}
