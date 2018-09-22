import { Observable, pipe, UnaryFunction } from "rxjs";

import { Message, MessageTypes } from "websocket/messages";
import { ofType } from "websocket/operators";

// All other handlers should be listening for incoming messages - but by
// definition that means they also filter out anything that isn't an incoming
// message, swallowing up those events. Therefor we need a handler that listens
// for errors coming from upstream and ensures they continue past the
// fanoutAndMerge to be emitted downstream.
const forwardErrors: UnaryFunction<
  Observable<Message>,
  Observable<Message>
> = pipe(ofType(MessageTypes.Error));

export default forwardErrors;
