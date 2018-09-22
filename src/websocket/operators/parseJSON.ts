import { of, pipe } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

import { catchWithContext } from "websocket/operators";

export default pipe(
  mergeMap((message: any) =>
    of(message).pipe(
      map(x => JSON.parse(x)),
      catchWithContext(`Could not parse message as JSON: ${message}`)
    )
  )
);
