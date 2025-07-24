// Real Multisynq View for Duel Game
declare var Multisynq: any;

export class DuelView extends Multisynq.View {
  private updateCallback?: () => void;

  constructor(model: any) {
    super(model);
    this.model = model;
    console.log("DuelView initialized");
  }

  // Set a callback function to trigger React component updates
  setUpdateCallback(callback: () => void) {
    this.updateCallback = callback;
  }

  // Called when model state changes
  update() {
    super.update();
    console.log("DuelView update called, model state:", {
      timeLeft: this.model.timeLeft,
      scores: this.model.scores,
      winner: this.model.winner,
      gameStarted: this.model.gameStarted
    });
    
    // Trigger React component re-render
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  // Handle stare button click
  handleStareClick() {
    const currentPlayer = this.session?.identity;
    if (currentPlayer && this.model.gameStarted && this.model.timeLeft > 0) {
      console.log(`Publishing incrementScore for player: ${currentPlayer}`);
      this.publish("duel", "incrementScore", { playerId: currentPlayer });
    }
  }

  // Start the game
  startGame() {
    console.log("Starting game via view");
    this.publish("duel", "startGame");
  }

  // Reset the game
  resetGame() {
    console.log("Resetting game via view");
    this.publish("duel", "reset");
  }

  // Clean up when view is detached
  detach() {
    super.detach();
    this.updateCallback = undefined;
    console.log("DuelView detached");
  }
}
