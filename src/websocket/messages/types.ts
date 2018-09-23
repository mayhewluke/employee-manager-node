import { MessagesUnion } from "./core";
import creators from "./creators";

export enum MessageTypes {
  AuthSuccess = "AuthSuccess",
  AuthStatus = "AuthStatus",
  Authenticate = "Authenticate",
  Error = "Error",
  CheckAuthStatus = "CheckAuthStatus",
}

export type Message = MessagesUnion<typeof creators>;
