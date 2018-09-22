import { Observable, of, pipe, UnaryFunction } from "rxjs";
import { catchError } from "rxjs/operators";

import { creators, Message } from "websocket/messages";

function catchWithContext<T>(
  context: string
): UnaryFunction<Observable<T>, Observable<T | Message>> {
  return pipe(
    catchError(({ message, stack }: Error) =>
      of(creators.error(context, message, stack))
    )
  );
}

export default catchWithContext;
