import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { ApiClient } from "./api-client.service"; // ApiClient service to interact with the backend API
import { GameBoard, GamePhase, GameSession, GameState } from "../types/game.types"; // Game-related types
import { BehaviorSubject } from "rxjs"; // RxJS BehaviorSubject for event handling and state management
import { LobbyService } from "./lobby.service";
import { getSessionInfoFromLocalStorage } from "../utils/offlinehelper";
import { ApiClientOffline } from "./api-client-offline.service";

@Injectable() // Marks this service as injectable in the dependency injection system
export class ActiveGameService {

  // List of active game phases where the game is still ongoing
  ACTIVE_PHASES = ['new', 'wait', 'selct', 'goodg'];

  // Injecting services
  private api = inject(ApiClient); // Inject the ApiClient service to handle API requests
  private api_offline = inject(ApiClientOffline);
  private lobby = inject(LobbyService);

  // BehaviorSubject to handle events, initializing with a 'type' of 'init'
  event = new BehaviorSubject<{ type: string }>({ type: 'init' });

  // State management using signals
  private _gameSession: WritableSignal<GameSession | undefined> = signal(undefined); // Holds the current game session
  private _currentTileSelection: WritableSignal<string | undefined> = signal(undefined); // Holds the currently selected tile
  
  get offline(): boolean {
    return this.lobby.sessionInfo()?.offline ?? getSessionInfoFromLocalStorage()?.offline ?? false
  }

  // Getter for the currently selected tile
  get currentSelection(): string | undefined {
    return this._currentTileSelection(); // Return the selected tile ID
  };

  // Getter for the current game session
  get session(): GameSession | undefined {
    return this._gameSession(); // Return the current game session
  }

  // Refresh the current game session by fetching the latest data from the API
  async refreshGameSession(): Promise<GameSession | undefined> {
    if (this.offline) {
      const response = await this.api_offline.getGameSession();
      // console.debug(response);
      this._gameSession.set(response);
      return response;
    }

    const response = await this.api.getGameSession(); // API call to get the current game session
    this._gameSession.set(response); // Update the session with the response
    return response; // Return the updated game session
  }

  // Returns whether the game is still loading (true if no session data)
  get loading(): boolean {
    const state = this._gameSession(); // Get the current session
    return !state; // Return true if the session is undefined (still loading)
  }

  // Returns the current game phase
  get phase(): GamePhase | undefined {
    const state = this._gameSession(); // Get the current session
    if (!state) return undefined; // Return undefined if no session exists
    return state.game_phase; // Return the current phase of the game
  }

  // Check if the player is done with the ship selection process
  get doneWithSelection(): boolean {
    const state = this._gameSession(); // Get the current session
    return !!(state?.game_state?.my_miss_tile_ids); // Return true if miss tiles are defined (indicating selection is done)
  };

  // Returns whether the game is in an active phase
  get active(): boolean {
    const phase = this.phase ?? 'wait'; // Default to 'wait' if no phase is defined
    return this.ACTIVE_PHASES.includes(phase); // Check if the current phase is one of the active phases
  };

  // Check if it's the current player's turn to play
  get activeTurn(): boolean {
    const state = this._gameSession(); // Get the current session
    if (!state) return false; // Return false if no session exists
    return this._gameSession()!.player_one_or_two === this._gameSession()!.active_turn; // Check if it's the player's turn
  }

  // Start the game by sending the selected ships to the server
  async startGame(ships: GameBoard): Promise<void> {
    let game_state;

    if (this.offline) {
      await this.api_offline.startGame(ships); // API call to start the game with the player's selected ships
      game_state = await this.api_offline.getGameSession(); // Fetch the updated game session
    } else {
      await this.api.startGame(ships); // API call to start the game with the player's selected ships
      game_state = await this.api.getGameSession(); // Fetch the updated game session
    }

    this._gameSession.set(game_state); // Update the game session with the new state
    this._currentTileSelection.set(undefined); // Clear the current tile selection
    this.event.next({ type: 'updateState' }); // Trigger an event to notify that the state has updated
  }

  // Reset the active game service (clear the game session)
  resetActiveGameService() {
    this._gameSession.set(undefined); // Clear the current game session
  }

  // Forfeit the current game by making an API call to forfeit
  forfeitGame() {
    if (this.offline) {
      return this.api_offline.forfeitGame();
    }

    return this.api.forfeitGame(); // API call to forfeit the game
  }

  // Update the selected tile (tile that the player has selected to attack)
  updateTileSelection(tileId: string | undefined) {
    this._currentTileSelection.set(tileId); // Set the selected tile ID
    this.event.next({ type: 'updateState' }); // Trigger an event to notify that the state has updated
  }

  // Commit a move (attack a tile) and return the updated game session
  async commitMove(): Promise<GameSession | undefined> {
    const currentTile = this._currentTileSelection(); // Get the currently selected tile
    if (!currentTile) throw new Error('need to select a tile to attack'); // Throw an error if no tile is selected

    let game_state;
    if (this.offline) {
      await this.api_offline.makeMove(currentTile); // API call to make the move (attack the selected tile)
      game_state = await this.api_offline.getGameSession(); // Fetch the updated game session after the move
    } else {
      await this.api.makeMove(currentTile); // API call to make the move (attack the selected tile)
      game_state = await this.api.getGameSession(); // Fetch the updated game session after the move
    }
    
    this._gameSession.set(game_state); // Update the game session with the new state
    this._currentTileSelection.set(undefined); // Clear the current tile selection
    this.event.next({ type: 'updateState' }); // Trigger an event to notify that the state has updated
    return game_state; // Return the updated game session
  }
}
