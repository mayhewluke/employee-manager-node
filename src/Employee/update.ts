import { Document, ModelUpdateOptions } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable, of } from "rxjs";
import { concatMap, mergeMap } from "rxjs/operators";

import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

import { ClientEmployee, Employee, EmployeeModel } from "./model";

const update = (
  source: Observable<Message>,
  uid: BehaviorSubject<string | null>
): Observable<Message> =>
  source.pipe(
    ofType(MessageTypes.UpdateEmployee),
    concatMap(({ payload }) => {
      if (uid.value === null) {
        throw new Error("Must be authenticated to update employees");
      }
      // Update the employee
      return bindNodeCallback<
        Partial<ClientEmployee & Document>,
        Partial<ClientEmployee & Document>,
        ModelUpdateOptions
      >(EmployeeModel.updateOne.bind(
        EmployeeModel
        // eslint-disable-next-line no-underscore-dangle
      ) as typeof EmployeeModel.updateOne)({ _id: payload._id }, payload, {
        runValidators: true
      });
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
      of(creators.updateEmployeeSuccess(), creators.employeesList(employees))
    ),
    catchWithContext("Failed to update the employee")
  );

export default update;
