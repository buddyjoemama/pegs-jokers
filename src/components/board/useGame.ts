import { create } from "zustand";

export type PlayerId = string;

export type PegPos = number | "BASE" | "HOME";

export type Player = {
  id: PlayerId;
  name: string;
  color: string;
  startIndex: number;
  homeEntryIndex: number;
  pegs: { pegId: string; pos: PegPos }[];
};

export type Rules = {
  slotsPerPlayer: number;
  exactHome: boolean;
};

export type GameState = {
  players: Player[];
  rules: Rules;
  totalSlots: number;
  selectedPeg: { playerId: PlayerId; pegId: string } | null;
  selectPeg: (playerId: PlayerId, pegId: string) => void;
  moveSelectedPegTo: (slotIndex: number) => void;
  nextTurn: () => void;
};

export const useGame = create<GameState>((set, get) => {
  const playerCount = 4;
  const slotsPerPlayer = 18;
  const totalSlots = playerCount * slotsPerPlayer;

  const mkPlayer = (i: number, name: string, color: string) => {
    const startIndex = i * slotsPerPlayer;
    const homeEntryIndex = (startIndex + slotsPerPlayer - 1) % totalSlots;
    const pegs = Array.from({ length: 4 }, (_, p) => ({
      pegId: `${name[0]}${p + 1}`,
      pos: "BASE" as PegPos,
    }));
    pegs[0].pos = startIndex; // put one peg on the track
    return { id: `P${i + 1}`, name, color, startIndex, homeEntryIndex, pegs };
  };

  return {
    rules: { slotsPerPlayer, exactHome: true },
    totalSlots,
    selectedPeg: null,
    players: [
      mkPlayer(0, "Red", "#ef4444"),
      mkPlayer(1, "Blue", "#3b82f6"),
      mkPlayer(2, "Green", "#10b981"),
      mkPlayer(3, "Purple", "#a855f7"),
    ],
    selectPeg: (playerId, pegId) => set({ selectedPeg: { playerId, pegId } }),
    moveSelectedPegTo: (slotIndex) => {
      const sel = get().selectedPeg;
      if (!sel) return;
      set((state) => ({
        players: state.players.map((pl) =>
          pl.id === sel.playerId
            ? {
                ...pl,
                pegs: pl.pegs.map((pg) =>
                  pg.pegId === sel.pegId ? { ...pg, pos: slotIndex } : pg
                ),
              }
            : pl
        ),
      }));
    },
    nextTurn: () => {},
  };
});
