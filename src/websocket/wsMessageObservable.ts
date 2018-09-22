import { fromEventPattern } from "rxjs";

import WebSocket = require("ws");

// TODO type safety for `handler`, and return type
export default (ws: WebSocket) =>
  fromEventPattern(
    (handler: any) => ws.on("message", handler),
    (handler: any) => ws.off("message", handler)
  );
