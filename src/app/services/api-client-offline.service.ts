import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http"; // HttpClient and HttpHeaders for HTTP requests
import { firstValueFrom } from "rxjs"; // Used to convert observables to promises
import { AvailablePlayer, GameRequest, JoinLobby, NewUserSession, OnlineStats } from "../types/lobby.types"; // Type definitions for lobby-related data
import { GameBoard, GameSession } from "../types/game.types"; // Type definitions for game-related data
import { environment } from "../../environments/environment"; // Import environment variables
import { sleep } from "../utils";

// Define the supported HTTP methods
export type SUPPORTED_METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE';

// This is the offline variant 

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Injectable() // Mark this class as an injectable service
export class ApiClientOffline {
  private game_session: GameSession = {
    game_phase: "selct",
    active_turn: "p1",
    player_one_or_two: "p1", // p1 is player, p2 is AI
  }
  private ai_difficulty: number = -1; // -1 is uninitialized goes from 1-3, 1 being easiest, 3 being hardest
  private gridSize: number = 10;

  // an array of ships, ie: [ ["A1"], ["A2", "A3"] ]
  private player_ships: string[][] = []
  private ai_ships: string[][] = []

  // // location where player has attempted to strike, hit and miss, ie. ["A1", "A2"]
  private player_hits: string[] = [];
  private player_misses: string[] = [];
  private ai_hits: string[] = [];
  private ai_misses: string[] = [];

  // checks the remaining ships, for any team
  private getRemainingShips(ships: string[][], hits: string[]): number {
    return ships.filter(ship => !ship.every(tile => hits.includes(tile))).length;
  }

  // checks if we hit a ship, for any team
  private isValidHit(tile: string, ships: string[][]): boolean {
    return ships.some(ship => ship.includes(tile));
  }

  private getPlayerShipsRemaining(): number {
    return this.getRemainingShips(this.player_ships, this.ai_hits);
  }

  private getAiShipsRemaining(): number {
    return this.getRemainingShips(this.ai_ships, this.player_hits);
  }

  // this is not used since we are only exposing what the player "knows"
  // private getHealthyAiShips(): string[] {
  //   const allAiShipTiles = this.ai_ships.flat();
  //   return allAiShipTiles.filter(tile => !this.ai_hits.includes(tile));
  // }

  // where we have remaining healthy ships
  private getHealthyPlayerShips(): string[] {
    const allPlayerShipTiles = this.player_ships.flat();
    return allPlayerShipTiles.filter(tile => !this.player_hits.includes(tile));
  }

  // Converts grid coordinates to the game board position (e.g., 0, 0 -> "A1").
  private convertToPosition(row: number, col: number): string {
    const letters = "ABCDEFGHIJ";
    return letters[row] + (col + 1).toString();
  }

  // Check if we can place a ship there (only used to validate AI positions)
  private canPlaceShip(
    row: number,
    col: number,
    length: number,
    isVertical: boolean,
    availablePositions: boolean[][]
  ): boolean {
    for (let i = 0; i < length; i++) {
      const r = isVertical ? row + i : row;
      const c = isVertical ? col : col + i;

      // If the position is outside the grid or already occupied, return false
      if (r >= this.gridSize || c >= this.gridSize || !availablePositions[r][c]) {
        return false;
      }
    }

    return true;
  }

  // Set up AI ships randomly
  private initializeAiShips(): void {
    // ai will always choose the same number of ships as the player
    const shipLengths = Array.from({length: this.getPlayerShipsRemaining()}, (_, i) => i +1);

    // TODO, this is an array of arrays such as [["A1"], ["B2", "B3"]]
    const aiShipPositions = []

    this.ai_ships = aiShipPositions;
  }

  // make ai move based on difficulty
  private makeAiMove() {
    private lastAiHit: string | null = null;  // Keep track of the last hit made by the AI for the Medium AI logic
    let availableMoves = this.generateAvailableMoves();
    let chosenMove: string;

    switch (this.ai_difficulty) { 
        case 1:
            // Easy AI: choose a random available move
            chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            break;
        case 2:
            // Medium AI: Randomly shoot until a hit, then hunt orthogonally
            //
            // be careful with this implementation since we need to first check if the last move
            // A. hit, then choose an orthogonal direction
            // B. sunk a ship, then choose a random location again
            // C. missed
            //IDK IF CASE 2 and 3 make sense or work- Harrison Wendt 9/28/24 
            // TODO
            if (this.lastAiHit) {
              // Try orthogonal tiles if there is a previous hit
              let orthogonalMoves = this.getOrthogonalMoves(this.lastAiHit);
      
              // Filter out moves already made
              orthogonalMoves = orthogonalMoves.filter(move => availableMoves.includes(move));
      
              if (orthogonalMoves.length > 0) {
                // Choose from orthogonal moves
                chosenMove = orthogonalMoves[Math.floor(Math.random() * orthogonalMoves.length)];
              } else {
                // If no valid orthogonal moves, fall back to random
                this.lastAiHit = null;
                chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
              }
            } else {
              // Randomly select a move if no previous hit
              chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            }
            break;
        case 3:
            // Hard AI: just choose the locations of unsunk player ships
            // You can use this.getHealthyPlayerShips() and either choose in order, or randomly from this array 

            // TODO
             // Hard AI: Target player ships based on unsunk ship locations
            const healthyPlayerShips = this.getHealthyPlayerShips();
            if (healthyPlayerShips.length > 0) {
              // Choose a random tile from unsunk player ships
              chosenMove = healthyPlayerShips[Math.floor(Math.random() * healthyPlayerShips.length)];
            } else {
              // Fallback to random if no unsunk ship tiles are available
              chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            }
              break;
            
            //chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            //break;
        default:
            // Fallback to random move
            chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Apply the move: Check if it's a hit or miss
    if (this.isValidHit(chosenMove, this.player_ships)) {
        this.ai_hits.push(chosenMove);
    } else {
        this.ai_misses.push(chosenMove);
    }
    console.debug(`Ai tries: ${chosenMove}`);
  }

  /**
  * Generates all valid moves that the AI hasn't fired on yet.
  */
  private generateAvailableMoves(): string[] {
    const allMoves = [];

    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            allMoves.push(this.convertToPosition(row, col));
        }
    }

