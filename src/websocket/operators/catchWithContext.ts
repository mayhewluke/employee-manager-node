import { of, pipe } from "rxjs";
import { catchError } from "rxjs/operators";

export default (context: string) =>
  pipe(
    catchError(({ message, stack }: Error) =>
      of({ context, message, stack, event: "error" })
    )
  );
