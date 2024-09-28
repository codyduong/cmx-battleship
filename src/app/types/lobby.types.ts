
export type JoinLobby = {
  player_name: string;
  num_ships: string;
}

export type NewUserSession = {
  session_id: string;
  player_id: string;
}

//each session has a session id, player id, name, number of ships
export type UserSession = {
  session_id: string;
  player_id: string;
  player_name: string;
  num_ships: string;
  offline: boolean;
}

//Displays the number of players the game.
export type OnlineStats = {
  playerCount: number;
}

//Players not currently in a match.
export type AvailablePlayer = {
  player_id: string;
  player_name: string;
}

//
export type GameRequest = {
  game_request_id: string;
  player_id: string;
  player_name: string;
}
