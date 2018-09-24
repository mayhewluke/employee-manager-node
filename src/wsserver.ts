import { BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";

import { wsMessageObservable } from "websocket";
import {
  authenticate,
  checkAuthStatus,
  forwardErrors
} from "websocket/handlers";
import { MessageTypes } from "websocket/messages";
import {
  catchWithContext,
  fanoutAndMerge,
  parseJSON
} from "websocket/operators";

import { createEmployee, listEmployees } from "Employee";

import WebSocket = require("ws");

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    const uid = new BehaviorSubject<null | string>(null);
    wsMessageObservable(ws)
      .pipe(
        parseJSON,
        fanoutAndMerge(
          uid,
          forwardErrors,
          authenticate,
          checkAuthStatus,
          createEmployee,
          listEmployees
        ),
        // TODO find a better way to have handlers able to affect things on the
        // server, not just the client
        tap(message => {
          if (message.type === MessageTypes.AuthSuccess) {
            uid.next(message.payload);
          }
        }),
        catchWithContext("Uncaught error in websocket pipeline"),
        map(x => JSON.stringify(x))
      )
      .subscribe(x => ws.send(x));

    ws.send("Connected successfully");
  });
};
