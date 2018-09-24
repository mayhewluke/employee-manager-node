import { MessagesUnion } from "./core";
import creators from "./creators";

export enum MessageTypes {
  AuthSuccess = "AuthSuccess",
  AuthStatus = "AuthStatus",
  Authenticate = "Authenticate",
  Error = "Error",
  CheckAuthStatus = "CheckAuthStatus",
  CreateEmployee = "CreateEmployee",
  CreateEmployeeSuccess = "CreateEmployeeSuccess",
  EmployeesList = "EmployeesList",
  ListEmployees = "ListEmployees",
  UpdateEmployee = "UpdateEmployee",
  UpdateEmployeeSuccess = "UpdateEmployeeSuccess"
}

export type Message = MessagesUnion<typeof creators>;
