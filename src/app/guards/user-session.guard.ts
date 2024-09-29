import {CanActivateFn, Router} from "@angular/router";
import {inject} from "@angular/core";
import {LobbyService} from "../services/lobby.service";
import { getSessionInfoFromLocalStorage } from "../utils/offlinehelper";

export const UserSessionGuard: CanActivateFn = async () => {

  const lobby = inject(LobbyService);
  const router = inject(Router);

  const isOffline = lobby.sessionInfo()?.offline ?? getSessionInfoFromLocalStorage()?.offline ?? false;
  if (isOffline) {
    return true;
  }

  const isLoggedIn = await lobby.isLoggedIn();
  if (isLoggedIn) {
    isLoggedIn && await lobby.getAvailablePlayers();
    return true;
  } else {
    await lobby.leaveLobby();
    await router.navigate(['/'])
    return false;
  }
}
