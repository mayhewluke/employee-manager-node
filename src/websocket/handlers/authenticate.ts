import { ModelUpdateOptions } from "mongoose";
import { bindNodeCallback, from, Observable, pipe, UnaryFunction } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";

import firebaseAdmin from "firebaseAdmin";
import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

import { User, UserModel } from "authentication/User";

const authenticate: UnaryFunction<
  Observable<Message>,
  Observable<Message>
> = pipe(
  ofType(MessageTypes.Authenticate),
  switchMap(({ payload: { token } }) =>
    from(firebaseAdmin.auth().verifyIdToken(token)).pipe(
      mergeMap(({ uid }) =>
        // Must specify type for bindNodeCallback or else TypeScript can't
        // figure out the right overload. Must also typecast the result of
        // `.bind` since it automatically casts to `any`. `.bind` is needed
        // since mongoose methods use `this`, and `bindNodeCallback` loses
        // reference to `this`. And finally, the upsert is idempotent due to
        // only upserting the id - since we replace with the same values we
        // select, nothing will change if we get a match (eg. this is 'insert if
        // not found' rather than upsert)
        bindNodeCallback<Partial<User>, Partial<User>, ModelUpdateOptions>(
          UserModel.updateOne.bind(UserModel) as typeof UserModel.updateOne
        )({ _id: uid }, { _id: uid }, { upsert: true })
      ),
      map(creators.authSuccess),
      catchWithContext("Failed to authenticate with Firebase")
    )
  )
);

export default authenticate;
