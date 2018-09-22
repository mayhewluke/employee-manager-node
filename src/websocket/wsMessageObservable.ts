import { Observable, Observer, TeardownLogic } from "rxjs";

import WebSocket = require("ws");

type Handler = (this: WebSocket, data: WebSocket.Data) => void;

// The higher-level observable creation methods don't work properly for one
// reason or another, so low-level `create` has to be used
export default (ws: WebSocket): Observable<WebSocket.Data> =>
  Observable.create(
    (observer: Observer<WebSocket.Data>): TeardownLogic => {
      const handler: Handler = x => observer.next(x);
      ws.on("message", handler);
      return () => ws.off("message", handler);
    }
  );
