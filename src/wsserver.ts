import { from, fromEventPattern, merge, Observable, of, pipe } from "rxjs";
import {
  catchError,
  concat,
  filter,
  map,
  mapTo,
  mergeMap,
  switchMap
} from "rxjs/operators";

import firebaseAdmin from "firebaseAdmin";

import WebSocket = require("ws");

const err = (context: string) => ({ message, stack }: Error) =>
  of({ context, message, stack, event: "error" });

// TODO handle this in a way that doesn't lose type safety for `event`
const subscribe = (ws: WebSocket, event: string) =>
  fromEventPattern(
    (handler: any) => ws.on(event, handler),
    (handler: any) => ws.removeEventListener(event, handler)
  );

const parseMessage = pipe(
  mergeMap((message: any) =>
    of(message).pipe(
      map(x => JSON.parse(x)),
      catchError(err(`Could not parse message as JSON: ${message}`))
    )
  )
);

const echoIfUnmatched = pipe(
  filter<any>(message => message.event !== "authenticate")
);

const authenticate = pipe(
  filter<any>(message => message.event === "authenticate"),
  switchMap(message =>
    from(firebaseAdmin.auth().verifyIdToken(message.token)).pipe(
      mapTo({ event: "authSuccess" }),
      catchError(err("Failed to authenticate with Firebase"))
    )
  )
);

// Given a series of handler functions that take the emitted values and return
// an Observable, runs them all in parallel and then merges the results into a
// single Observable that emits results from any of the handler Observables.
const fanoutAndMerge = (...handlers: Array<(val: any) => Observable<any>>) =>
  pipe(
    mergeMap((val: any) =>
      merge(...handlers.map(handler => of(val).pipe(handler)))
    )
  );

export default (
  server: WebSocket.ServerOptions["server"],
  callback?: () => void
) => {
  const wss = new WebSocket.Server({ server }, callback);
  return wss.on("connection", (ws, _) => {
    subscribe(ws, "message")
      .pipe(
        parseMessage,
        fanoutAndMerge(echoIfUnmatched, authenticate),
        catchError((e, caught) =>
          err("Uncaught error in websocket pipeline")(e).pipe(concat(caught))
        ),
        map(x => JSON.stringify(x))
      )
      .subscribe(x => ws.send(x));

    ws.send("Connected successfully");
  });
};
