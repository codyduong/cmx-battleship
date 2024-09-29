import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { GameboardComponent } from "../../components/gameboard/gameboard.component"; // Gameboard component for playing the game
import { LobbyService } from "../../services/lobby.service"; // Lobby service to handle player sessions
import { DecimalPipe, NgIf, NgOptimizedImage, NgStyle, NgTemplateOutlet } from "@angular/common"; // Angular common utilities and pipes
import { Router } from "@angular/router"; // Router for navigation between pages
import { ShipDragAndDropService } from "../../services/ship-drag-and-drop.service"; // Service for dragging and dropping ships
import { GameShipSpacerComponent } from "../../components/game-ship/spacer/game-ship-spacer.component"; // Spacer component for ships
import { GameShipDraggableComponent } from "../../components/game-ship/draggable/game-ship-draggable.component"; // Draggable ship component
import { GameShipComponent } from "../../components/game-ship/game-ship.component"; // Game ship component
import { ActiveGameService } from "../../services/active-game.service"; // Service to manage active game sessions
import { sleep } from "../../utils"; // Utility function for polling
import { CloudBackgroundComponent } from "../../components/cloud-background/cloud-background.component"; // Background animation component

@Component({
  selector: "app-play-game",
  templateUrl: "./play-game.component.html", // The HTML template for this component
  styleUrl: "./play-game.component.scss", // The stylesheet for this component
  imports: [
    GameboardComponent,
    DecimalPipe,
    NgIf,
    GameShipDraggableComponent,
    NgStyle,
    NgTemplateOutlet,
    GameShipSpacerComponent,
    GameShipComponent,
    NgOptimizedImage,
    CloudBackgroundComponent
  ],
  standalone: true,
})
export class PlayGameComponent implements OnInit {

  // Inject services
  private router = inject(Router); // Router to navigate between pages
  protected userSessions = inject(LobbyService); // Lobby service to manage user sessions
  protected game = inject(ActiveGameService); // Active game service to manage game state
  protected shipSelection = inject(ShipDragAndDropService); // Service to manage ship dragging and dropping

  // Signal to track if game status polling is active
  private _currentlyPollingGameStatus: WritableSignal<boolean> = signal(false);

  // Determines the end game message based on game state
  endGameMessage = () => {
    if (this.game.session && this.game.phase === `${this.game.session.player_one_or_two}win`) {
      return "You win!"; // Message if the player wins
    } else if (this.game.phase === 'nowin') {
      return "Incomplete Match"; // Message if the game is incomplete
    } else {
      return "You Lose"; // Default message if the player loses
    }
  };

  // Lifecycle method: Called once the component is initialized
  ngOnInit() {
    this.game.resetActiveGameService(); // Reset the game state on component load

    this.pollGameStatus(); // Start polling for game status

    // Set up ship selection or re-poll if not ready
    const tnt = () => {
      if (this.game.phase === 'selct' && !this.game.doneWithSelection) {
        this.shipSelection.showShipsAndEnableTileFeedback(); // Enable ship selection
      } else {
        setTimeout(tnt, 1000); // Retry every second if selection isn't ready
      }
    };

    tnt(); // Initial call to start ship selection logic
  }

  // Handler to exit the game, reset services, and navigate to the lobby
  async handleExit() {
    await this.game.forfeitGame(); // Forfeit the current game
    if (this.game.offline) {
      this.router.navigate(['/offline']);
    } else {
      this.router.navigate(['/lobby']);  // Navigate to the lobby
    }
    this.shipSelection.resetShipSelectorService(); // Reset the ship selection service
    this.game.resetActiveGameService(); // Reset the active game service
  }

  // Handler to start the game when the player has selected ships
  async handleStartGame() {
    await this.game.startGame(this.shipSelection.shipLocations); // Start the game with selected ships
    this.shipSelection.submitAndHideShips(); // Hide the ships after submission
  }

  // Polling method to continuously check the game status
  async pollGameStatus() {
    if (!this._currentlyPollingGameStatus()) this._currentlyPollingGameStatus.set(true); // Start polling if not already active
    else {
      return; // Exit if polling is already active
    }

    while (this._currentlyPollingGameStatus()) {
      const state = await this.game.refreshGameSession(); // Get the latest game state
      if (!state) {
        this.router.navigate(['/lobby']); // Navigate to the lobby if no state is found
        return;
      }

      if (this.game.doneWithSelection) {
        this.shipSelection.resetShipSelectorService(); // Reset ship selection when done
      }

      if (this.game.phase === 'nowin') {
        this.router.navigate(['/lobby']); // Navigate to lobby if the game is incomplete
      }

      await sleep(1_000); // Poll every 1 second (increases responsiveness)
    }
  }

  // Stop the polling of game status
  stopPollingGameStatus() {
    this._currentlyPollingGameStatus.set(false); // Stop polling
  }

  // Handler to make a selection during the game (e.g., firing a shot)
  async handleMakeSelection() {
    console.log(`selected ${this.game.currentSelection}`); // Log the player's selection
    if (this.game.currentSelection && this.game.activeTurn) {
      await this.game.commitMove(); // Commit the player's move
    } else {
      throw new Error('cannot play if its not your turn'); // Throw an error if it's not the player's turn
    }
  }

  // Determines the current message to display based on the game state
  currentMessage() {
    if (this.game.doneWithSelection) {
      if (this.game.phase === 'selct')
        return "Waiting for other player..."; // Message if waiting for the other player
      else if (this.game.activeTurn)
        return "Your turn!"; // Message if it's the player's turn
      else if (!this.game.activeTurn) return "Your opponent's turn!"; // Message if it's the opponent's turn
      else return " "; // Default blank message
    } else if (!this.game.doneWithSelection && this.shipSelection.active) {
      return `Please begin by placing your ${
        this.userSessions.sessionInfo()?.num_ships === '1'
          ? 'ship'
          : this.userSessions.sessionInfo()?.num_ships + ' ships'
      }...`; // Message for placing ships
    }
    else if (this.game.phase === 'goodg') {
      return "Firing"; // Message during the firing phase
    }
    else return " "; // Default blank message
  }
}
