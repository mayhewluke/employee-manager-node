import { Document } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable, of } from "rxjs";
import { concatMap, mergeMap } from "rxjs/operators";

import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

import { ClientEmployee, Employee, EmployeeModel } from "./model";

// `delete` is a reserved keyword
const deleteEmployee = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.DeleteEmployee),
    concatMap(({ payload }) => {
      if (uid.value === null) {
        throw new Error("Must be authenticated to delete employees");
      }
      // Delete the employee
      return bindNodeCallback<Partial<ClientEmployee & Document>>(
        EmployeeModel.deleteOne.bind(
          EmployeeModel
        ) as typeof EmployeeModel.deleteOne
      )({ _id: payload });
    }),
    mergeMap(({ n }: any) => {
      if (n === 0) {
        throw new Error("No employee matching that id");
      }
      // Find all the Employees for the current user
      return bindNodeCallback<Partial<Employee>, Array<Employee & Document>>(
        // eslint-disable-next-line no-restricted-globals
        EmployeeModel.find.bind(EmployeeModel) as typeof EmployeeModel.find
      )({ userUid: uid.value! });
    }),
    // Emit the success message first, then emit the updates list of Employees
    mergeMap(employees =>
      of(creators.deleteEmployeeSuccess(), creators.employeesList(employees))
    ),
    catchWithContext("Failed to delete the employee")
  );

export default deleteEmployee;
