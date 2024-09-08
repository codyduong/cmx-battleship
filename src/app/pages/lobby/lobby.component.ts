import {Component, OnInit, WritableSignal, inject, signal} from "@angular/core";
import { FormControl, ReactiveFormsModule} from "@angular/forms";
import { LobbyService } from "src/app/services/lobby.service";
import { sleep } from "src/app/utils";
import {Router} from "@angular/router";
import {ActiveGameService} from "../../services/active-game.service";

@Component ({
    selector: "app-lobby",
    standalone: true,
    templateUrl: "./lobby.component.html",
    styleUrl: "./lobby.component.scss",
    imports: [ReactiveFormsModule]
})

export class LobbyComponent implements OnInit {

    // get only lobby service[]
    lobbyService = inject(LobbyService) // create variable, inject is used to access methods in lobby.service.ts
    gameService = inject(ActiveGameService);
    router = inject(Router);
    availablePlayerCache: WritableSignal<any[]|undefined> = signal(undefined);
    gameRequestCache: WritableSignal<any[] |undefined> = signal(undefined);


    ngOnInit(): void {
        this.pollGameRequests();
    }

    async pollGameRequests() {
        while (true) {
            const games = await this.lobbyService.getGameRequests();
            this.gameRequestCache.set(games);

            const gameState = await this.gameService.refreshGameSession();
            if (gameState?.game_phase==='selct') {
                this.router.navigate(['/play']);
                return;
            }

            this.lobbyService.getAvailablePlayers().then((players: any[] | undefined)=>{
                this.availablePlayerCache.set(players)
            });

            await sleep(5_000)
        }
    }

    searchedPlayer = new FormControl();

    handleCreateRequest(player_id: string) {
        this.lobbyService.createGameRequest(player_id)
    }

    async handleJoinGame(game_request_id: number) {
        await this.lobbyService.joinGame(game_request_id);
        this.router.navigate(['/play'])
    }

    async handleLogout() {
        await this.lobbyService.leaveLobby();
        this.router.navigate(['/']);
    }
}
