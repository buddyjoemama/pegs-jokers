'use client';

import { useState, useEffect } from 'react';
import { useGame } from './board/useGame';
import TrackDemo from './board/TrackDemo';
import AuthDialog from './AuthDialog';
import { auth, database } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
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
    leaveGame,
    getUserGames 
  } = useGame();
  
  const [user, setUser] = useState<User | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [playerCountDialogOpen, setPlayerCountDialogOpen] = useState(false);
  const [gamesListDialogOpen, setGamesListDialogOpen] = useState(false);
  const [userGames, setUserGames] = useState<Array<{ id: string; createdAt: number; maxPlayers: number; status: string }>>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(4);
  const [inputGameId, setInputGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Monitor auth state
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Load user's games when they sign in
      if (currentUser && !currentUser.isAnonymous) {
        loadUserGames();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserGames = async () => {
    try {
      const games = await getUserGames();
      setUserGames(games);
    } catch (error) {
      console.error('Failed to load user games:', error);
    }
  };

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
          setErrorMessage(null);
        })
        .catch((error) => {
          console.error('❌ Auto-rejoin failed:', error);
          setErrorMessage(error.message || 'Failed to rejoin game');
          // Clear invalid game ID from localStorage
          localStorage.removeItem('pegs-jokers-game-id');
        })
        .finally(() => {
          setIsJoining(false);
        });
    }
  }, []); // Run only once on mount

  const handleCreateGame = async () => {
    // Open dialog to select player count
    setPlayerCountDialogOpen(true);
  };

  const handleConfirmCreateGame = async () => {
    setPlayerCountDialogOpen(false);
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

      const newGameId = await createGame(selectedPlayerCount);
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
      // Check if game exists before creating anonymous user
      if (!database) {
        throw new Error('Firebase database not initialized');
      }
      
      const gameRef = ref(database, `games/${inputGameId.trim()}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Game '${inputGameId.trim()}' does not exist`);
      }

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
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Failed to join game:', error);
      setErrorMessage(error.message || 'Failed to join game. Check the Game ID and try again.');
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

  const handleOpenGamesList = async () => {
    setLoadingGames(true);
    setGamesListDialogOpen(true);
    try {
      const games = await getUserGames();
      setUserGames(games);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleJoinSelectedGame = async (selectedGameId: string) => {
    setGamesListDialogOpen(false);
    setIsJoining(true);
    try {
      await joinGame(selectedGameId);
      console.log(`✅ Joined game: ${selectedGameId}`);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Failed to join game:', error);
      setErrorMessage(error.message || 'Failed to join game.');
    } finally {
      setIsJoining(false);
    }
  };

  // Render game board view
  const renderGameBoard = () => (
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
                label={user.isAnonymous ? 'Guest' : (user.displayName || user.email)}
                avatar={
                  <Box className={styles.avatar}>
                    {user.isAnonymous ? '?' : (user.displayName || user.email || 'U')[0].toUpperCase()}
                  </Box>
                }
                onClick={user.isAnonymous ? undefined : handleOpenGamesList}
                className={styles.userChip}
                sx={{ cursor: user.isAnonymous ? 'default' : 'pointer' }}
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

  // Render lobby view
  const renderLobby = () => (
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
                      {user.isAnonymous ? 'Playing as Guest' : 'Signed in as'}
                    </Typography>
                    <Typography variant="h6">
                      {user.isAnonymous ? 'Anonymous User' : (user.displayName || user.email)}
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

          {/* User's existing games - only show for non-anonymous users */}
          {user && !user.isAnonymous && userGames.length > 0 && (
            <>
              <Divider className={styles.divider}>
                <Typography variant="body2" className={styles.dividerText}>
                  YOUR GAMES
                </Typography>
              </Divider>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Rejoin Your Games
                  </Typography>
                  <List dense>
                    {userGames.slice(0, 5).map((game) => (
                      <ListItem key={game.id} disablePadding>
                        <ListItemButton onClick={() => handleJoinSelectedGame(game.id)}>
                          <ListItemText
                            primary={`Game ${game.id.substring(0, 10)}...`}
                            secondary={`${game.maxPlayers} players • ${game.status}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                  {userGames.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                      Showing 5 of {userGames.length} games
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </>
          )}

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
            onChange={(e) => {
              setInputGameId(e.target.value);
              setErrorMessage(null);
            }}
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

          {/* Connection status or error */}
          {(connectionStatus !== 'disconnected' || errorMessage) && (
            <Card className={styles.connectionCard}>
              <CardContent>
                {errorMessage ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box className={`${styles.connectionIndicator} ${styles.disconnected}`} />
                    <Typography variant="body2" color="error">
                      {errorMessage}
                    </Typography>
                  </Stack>
                ) : (
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
                )}
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

      {/* Player Count Selection Dialog */}
      <Dialog
        open={playerCountDialogOpen}
        onClose={() => setPlayerCountDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select Number of Players</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="player-count-label">Number of Players</InputLabel>
            <Select
              labelId="player-count-label"
              value={selectedPlayerCount}
              label="Number of Players"
              onChange={(e) => setSelectedPlayerCount(Number(e.target.value))}
            >
              <MenuItem value={4}>4 Players</MenuItem>
              <MenuItem value={5}>5 Players</MenuItem>
              <MenuItem value={6}>6 Players</MenuItem>
              <MenuItem value={7}>7 Players</MenuItem>
              <MenuItem value={8}>8 Players</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            You will be Player 1. Other slots will be filled by computer players until real players join.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayerCountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmCreateGame} variant="contained" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Game'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <>
      {isConnected && gameId ? renderGameBoard() : renderLobby()}
      
      {/* User Games List Dialog - Always rendered */}
      <Dialog
        open={gamesListDialogOpen}
        onClose={() => setGamesListDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 9999 }}
      >
        <DialogTitle>Your Games</DialogTitle>
        <DialogContent>
          {loadingGames ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : userGames.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No games found. Create a new game to get started!
            </Typography>
          ) : (
            <List>
              {userGames.map((game) => (
                <ListItem key={game.id} disablePadding>
                  <ListItemButton onClick={() => handleJoinSelectedGame(game.id)}>
                    <ListItemText
                      primary={`Game ${game.id.substring(0, 8)}...`}
                      secondary={`${game.maxPlayers} players • ${game.status} • ${new Date(game.createdAt).toLocaleDateString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGamesListDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GameLobby;