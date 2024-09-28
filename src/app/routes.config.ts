import {provideRouter, Routes} from "@angular/router";
import {UserSessionGuard} from "./guards/user-session.guard";
import {EnvironmentProviders} from "@angular/core";
import {ActiveGameGuard} from "./guards/active-game.guard";

/* This file is used to handle the routes. By default the game starts on the "start" route.
   After entering your name and selecting the number of ships, player will be sent to lobby.
   Once a match is found, players begin playing on the play route.
*/

const routesConfig: Routes = [
  {
    path: "start",
    loadComponent: ()=>import('src/app/pages/landing-page/landing-page.component')
      .then(m=>m.LandingPageComponent)
  },
  {
    path: "lobby",
    canActivate: [UserSessionGuard],
    loadComponent: ()=>import('src/app/pages/lobby/lobby.component')
      .then(m=>m.LobbyComponent)
  },
  {
    path: "play",
    canActivate: [UserSessionGuard, ActiveGameGuard],
    loadComponent: ()=>import('src/app/pages/play-game/play-game.component')
      .then(m=>m.PlayGameComponent)
  },
  {
    path: "offline",
    canActivate: [UserSessionGuard],
    loadComponent: ()=>import('src/app/pages/offline/offline.component')
      .then(m=>m.OfflineComponent)
  },
  {
    path: "",
    pathMatch: "full",
    redirectTo: "start"
  }
]

/**
 * provides application routing
 */
export const AppRouter: EnvironmentProviders
  = provideRouter(routesConfig);
