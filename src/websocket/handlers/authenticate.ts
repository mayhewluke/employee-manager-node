import { from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import firebaseAdmin from "firebaseAdmin";
import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

const authenticate = (source: Observable<Message>): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.Authenticate),
    switchMap(({ payload: { token } }) =>
      from(firebaseAdmin.auth().verifyIdToken(token)).pipe(
        map(({ uid }) => creators.authSuccess(uid)),
        catchWithContext("Failed to authenticate with Firebase")
      )
    )
  );

export default authenticate;
