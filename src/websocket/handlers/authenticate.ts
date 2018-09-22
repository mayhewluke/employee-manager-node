import { from, Observable, pipe, UnaryFunction } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import firebaseAdmin from "firebaseAdmin";
import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

const authenticate: UnaryFunction<
  Observable<Message>,
  Observable<Message>
> = pipe(
  ofType(MessageTypes.Authenticate),
  switchMap(({ payload: { token } }) =>
    from(firebaseAdmin.auth().verifyIdToken(token)).pipe(
      map(creators.authSuccess),
      catchWithContext("Failed to authenticate with Firebase")
    )
  )
);

export default authenticate;
