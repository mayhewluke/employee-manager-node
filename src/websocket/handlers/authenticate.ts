import { from, pipe } from "rxjs";
import { filter, mapTo, switchMap } from "rxjs/operators";

import firebaseAdmin from "firebaseAdmin";
import { catchWithContext } from "websocket/operators";

export default pipe(
  filter<any>(message => message.event === "authenticate"),
  switchMap(message =>
    from(firebaseAdmin.auth().verifyIdToken(message.token)).pipe(
      mapTo({ event: "authSuccess" }),
      catchWithContext("Failed to authenticate with Firebase")
    )
  )
);
