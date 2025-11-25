import { act, renderHook } from '@testing-library/react';
import { useGame } from '../useGame';
import type { GameState, Player, PegPos } from '../useGame';

describe('useGame', () => {
  // Helper to get fresh store instance for each test
  const renderGameHook = () => renderHook(() => useGame());

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderGameHook();
      const state = result.current;

      expect(state.totalSlots).toBe(72);
      expect(state.selectedPeg).toBeNull();
      expect(state.rules).toEqual({
        slotsPerPlayer: 18,
        exactHome: true,
      });
    });

    it('should initialize with 4 players', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      expect(players).toHaveLength(4);
      expect(players.map(p => p.name)).toEqual(['Red', 'Blue', 'Green', 'Purple']);
      expect(players.map(p => p.id)).toEqual(['P1', 'P2', 'P3', 'P4']);
    });

    it('should set correct start and home entry indices for each player', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      // Player 1: start=0, home=17
      expect(players[0].startIndex).toBe(0);
      expect(players[0].homeEntryIndex).toBe(17);

      // Player 2: start=18, home=35  
      expect(players[1].startIndex).toBe(18);
      expect(players[1].homeEntryIndex).toBe(35);

      // Player 3: start=36, home=53
      expect(players[2].startIndex).toBe(36);
      expect(players[2].homeEntryIndex).toBe(53);

      // Player 4: start=54, home=71
      expect(players[3].startIndex).toBe(54);
      expect(players[3].homeEntryIndex).toBe(71);
    });

    it('should initialize each player with 4 pegs', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      players.forEach(player => {
        expect(player.pegs).toHaveLength(4);
        
        // Check peg IDs follow pattern
        const expectedPegIds = [
          `${player.name[0]}1`,
          `${player.name[0]}2`, 
          `${player.name[0]}3`,
          `${player.name[0]}4`
        ];
        expect(player.pegs.map(p => p.pegId)).toEqual(expectedPegIds);
      });
    });

    it('should place first peg of each player on their start position', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      players.forEach(player => {
        // First peg should be on start index
        expect(player.pegs[0].pos).toBe(player.startIndex);
        
        // Other pegs should be in BASE
        player.pegs.slice(1).forEach(peg => {
          expect(peg.pos).toBe('BASE');
        });
      });
    });
  });

  describe('selectPeg Action', () => {
    it('should select a peg correctly', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.selectPeg('P1', 'R2');
      });

      expect(result.current.selectedPeg).toEqual({
        playerId: 'P1',
        pegId: 'R2'
      });
    });

    it('should overwrite previously selected peg', () => {
      const { result } = renderGameHook();

      // Select first peg
      act(() => {
        result.current.selectPeg('P1', 'R1');
      });

      expect(result.current.selectedPeg).toEqual({
        playerId: 'P1',
        pegId: 'R1'
      });

      // Select different peg
      act(() => {
        result.current.selectPeg('P2', 'B3');
      });

      expect(result.current.selectedPeg).toEqual({
        playerId: 'P2',
        pegId: 'B3'
      });
    });
  });

  describe('moveSelectedPegTo Action', () => {
    it('should move selected peg to specified slot', () => {
      const { result } = renderGameHook();

      // First select a peg
      act(() => {
        result.current.selectPeg('P1', 'R2');
      });

      // Move it to slot 10
      act(() => {
        result.current.moveSelectedPegTo(10);
      });

      // Find the moved peg
      const player1 = result.current.players.find(p => p.id === 'P1');
      const movedPeg = player1?.pegs.find(p => p.pegId === 'R2');

      expect(movedPeg?.pos).toBe(10);
    });

    it('should not move peg if none is selected', () => {
      const { result } = renderGameHook();
      
      // Get a fresh store instance and ensure no selection
      const initialPlayersState = JSON.parse(JSON.stringify(result.current.players));
      
      // Call moveSelectedPegTo when selectedPeg is null (or invalid)
      // This simulates the case where no peg is actually selected
      act(() => {
        // Temporarily override selectedPeg to null and then try to move
        result.current.selectPeg('', ''); // Invalid selection
        const currentSelection = result.current.selectedPeg;
        
        // Now try to move - should not work because selection is invalid
        result.current.moveSelectedPegTo(15);
      });

      // Since the selection was invalid, no pegs should have moved
      // We'll check that the player positions remain the same
      const playersAfterInvalidMove = result.current.players;
      
      // The key is that no valid peg should have moved to position 15
      let pegMovedToPosition15 = false;
      playersAfterInvalidMove.forEach(player => {
        player.pegs.forEach(peg => {
          if (peg.pos === 15) {
            pegMovedToPosition15 = true;
          }
        });
      });
      
      expect(pegMovedToPosition15).toBe(false);
    });

    it('should handle moving peg from BASE to track', () => {
      const { result } = renderGameHook();

      // Select a peg that's in BASE
      act(() => {
        result.current.selectPeg('P1', 'R3'); // R3 should be in BASE
      });

      // Verify it's in BASE initially
      const player1Before = result.current.players.find(p => p.id === 'P1');
      const pegBefore = player1Before?.pegs.find(p => p.pegId === 'R3');
      expect(pegBefore?.pos).toBe('BASE');

      // Move to track position
      act(() => {
        result.current.moveSelectedPegTo(5);
      });

      // Verify it moved
      const player1After = result.current.players.find(p => p.id === 'P1');
      const pegAfter = player1After?.pegs.find(p => p.pegId === 'R3');
      expect(pegAfter?.pos).toBe(5);
    });

    it('should handle moving peg to HOME', () => {
      const { result } = renderGameHook();

      // Select a peg on the track
      act(() => {
        result.current.selectPeg('P1', 'R1'); // R1 should be on start position
      });

      // Move to HOME
      act(() => {
        result.current.moveSelectedPegTo('HOME' as any); // Type assertion for test
      });

      const player1 = result.current.players.find(p => p.id === 'P1');
      const movedPeg = player1?.pegs.find(p => p.pegId === 'R1');
      expect(movedPeg?.pos).toBe('HOME');
    });

    it('should not affect other players pegs', () => {
      const { result } = renderGameHook();
      
      // Get initial state of player 2
      const player2Before = result.current.players.find(p => p.id === 'P2');
      
      // Move player 1's peg
      act(() => {
        result.current.selectPeg('P1', 'R2');
      });
      
      act(() => {
        result.current.moveSelectedPegTo(25);
      });

      // Player 2 should be unchanged
      const player2After = result.current.players.find(p => p.id === 'P2');
      expect(player2After).toEqual(player2Before);
    });

    it('should handle moving non-existent peg gracefully', () => {
      const { result } = renderGameHook();
      const initialState = result.current.players;

      // Select non-existent peg
      act(() => {
        result.current.selectPeg('P1', 'INVALID_PEG');
      });

      act(() => {
        result.current.moveSelectedPegTo(10);
      });

      // State should remain unchanged (except selectedPeg)
      expect(result.current.players).toEqual(initialState);
    });
  });

  describe('Player Configuration', () => {
    it('should assign correct colors to players', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      expect(players[0].color).toBe('#ef4444'); // Red
      expect(players[1].color).toBe('#3b82f6'); // Blue  
      expect(players[2].color).toBe('#10b981'); // Green
      expect(players[3].color).toBe('#a855f7'); // Purple
    });

    it('should have correct peg naming convention', () => {
      const { result } = renderGameHook();
      const { players } = result.current;

      // Red player should have R1, R2, R3, R4
      expect(players[0].pegs.map(p => p.pegId)).toEqual(['R1', 'R2', 'R3', 'R4']);
      
      // Blue player should have B1, B2, B3, B4
      expect(players[1].pegs.map(p => p.pegId)).toEqual(['B1', 'B2', 'B3', 'B4']);
      
      // Green player should have G1, G2, G3, G4
      expect(players[2].pegs.map(p => p.pegId)).toEqual(['G1', 'G2', 'G3', 'G4']);
      
      // Purple player should have P1, P2, P3, P4
      expect(players[3].pegs.map(p => p.pegId)).toEqual(['P1', 'P2', 'P3', 'P4']);
    });
  });

  describe('Game Rules', () => {
    it('should have correct slots per player calculation', () => {
      const { result } = renderGameHook();
      const { rules, totalSlots } = result.current;

      expect(rules.slotsPerPlayer).toBe(18);
      expect(totalSlots).toBe(72); // 4 players * 18 slots
    });

    it('should have exactHome rule enabled by default', () => {
      const { result } = renderGameHook();
      const { rules } = result.current;

      expect(rules.exactHome).toBe(true);
    });
  });

  describe('nextTurn Action', () => {
    it('should exist but not throw when called', () => {
      const { result } = renderGameHook();

      expect(() => {
        act(() => {
          result.current.nextTurn();
        });
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should support full peg movement workflow', () => {
      const { result } = renderGameHook();

      // 1. Select a peg
      act(() => {
        result.current.selectPeg('P1', 'R2');
      });

      expect(result.current.selectedPeg).toEqual({
        playerId: 'P1',
        pegId: 'R2'
      });

      // 2. Move the peg
      act(() => {
        result.current.moveSelectedPegTo(42);
      });

      // 3. Verify the move
      const player1 = result.current.players.find(p => p.id === 'P1');
      const movedPeg = player1?.pegs.find(p => p.pegId === 'R2');
      expect(movedPeg?.pos).toBe(42);
    });

    it('should support multiple moves in sequence', () => {
      const { result } = renderGameHook();

      // Move multiple pegs
      const moves = [
        { playerId: 'P1', pegId: 'R2', position: 10 },
        { playerId: 'P2', pegId: 'B1', position: 25 },
        { playerId: 'P3', pegId: 'G4', position: 50 },
      ];

      moves.forEach(move => {
        act(() => {
          result.current.selectPeg(move.playerId, move.pegId);
        });

        act(() => {
          result.current.moveSelectedPegTo(move.position);
        });
      });

      // Verify all moves
      moves.forEach(move => {
        const player = result.current.players.find(p => p.id === move.playerId);
        const peg = player?.pegs.find(p => p.pegId === move.pegId);
        expect(peg?.pos).toBe(move.position);
      });
    });
  });
});