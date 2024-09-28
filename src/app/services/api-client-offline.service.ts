import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http"; // HttpClient and HttpHeaders for HTTP requests
import { firstValueFrom } from "rxjs"; // Used to convert observables to promises
import { AvailablePlayer, GameRequest, JoinLobby, NewUserSession, OnlineStats } from "../types/lobby.types"; // Type definitions for lobby-related data
import { GameBoard, GameSession } from "../types/game.types"; // Type definitions for game-related data
import { environment } from "../../environments/environment"; // Import environment variables

// Define the supported HTTP methods
export type SUPPORTED_METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE';

// This is the offline variant 

@Injectable() // Mark this class as an injectable service
export class ApiClientOffline {
  private game_session: GameSession = {
    game_phase: "selct",
    active_turn: "p1",
    player_one_or_two: "p1",
  }

  /**
   * Public API method to start a new game with the selected ships.
   * @param ships The game board configuration with selected ships
   * @returns A promise that resolves when the game starts
   */
  startGame(ships: GameBoard) {
    
  }

  /**
   * Public API method to get the current game session.
   * @returns A promise that resolves with the current game session
   */
  getGameSession(): GameSession {
    return this.game_session;
  }

  /**
   * Public API method to forfeit the current game.
   * @returns A promise that resolves when the game is forfeited
   */
  forfeitGame() {
    
  }

  /**
   * Public API method to make a move (attack a tile) during the game.
   * @param currentTileSelection The ID of the tile to attack
   * @returns A promise that resolves when the move is made
   */
  makeMove(currentTileSelection: string) {
    
    // respond with the AI move based on difficulty
  }

  /**
   * Initializes a game with a difficulty
   */
  initializeGameSession(difficulty: '0' | '1' | '2' | '3') {

  }
}
