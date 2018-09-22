import { merge, Observable, of, pipe } from "rxjs";
import { mergeMap } from "rxjs/operators";

// Given a series of handler functions that take the emitted values and return
// an Observable, runs them all in parallel and then merges the results into a
// single Observable that emits results from any of the handler Observables.
export default (...handlers: Array<(val: any) => Observable<any>>) =>
  pipe(
    mergeMap((val: any) =>
      merge(...handlers.map(handler => of(val).pipe(handler)))
    )
  );
