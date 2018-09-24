import { Employee } from "Employee/model";

import { createMessage } from "./core";
import { MessageTypes } from "./types";

const creators = {
  authStatus: (isLoggedIn: boolean) =>
    createMessage(MessageTypes.AuthStatus, isLoggedIn),
  authSuccess: (uid: string) => createMessage(MessageTypes.AuthSuccess, uid),
  authenticate: (token: string) =>
    createMessage(MessageTypes.Authenticate, { token }),
  checkAuthStatus: () => createMessage(MessageTypes.CheckAuthStatus),
  createEmployee: (employee: Employee) =>
    createMessage(MessageTypes.CreateEmployee, employee),
  createEmployeeSuccess: () =>
    createMessage(MessageTypes.CreateEmployeeSuccess),
  employeesList: (employees: Employee[]) =>
    createMessage(MessageTypes.EmployeesList, employees),
  error: (context: string, message: string, stack?: string) =>
    createMessage(MessageTypes.Error, { context, message, stack }),
  listEmployees: () => createMessage(MessageTypes.ListEmployees)
};

export default creators;
