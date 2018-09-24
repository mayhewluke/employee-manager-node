import { Document, ModelUpdateOptions } from "mongoose";
import { BehaviorSubject, bindNodeCallback, Observable, of } from "rxjs";
import { concatMap, mergeMap } from "rxjs/operators";

import { User, UserModel } from "authentication/User";
import { creators, Message, MessageTypes } from "websocket/messages";
import { catchWithContext, ofType } from "websocket/operators";

import { Employee } from "./model";

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
      return bindNodeCallback<any, any, ModelUpdateOptions, User & Document>(
        UserModel.findOneAndUpdate.bind(UserModel) as (
          conditions: any,
          update: any,
          options: ModelUpdateOptions,
          callback: any
        ) => User & Document
      )(
        { _id: uid.value },
        { $push: { employees: payload as Employee } },
        { new: true, runValidators: true }
      );
    }),
    mergeMap(user =>
      of(
        creators.createEmployeeSuccess(),
        creators.employeesList(user.employees)
      )
    ),
    catchWithContext("Failed to create the employee")
  );

export default create;
