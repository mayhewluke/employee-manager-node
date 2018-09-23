import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

import { creators, Message, MessageTypes } from "websocket/messages";
import { ofType } from "websocket/operators";

const isLoggedIn = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.CheckAuthStatus),
    map(() => creators.authStatus(uid.value !== null))
  );

export default isLoggedIn;
