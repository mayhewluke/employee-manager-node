import { Document } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { User, UserModel } from "authentication/User";
import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

const list = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.ListEmployees),
    switchMap(() => {
      if (uid.value === null) {
        throw new Error("Must be authenticated to create employees");
      }
      return bindNodeCallback<string, User & Document>(UserModel.findById.bind(
        UserModel
      ) as (id: string) => User & Document)(uid.value);
    }),
    map(user => creators.employeesList(user.employees)),
    catchWithContext("Failed to find the employees")
  );

export default list;
