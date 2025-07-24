// Real Multisynq Model for Duel Game
declare var Multisynq: any;

export class DuelModel extends Multisynq.Model {
  init() {
    // Initialize game state
    this.players = {};
    this.scores = {};
    this.timeLeft = 60;
    this.winner = null;
    this.gameStarted = false;
    
    // Subscribe to game events
    this.subscribe("duel", "incrementScore", this.handleIncrementScore);
    this.subscribe("duel", "startGame", this.handleStartGame);
    this.subscribe("duel", "reset", this.handleReset);
    
    // Initialize players based on identities in the session
    const identities = this.session?.identities || [];
    console.log("Initializing DuelModel with identities:", identities);
    
    identities.forEach((identity: string) => {
      this.players[identity] = {
        score: 0,
        name: identity
      };
      this.scores[identity] = 0;
    });
    
    console.log("DuelModel initialized with players:", this.players);
  }

  handleStartGame() {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.timeLeft = 60;
      this.winner = null;
      
      // Reset scores
      Object.keys(this.scores).forEach(playerId => {
        this.scores[playerId] = 0;
        if (this.players[playerId]) {
          this.players[playerId].score = 0;
        }
      });
      
      // Start the game timer
      this.future(1000).tick();
      console.log("Game started!");
    }
  }

  tick() {
    if (this.gameStarted && this.timeLeft > 0) {
      this.timeLeft -= 1;
      
      // Check if time is up
      if (this.timeLeft === 0) {
        this.endGame();
      } else {
        // Schedule next tick
        this.future(1000).tick();
      }
    }
  }

  handleIncrementScore(data: { playerId: string }) {
    const playerId = data.playerId;
    
    // Only allow scoring if game is active and time is left
    if (this.gameStarted && this.timeLeft > 0 && this.scores.hasOwnProperty(playerId)) {
      this.scores[playerId] = (this.scores[playerId] || 0) + 1;
      
      // Also update in players object for consistency
      if (this.players[playerId]) {
        this.players[playerId].score = this.scores[playerId];
      }
      
      console.log(`Score updated for ${playerId}: ${this.scores[playerId]}`);
    }
  }

  endGame() {
    this.gameStarted = false;
    
    // Determine winner based on highest score
    const playerIds = Object.keys(this.scores);
    let highestScore = -1;
    let winner = null;
    let tie = false;
    
    playerIds.forEach(playerId => {
      const score = this.scores[playerId];
      if (score > highestScore) {
        highestScore = score;
        winner = playerId;
        tie = false;
      } else if (score === highestScore && highestScore >= 0) {
        tie = true;
      }
    });
    
    // Set winner (null if tie)
    this.winner = tie ? 'TIE' : winner;
    
    console.log("Game ended. Winner:", this.winner);
  }

  handleReset() {
    this.gameStarted = false;
    this.timeLeft = 60;
    this.winner = null;
    
    // Reset all scores
    Object.keys(this.scores).forEach(playerId => {
      this.scores[playerId] = 0;
      if (this.players[playerId]) {
        this.players[playerId].score = 0;
      }
    });
    
    console.log("Game reset");
  }
}

// Register the model with Multisynq
DuelModel.register("DuelModel");
