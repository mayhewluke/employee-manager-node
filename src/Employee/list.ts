import { Document } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { Employee, EmployeeModel } from "Employee";
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
      return bindNodeCallback<Partial<Employee>, Array<Employee & Document>>(
        // eslint-disable-next-line no-restricted-globals
        EmployeeModel.find.bind(EmployeeModel) as typeof EmployeeModel.find
      )({ userUid: uid.value });
    }),
    map(employees => creators.employeesList(employees)),
    catchWithContext("Failed to find the employees")
  );

export default list;
