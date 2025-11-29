'use client';

import { useState, useEffect } from 'react';
import { useGame } from './board/useGame';
import TrackDemo from './board/TrackDemo';
import AuthDialog from './AuthDialog';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously, User } from 'firebase/auth';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LoginIcon from '@mui/icons-material/Login';
import styles from './GameLobby.module.scss';

const GameLobby: React.FC = () => {
  const { 
    gameId, 
    isConnected, 
    connectionStatus, 
    createGame, 
    joinGame, 
    leaveGame 
  } = useGame();
  
  const [user, setUser] = useState<User | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [inputGameId, setInputGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Monitor auth state
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Auto-rejoin game from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Don't auto-join if already connected
    if (isConnected || gameId) return;
    
    const storedGameId = localStorage.getItem('pegs-jokers-game-id');
    
    if (storedGameId) {
      console.log('🔄 Auto-rejoining game:', storedGameId);
      setIsJoining(true);
      joinGame(storedGameId)
        .then(() => {
          console.log('✅ Auto-rejoin successful');
        })
        .catch((error) => {
          console.error('❌ Auto-rejoin failed:', error);
          // Clear invalid game ID from localStorage
          localStorage.removeItem('pegs-jokers-game-id');
        })
        .finally(() => {
          setIsJoining(false);
        });
    }
  }, []); // Run only once on mount

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      // Sign in anonymously if not already authenticated
      if (!user) {
        if (!auth) {
          alert('Authentication not initialized');
          return;
        }
        console.log('🔐 Creating anonymous user...');
        await signInAnonymously(auth);
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const newGameId = await createGame();
      if (!newGameId) {
        alert('Failed to create game. Firebase may not be initialized.');
        return;
      }
      console.log(`🎮 Created game: ${newGameId}`);
      await navigator.clipboard.writeText(newGameId);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!inputGameId.trim()) {
      alert('Please enter a Game ID');
      return;
    }

    setIsJoining(true);
    try {
      // Sign in anonymously if not already authenticated
      if (!user) {
        if (!auth) {
          alert('Authentication not initialized');
          return;
        }
        console.log('🔐 Creating anonymous user...');
        await signInAnonymously(auth);
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await joinGame(inputGameId.trim());
      console.log(`✅ Joined game: ${inputGameId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      alert('Failed to join game. Check the Game ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const copyGameId = async () => {
    if (gameId) {
      try {
        await navigator.clipboard.writeText(gameId);
        alert('Game ID copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      if (gameId) {
        leaveGame();
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Show the game if connected
  if (isConnected && gameId) {
    return (
      <Box className={styles.gameContainer}>
        <AppBar position="static" className={styles.appBar}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🎮 Pegs & Jokers
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={gameId}
                onDelete={copyGameId}
                deleteIcon={<ContentCopyIcon />}
                className={styles.gameIdChip}
              />
              
              <Chip
                label={connectionStatus}
                color={
                  connectionStatus === 'connected' ? 'success' : 
                  connectionStatus === 'connecting' ? 'warning' : 
                  'error'
                }
                size="small"
              />
              
              {user && (
                <Chip
                  label={user.displayName || user.email}
                  avatar={
                    <Box className={styles.avatar}>
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </Box>
                  }
                  className={styles.userChip}
                />
              )}
              
              <Button
                variant="outlined"
                color="error"
                onClick={leaveGame}
                size="small"
              >
                Leave Game
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box className={styles.gameBoard}>
          <TrackDemo />
        </Box>
      </Box>
    );
  }

  // Show lobby if not connected
  return (
    <Box className={styles.lobbyContainer}>
      <Container maxWidth="sm">
        <Paper className={styles.lobbyPaper}>
          <Typography variant="h3" component="h1" className={styles.title}>
            🎮 Pegs & Jokers
          </Typography>

          {/* User info or sign in prompt */}
          {user ? (
            <Card className={styles.userInfoCard}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" className={styles.userSubtitle}>
                      Signed in as
                    </Typography>
                    <Typography variant="h6">
                      {user.displayName || user.email}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleSignOut} color="error" size="small">
                    <LogoutIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Card className={styles.signInPromptCard}>
              <CardContent>
                <Typography variant="body1" align="center" gutterBottom>
                  Sign in to save your progress (optional)
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  onClick={() => setAuthDialogOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Sign In / Sign Up
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create new game */}
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            startIcon={<AddCircleIcon />}
            onClick={handleCreateGame}
            disabled={isCreating || connectionStatus === 'connecting'}
            className={styles.createButton}
          >
            {isCreating ? 'Creating...' : 'Create New Game'}
          </Button>
          
          <Typography variant="caption" className={styles.createButtonCaption}>
            Create a game and share the ID with friends
          </Typography>

          <Divider className={styles.divider}>
            <Typography variant="body2" className={styles.dividerText}>
              OR
            </Typography>
          </Divider>

          {/* Join existing game */}
          <Typography variant="subtitle1" className={styles.sectionTitle}>
            Join Existing Game
          </Typography>
          
          <TextField
            fullWidth
            label="Game ID"
            placeholder="Enter Game ID (e.g., -O7XnF8...)"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            disabled={connectionStatus === 'connecting'}
            onKeyDown={(e) => e.key === 'Enter' && inputGameId.trim() && handleJoinGame()}
            className={styles.gameIdInput}
          />
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleJoinGame}
            disabled={!inputGameId.trim() || isJoining || connectionStatus === 'connecting'}
            className={styles.joinButton}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </Button>
          
          <Typography variant="caption" className={styles.joinButtonCaption}>
            Enter the Game ID shared by your friend
          </Typography>

          {/* Connection status */}
          {connectionStatus !== 'disconnected' && (
            <Card className={styles.connectionCard}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    className={`${styles.connectionIndicator} ${
                      connectionStatus === 'connected' ? styles.connected :
                      connectionStatus === 'connecting' ? styles.connecting :
                      styles.disconnected
                    }`}
                  />
                  <Typography variant="body2">
                    {connectionStatus === 'connecting' ? 'Connecting to Firebase...' : connectionStatus}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className={styles.instructionsCard}>
            <CardContent>
              <Typography variant="subtitle2" className={styles.instructionsTitle}>
                How to play multiplayer:
              </Typography>
              <Typography variant="caption" component="div" className={styles.instructionsText}>
                1. One player creates a game and shares the Game ID<br />
                2. Other players join using that Game ID<br />
                3. All moves sync in real-time across all players!
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Container>

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onAuthSuccess={() => {
          console.log('Authentication successful');
        }}
      />
    </Box>
  );
};

export default GameLobby;