import {AppRouter} from "./routes.config";
import {AppHttpClient} from "./http-client.config";
import {ApplicationConfig} from "@angular/core";
import {ApiClient} from "./services/api-client.service";
import {LobbyService} from "./services/lobby.service";
import {ShipDragAndDropService} from "./services/ship-drag-and-drop.service";
import {ActiveGameService} from "./services/active-game.service";
import {SessionAuthenticationService} from "./services/session-authentication.service";
import { ApiClientOffline } from "./services/api-client-offline.service";



export const AppConfig: ApplicationConfig = {
  providers: [
    // declare global services here
    SessionAuthenticationService,
    ApiClient,
    ApiClientOffline,
    LobbyService,
    ShipDragAndDropService,
    ActiveGameService,
    AppHttpClient,
    AppRouter,
  ]
};
