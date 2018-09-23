import { of, OperatorFunction } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

import { isMessage, Message } from "websocket/messages";
import { catchWithContext } from "websocket/operators";

import WebSocket = require("ws");

export const requireMessageType = (val: any) => {
  if (isMessage(val)) {
    return val;
  }
  throw new Error(`Messages must have a \`type\``);
};

const parseJSON: OperatorFunction<WebSocket.Data, Message> = mergeMap(message =>
  of(message).pipe(
    map(x => JSON.parse(x.toString())),
    map(requireMessageType),
    catchWithContext(`Could not parse message as valid JSON: ${message}`)
  )
);

export default parseJSON;
