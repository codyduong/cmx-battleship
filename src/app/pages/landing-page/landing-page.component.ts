import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import {
  RadioButtonFormControl,
  RadioButtonGroupComponent
} from "../../components/radio-button-group/radio-button-group.component";
import { LobbyService } from "../../services/lobby.service";
import { Router } from "@angular/router";
import { AsyncPipe, NgClass, NgIf, NgOptimizedImage } from "@angular/common";
import { OnlineStats } from "../../types/lobby.types";
import { CloudBackgroundComponent } from "../../components/cloud-background/cloud-background.component";

@Component({
  selector: "app-landing-page",
  standalone: true,
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.scss",
  // Declaring imports for this component including forms, UI components, and pipes
  imports: [
    ReactiveFormsModule, // To handle reactive forms in Angular
    RadioButtonGroupComponent, // Component for radio button group
    NgIf, // Structural directive for conditional rendering
    NgClass, // Directive for dynamically binding classes
    AsyncPipe, // To handle asynchronous data streams
    NgOptimizedImage, // For optimized image handling in Angular
    CloudBackgroundComponent // Custom component for background cloud animation
  ]
})

export class LandingPageComponent implements OnInit {
  // Injecting the LobbyService to interact with lobby-related functionality
  lobby = inject(LobbyService); 
  // Injecting the Router to handle navigation between pages
  router = inject(Router);

  // Storing the retrieved online stats using WritableSignal (signal for reactive updates)
  stats: WritableSignal<OnlineStats | undefined> = signal(undefined);

  // Form control for player name input with validation rules
  playerNameForm = new FormControl("", [
    Validators.required, // Field is required
    Validators.minLength(4), // Minimum length of player name
    Validators.maxLength(32), // Maximum length of player name
  ]);

  // Custom form control for selecting number of ships via radio buttons
  shipForm = new RadioButtonFormControl([
    { label: '1', value: 1 }, // Option for 1 ship
    { label: '2', value: 2 }, // Option for 2 ships
    { label: '3', value: 3 }, // Option for 3 ships
    { label: '4', value: 4 }, // Option for 4 ships
    { label: '5', value: 5 }, // Option for 5 ships
  ]);

  // Lifecycle hook that runs when the component is initialized

  ngOnInit(): void {
    // Fetch game stats (such as number of players online) when the component is initialized
    this.lobby.gameStats()
      .then(r => this.stats.set(r))
      .catch((r) => console.warn!("server is offline, only offline mode available")); // Once stats are fetched, they are set in the `stats` signal
  }

  // Method to handle form submission when the user submits their name and selected number of ships
  async onSubmit() {
    // Ensure that both the player name and ship form are valid before proceeding
    if (this.playerNameForm.valid && this.shipForm.valid && this.stats()?.playerCount != undefined) {
      // Call the joinLobby method from LobbyService with the player's name and selected number of ships
      await this.lobby.joinLobby({
        player_name: this.playerNameForm.value!, // Player name from form input
        num_ships: String(this.shipForm.value), // Number of ships as a string
      });

      // Reset both the player name and ship selection forms after successful submission
      this.playerNameForm.reset(); 
      this.shipForm.reset();

      // Navigate to the lobby page after successfully joining the game
      this.router.navigate(['/lobby']);
    }
  }

  // Navigate to offline page and set it up
  async onSubmitOffline() {
    if (this.shipForm.valid) {
      await this.lobby.joinLobbyOffline({
        player_name: this.playerNameForm.value!,
        num_ships: String(this.shipForm.value),
      });

      this.playerNameForm.reset(); 
      this.shipForm.reset();

      this.router.navigate(['/offline']);
    }
  }
}
