import {inject, Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {JoinLobby, NewUserSession} from "../types/lobby.types";


export type SUPPORTED_METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE';

@Injectable()
export class ApiClient {
  private endpoint = process.env['APP_API_ENDPOINT']
  private http = inject(HttpClient);

  // internal methods
  private request<T>(method: SUPPORTED_METHODS, url: string, body?: any, additionalHeaders?: HttpHeaders): Promise<T | undefined> {
    return firstValueFrom(this.http.request<T>(
      method,
      url,
      {
        observe: 'body',
        headers: additionalHeaders,
        body: body
      }
    ));
  }

  // public api
  startUserSession(request: JoinLobby): Promise<NewUserSession | undefined> {
    return this.request<NewUserSession>('POST', `${this.endpoint}/lobby`, request);
  }

  endUserSession() {
    return this.request<void>('DELETE', `${this.endpoint}/lobby`);
  }

  requestGame(player_id: string) {
    return this.request<void>('POST', `${this.endpoint}/game/requests`, {
      player_id: player_id,
    });
  }

  getGameRequests() {
    return this.request<void>('GET', `${this.endpoint}/game/requests`);
  }

  startGame(ships: Map<number, string[]>) {
    return Promise.resolve();
    // return this.request('POST', `${this.endpoint}/active/game/start`, ships);
  }
}
