import {CanActivateFn, Router} from "@angular/router";
import {inject} from "@angular/core";
import {ActiveGameService} from "../services/active-game.service";
import { LobbyService } from "../services/lobby.service";
import { getSessionInfoFromLocalStorage } from "../utils/offlinehelper";

export const ActiveGameGuard: CanActivateFn = async () => {
    const gameService = inject(ActiveGameService);
    const lobby = inject(LobbyService);
    const router = inject(Router);

    const isOffline = lobby.sessionInfo()?.offline ?? getSessionInfoFromLocalStorage()?.offline ?? false;

    if (isOffline) {
        return true;
    }

    const gameState = await gameService.refreshGameSession();
    
    if (!gameState) {
        router.navigate(['/lobby'])
        return false;
    }

    return true;
}

