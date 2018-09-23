import { createMessage } from "./core";
import { MessageTypes } from "./types";

const creators = {
  authStatus: (isLoggedIn: boolean) =>
    createMessage(MessageTypes.AuthStatus, isLoggedIn),
  authSuccess: (uid: string) => createMessage(MessageTypes.AuthSuccess, uid),
  authenticate: (token: string) =>
    createMessage(MessageTypes.Authenticate, { token }),
  checkAuthStatus: () => createMessage(MessageTypes.CheckAuthStatus),
  error: (context: string, message: string, stack?: string) =>
    createMessage(MessageTypes.Error, { context, message, stack })
};

export default creators;
