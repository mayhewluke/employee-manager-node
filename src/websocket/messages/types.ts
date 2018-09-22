import { MessagesUnion } from "./core";
import creators from "./creators";

export enum MessageTypes {
  AuthSuccess = "AuthSuccess",
  Authenticate = "Authenticate",
  Error = "Error"
}

export type Message = MessagesUnion<typeof creators>;