    // Filter out moves that have already been made (hits or misses)
    return allMoves.filter(move => !this.ai_hits.includes(move) && !this.ai_misses.includes(move));
  }

  // update game state after every action
  private reevaluateGameState() {
    const aiShips = this.getAiShipsRemaining();
    const playerShips = this.getPlayerShipsRemaining();

    // i don't really understand this game_state tracker
    // but it's always goodg except in win or select screen, there are other variants
    // that i've never seen... -@codyduong
    this.game_session.game_phase = "goodg";

    // check if we ended the game
    if (aiShips == 0) {
      this.game_session.game_phase = "p1win";
    }
    if (playerShips == 0) {
      this.game_session.game_phase = "p2win";
    }

    this.game_session.game_state = {
      hit_tile_ids: this.player_hits,
      miss_tile_ids: this.player_misses,
      ships_remaining: aiShips,
      my_hit_tile_ids: this.ai_hits,
      my_miss_tile_ids: this.getHealthyPlayerShips(), // this is your remaining ships
      my_ships_remaining: playerShips,
    };
  }
  private getOrthogonalMoves(tile: string): string[] {
    const row = tile.charAt(0);
    const col = parseInt(tile.substring(1), 10);
    const letters = "ABCDEFGHIJ";
    
    let moves: string[] = [];
  
    // Calculate possible orthogonal moves
    const rowIdx = letters.indexOf(row);
    if (rowIdx > 0) moves.push(letters[rowIdx - 1] + col); // Up
    if (rowIdx < this.gridSize - 1) moves.push(letters[rowIdx + 1] + col); // Down
    if (col > 1) moves.push(row + (col - 1)); // Left
    if (col < this.gridSize) moves.push(row + (col + 1)); // Right
  
    return moves;
  }

  /**
   * Public API method to start a new game with the selected ships.
   * @param ships The game board configuration with selected ships
   * @returns A promise that resolves when the game starts
   */
  async startGame(ships: GameBoard): Promise<void> {
    this.player_ships = [ships.ship_1, ships.ship_2, ships.ship_3, ships.ship_4, ships.ship_5].filter((ship): ship is string[] => !!ship && ship.length > 0)
    
    // place ships randomly for AI
    this.initializeAiShips();
    console.debug(this.ai_ships);

    // set the game as being ready
    this.reevaluateGameState();
  }

  /**
   * Public API method to get the current game session.
   * @returns A promise that resolves with the current game session
   */
  async getGameSession(): Promise<GameSession> {
    return this.game_session;
  }

  /**
   * Public API method to forfeit the current game.
   * @returns A promise that resolves when the game is forfeited
   */
  async forfeitGame(): Promise<void> {
    // we reset the game state to the initial game state
    this.game_session = {
      game_phase: "selct",
      active_turn: "p1",
      player_one_or_two: "p1",
    };
    this.ai_difficulty = -1;
    this.player_ships = [];
    this.ai_ships = [];
    this.player_hits = [];
    this.player_misses = [];
    this.ai_hits = [];
    this.ai_misses = [];
  }

  /**
   * Public API method to make a move (attack a tile) during the game.
   * @param currentTileSelection The ID of the tile to attack
   * @returns A promise that resolves when the move is made
   */
  async makeMove(currentTileSelection: string): Promise<void> {
    // set to p2 to show on players screen
    this.game_session.active_turn = "p2";
    if (!this.player_hits.includes(currentTileSelection) && !this.player_misses.includes(currentTileSelection)) {
      if (this.isValidHit(currentTileSelection, this.ai_ships)) {
        this.player_hits.push(currentTileSelection);
      } else {
        this.player_misses.push(currentTileSelection);
      }
    }
    this.makeAiMove();
    this.reevaluateGameState();
    sleep(1000);
    // set back to p1
    this.game_session.active_turn = "p1";
  }

  /**
   * Initializes a game with a difficulty
   */
  initializeGameSession(difficulty: '0' | '1' | '2' | '3'): void {
    this.ai_difficulty = Number(difficulty);
  }
  
  
}
