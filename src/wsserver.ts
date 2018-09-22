import { map } from "rxjs/operators";

import { wsMessageObservable } from "websocket";
import { authenticate, echoIfUnmatched } from "websocket/handlers";
import {
  catchWithContext,
  fanoutAndMerge,
  parseJSON
} from "websocket/operators";

import WebSocket = require("ws");

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    wsMessageObservable(ws)
      .pipe(
        parseJSON,
        fanoutAndMerge(echoIfUnmatched, authenticate),
        catchWithContext("Uncaught error in websocket pipeline"),
        map(x => JSON.stringify(x))
      )
      .subscribe(x => ws.send(x));

    ws.send("Connected successfully");
  });
};
