import { pipe } from "rxjs";
import { filter } from "rxjs/operators";

export default pipe(filter<any>(message => message.event !== "authenticate"));
