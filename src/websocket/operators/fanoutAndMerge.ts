import { merge, Observable, of, pipe, UnaryFunction } from "rxjs";
import { mergeMap } from "rxjs/operators";

import { Message } from "websocket/messages";

// Given a series of handler functions that take the emitted values and return
// an Observable, runs them all in parallel and then merges the results into a
// single Observable that emits results from any of the handler Observables.
function fanoutAndMerge(
  ...handlers: Array<UnaryFunction<Observable<Message>, Observable<Message>>>
): UnaryFunction<Observable<Message>, Observable<Message>> {
  return pipe(
    mergeMap(val => merge(...handlers.map(handler => of(val).pipe(handler))))
  );
}

export default fanoutAndMerge;
