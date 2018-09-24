import { Document } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable, of } from "rxjs";
import { concatMap, mergeMap } from "rxjs/operators";

import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

import { Employee, EmployeeModel } from "./model";

const create = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.CreateEmployee),
    concatMap(({ payload }) => {
      if (uid.value === null) {
        throw new Error("Must be authenticated to create employees");
      }
      // TODO find a better way to work with these methods
      // Add the userUid and create the Employee
      return bindNodeCallback<Employee, Employee & Document>(
        EmployeeModel.create.bind(EmployeeModel) as (
          employee: Employee,
          callback: any
        ) => Employee & Document
      )({ ...payload, userUid: uid.value });
    }),
    // Find all the Employees for the current user
    mergeMap(() =>
      bindNodeCallback<Partial<Employee>, Array<Employee & Document>>(
        // eslint-disable-next-line no-restricted-globals
        EmployeeModel.find.bind(EmployeeModel) as typeof EmployeeModel.find
      )({ userUid: uid.value! })
    ),
    // Emit the success message first, then emit the updates list of Employees
    mergeMap(employees =>
      of(creators.createEmployeeSuccess(), creators.employeesList(employees))
    ),
    catchWithContext("Failed to create the employee")
  );

export default create;
