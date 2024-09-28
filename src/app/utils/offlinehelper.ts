import { UserSession } from "../types/lobby.types";

export const getSessionInfoFromLocalStorage = (): UserSession | null => {
  try {
    const sessionInfoCache = localStorage.getItem("lobby-service.sessionInfo"); // Check if session info is stored in localStorage
    return sessionInfoCache ? JSON.parse(sessionInfoCache) : null
  } catch {
    return null
  }
}