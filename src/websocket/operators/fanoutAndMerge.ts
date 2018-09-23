import { BehaviorSubject, merge, Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";

import { Message } from "websocket/messages";

type Handler = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
) => Observable<Message>;

// Given a series of handler functions that take the emitted values and return
// an Observable, runs them all in parallel and then merges the results into a
// single Observable that emits results from any of the handler Observables.
const fanoutAndMerge = (
  uid: BehaviorSubject<string | null>,
  ...handlers: Handler[]
) => (source: Observable<Message>): Observable<Message> =>
  source.pipe(
    mergeMap(val => merge(...handlers.map(handler => handler(of(val), uid))))
  );

export default fanoutAndMerge;
