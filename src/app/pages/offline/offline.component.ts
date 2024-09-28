import { Component, OnInit, WritableSignal, inject, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { LobbyService } from "src/app/services/lobby.service"; // Service to handle lobby-related tasks
import { sleep } from "src/app/utils"; // Utility function for sleeping/polling
import { Router } from "@angular/router"; // Router for navigation between pages
import { ActiveGameService } from "../../services/active-game.service"; // Service to manage active game sessions
import { CommonModule } from "@angular/common"; // Common Angular module for directives
import { CloudBackgroundComponent } from "../../components/cloud-background/cloud-background.component"; // Custom cloud background component
import { AvailablePlayer } from "src/app/types/lobby.types";

@Component({
  selector: "app-offline",
  standalone: true,
  templateUrl: "./offline.component.html", // HTML template for the lobby UI
  styleUrls: ["./offline.component.scss"], // Styles for the lobby component
  imports: [ReactiveFormsModule, CommonModule, CloudBackgroundComponent] // Import necessary modules and components
})

export class OfflineComponent implements OnInit {
  // Injected services
  lobbyService = inject(LobbyService); // Inject the lobby service to access lobby functionalities
  // gameService = inject(ActiveGameService); // Inject the game service to manage game sessions
  router = inject(Router); // Inject the router for navigation between different pages

  // Copied from the `lobby.commponent.ts`, but use hardcoded "players" -@codyduong
  availablePlayerCache: WritableSignal<AvailablePlayer[] | undefined> = signal([
    // {
    //   player_id: "0",
    //   player_name: "Hotswap Mode"
    // },
    {
      player_id: "1",
      player_name: "Easy Bot"
    },
    {
      player_id: "2",
      player_name: "Medium Bot"
    },
    {
      player_id: "3",
      player_name: "Hard Bot"
    },
  ]); // Signal to hold the available players list
  gameRequestCache: WritableSignal<any[] | undefined> = signal(undefined); // Signal to hold incoming game requests

  // Form control for searching players by name or ID
  searchedPlayer = new FormControl(''); // Reactive form control for searching players

  // Lifecycle hook that runs when the component is initialized
  ngOnInit(): void {}

  // Method to request a match with another player
  handleCreateRequest(player_id: string) {
    console.log(`Requesting match with player ${player_id}`);
    this.lobbyService.createGameOffline(player_id as any) // Request a game with a bot
    this.router.navigate(['/play']);
  }

  // Method to log out from the lobby and navigate back to the home page
  async handleLogout() {
    await this.lobbyService.leaveLobby(); // Leave the lobby
    this.router.navigate(['/']); // Navigate to the home page
  }

  // Method to track players and requests by their unique player IDs for better rendering performance
  trackPlayerId(index: number, player: any): string {
    return player.player_id; // Use player ID as the unique identifier
  }
}
