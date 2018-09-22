import { Observable } from "rxjs";
import { filter } from "rxjs/operators";

import { Message } from "websocket/messages";

const ofType = <T extends Message, K extends string>(key: K) => (
  source: Observable<T>
): Observable<Extract<T, { type: K }>> => {
  const fn = filter<T, Extract<T, { type: K }>>(filterFn(key));
  return source.pipe(fn);
};

function filterFn<T extends Message, K extends string>(key: K) {
  return function foo(message: T): message is Extract<T, { type: K }> {
    return message.type === key;
  };
}

export default ofType;
