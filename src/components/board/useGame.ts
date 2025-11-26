import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { database } from "@/lib/firebase";
import { ref, set as firebaseSet, onValue, off, push, serverTimestamp, DatabaseReference } from "firebase/database";

export type PlayerId = string;

export type PegPos = number | "HOME" | "SAFE";

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
  
  // Local-only UI state (not synced to Firebase)
  selectPeg: (playerId: PlayerId, pegId: string) => void;
  moveSelectedPegTo: (slotIndex: number) => void;
  nextTurn: () => void;
  
  // Debug functions
  addPlayer: () => void;
  removePlayer: () => void;
  resetGame: () => void;
  
  // Firebase integration
  gameId: string | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Firebase methods
  createGame: () => Promise<string | null>;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  syncToFirebase: () => Promise<void>;
};

export const useGame = create<GameState>()(
  immer((set, get) => {
    const playerCount = 4;
    const slotsPerPlayer = 18;
    const totalSlots = playerCount * slotsPerPlayer;
    
    // Firebase connection state
    let gameRef: DatabaseReference | null = null;
    let gameListener: (() => void) | null = null;

    const mkPlayer = (i: number, name: string, color: string): Player => {
      const startIndex = i * slotsPerPlayer + 1; // 1-based: lane starts at 1, 19, 37, 55...
      const safeEntryIndex = startIndex + 3; // Safe starts at position 4 of lane (1-based)
      const pegs = Array.from({ length: 5 }, (_, p) => ({
        pegId: `${name[0]}${p + 1}`,
        pos: "HOME" as PegPos, // All pegs start in HOME
      }));
      return { id: `P${i + 1}`, name, color, startIndex, homeEntryIndex: safeEntryIndex, pegs };
    };

    const getInitialPlayers = () => [
      mkPlayer(0, "Red", "#ef4444"),
      mkPlayer(1, "Blue", "#3b82f6"),
      mkPlayer(2, "Green", "#10b981"),
      mkPlayer(3, "Purple", "#a855f7"),
    ];

    return {
      // Game state
      rules: { slotsPerPlayer, exactHome: true },
      totalSlots,
      selectedPeg: null,
      players: getInitialPlayers(),
      
      // Firebase state
      gameId: null,
      isConnected: false,
      connectionStatus: 'disconnected' as const,
      
      // Local actions (UI only - not synced)
      selectPeg: (playerId, pegId) =>
        set((state) => {
          state.selectedPeg = { playerId, pegId };
        }),
      
      // Game actions (synced to Firebase)
      moveSelectedPegTo: async (slotIndex) => {
        const state = get();
        const sel = state.selectedPeg;
        if (!sel) return;
        
        // Update local state optimistically
        set((state) => {
          const player = state.players.find((p) => p.id === sel.playerId);
          if (!player) return;
          const peg = player.pegs.find((pg) => pg.pegId === sel.pegId);
          if (peg) {
            peg.pos = slotIndex;
          }
          state.selectedPeg = null; // Clear selection after move
        });
        
        // Sync to Firebase
        if (state.gameId && gameRef && database) {
          try {
            const updatedState = get();
            await firebaseSet(ref(database, `games/${state.gameId}/players`), updatedState.players);
            
            // Also log the move for game history
            const moveRef = push(ref(database, `games/${state.gameId}/moves`));
            await firebaseSet(moveRef, {
              playerId: sel.playerId,
              pegId: sel.pegId,
              newPosition: slotIndex,
              timestamp: serverTimestamp(),
            });
            
            console.log(`🔥 Move synced to Firebase: ${sel.pegId} → ${slotIndex}`);
          } catch (error) {
            console.error('❌ Failed to sync move to Firebase:', error);
            // Could implement rollback logic here if needed
          }
        }
      },
      
      nextTurn: () => {
        // TODO: implement turn rotation logic
        // This would also sync to Firebase when implemented
      },
      
      // Debug functions
      addPlayer: () => {
        set((state) => {
          const colors = ["#ef4444", "#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
          const names = ["Red", "Blue", "Green", "Purple", "Orange", "Pink", "Violet", "Cyan"];
          const playerIndex = state.players.length;
          if (playerIndex >= 8) return; // Max 8 players
          
          const newPlayer = mkPlayer(playerIndex, names[playerIndex], colors[playerIndex]);
          state.players.push(newPlayer);
          
          // Recalculate total slots
          state.totalSlots = state.players.length * state.rules.slotsPerPlayer;
        });
      },
      
      removePlayer: () => {
        set((state) => {
          if (state.players.length <= 2) return; // Minimum 2 players
          state.players.pop();
          state.totalSlots = state.players.length * state.rules.slotsPerPlayer;
          state.selectedPeg = null;
        });
      },
      
      resetGame: () => {
        set((state) => {
          // Move all pegs back to HOME
          state.players.forEach(player => {
            player.pegs.forEach(peg => {
              peg.pos = "HOME";
            });
          });
          state.selectedPeg = null;
        });
      },
      
      // Firebase methods
      createGame: async () => {
        if (!database) {
          console.error('Firebase database not initialized');
          return null;
        }
        
        try {
          set((state) => {
            state.connectionStatus = 'connecting';
          });
          
          // Create new game in Firebase
          const gamesRef = ref(database, 'games');
          const newGameRef = push(gamesRef);
          const gameId = newGameRef.key!;
          
          const initialGameState = {
            rules: { slotsPerPlayer, exactHome: true },
            totalSlots,
            players: getInitialPlayers(),
            currentTurn: 0,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            status: 'waiting', // waiting, playing, finished
          };
          
          await firebaseSet(newGameRef, initialGameState);
          
          set((state) => {
            state.gameId = gameId;
            state.connectionStatus = 'connected';
            state.isConnected = true;
          });
          
          console.log(`🎮 Created new game: ${gameId}`);
          return gameId;
        } catch (error) {
          console.error('❌ Failed to create game:', error);
          set((state) => {
            state.connectionStatus = 'error';
          });
          throw error;
        }
      },
      
      joinGame: async (gameId: string) => {
        if (!database) {
          console.error('Firebase database not initialized');
          return;
        }
        
        try {
          set((state) => {
            state.connectionStatus = 'connecting';
          });
          
          gameRef = ref(database, `games/${gameId}`);
          
          // Set up real-time listener for game state changes
          gameListener = onValue(gameRef, (snapshot) => {
            const gameData = snapshot.val();
            if (gameData) {
              console.log('🔄 Game state updated from Firebase');
              set((state) => {
                // Update game state from Firebase (except selectedPeg which is local)
                state.players = gameData.players || state.players;
                state.rules = gameData.rules || state.rules;
                state.totalSlots = gameData.totalSlots || state.totalSlots;
                // Don't update selectedPeg - it's local UI state
              });
            }
          }, (error) => {
            console.error('❌ Firebase listener error:', error);
            set((state) => {
              state.connectionStatus = 'error';
              state.isConnected = false;
            });
          });
          
          set((state) => {
            state.gameId = gameId;
            state.connectionStatus = 'connected';
            state.isConnected = true;
          });
          
          console.log(`✅ Joined game ${gameId}`);
        } catch (error) {
          console.error('❌ Failed to join game:', error);
          set((state) => {
            state.connectionStatus = 'error';
            state.isConnected = false;
          });
          throw error;
        }
      },
      
      leaveGame: () => {
        // Remove Firebase listener
        if (gameListener) {
          gameListener();
          gameListener = null;
        }
        
        // Clean up references
        gameRef = null;
        
        // Reset state
        set((state) => {
          state.gameId = null;
          state.isConnected = false;
          state.connectionStatus = 'disconnected';
          state.selectedPeg = null;
          // Reset to initial game state
          state.players = getInitialPlayers();
        });
        
        console.log('🚪 Left the game');
      },
      
      syncToFirebase: async () => {
        const state = get();
        if (!state.gameId || !gameRef) {
          console.warn('⚠️ Cannot sync: not connected to a game');
          return;
        }
        
        try {
          const syncData = {
            players: state.players,
            rules: state.rules,
            totalSlots: state.totalSlots,
            lastUpdated: serverTimestamp(),
          };
          
          await firebaseSet(gameRef, syncData);
          console.log('🔥 Game state synced to Firebase');
        } catch (error) {
          console.error('❌ Failed to sync to Firebase:', error);
          throw error;
        }
      },
    };
  })
);
