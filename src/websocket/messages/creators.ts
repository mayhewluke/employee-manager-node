import { createMessage } from "./core";
import { MessageTypes } from "./types";

const creators = {
  authSuccess: () => createMessage(MessageTypes.AuthSuccess),
  authenticate: (token: string) =>
    createMessage(MessageTypes.Authenticate, { token }),
  error: (context: string, message: string, stack?: string) =>
    createMessage(MessageTypes.Error, { context, message, stack })
};

export default creators;
