import { Document } from "mongoose";

import { ClientEmployee, Employee } from "Employee/model";

import { createMessage } from "./core";
import { MessageTypes } from "./types";

const creators = {
  authStatus: (isLoggedIn: boolean) =>
    createMessage(MessageTypes.AuthStatus, isLoggedIn),
  authSuccess: (uid: string) => createMessage(MessageTypes.AuthSuccess, uid),
  authenticate: (token: string) =>
    createMessage(MessageTypes.Authenticate, { token }),
  checkAuthStatus: () => createMessage(MessageTypes.CheckAuthStatus),
  createEmployee: (employee: ClientEmployee) =>
    createMessage(MessageTypes.CreateEmployee, employee),
  createEmployeeSuccess: () =>
    createMessage(MessageTypes.CreateEmployeeSuccess),
  deleteEmployee: (id: string) =>
    createMessage(MessageTypes.DeleteEmployee, id),
  deleteEmployeeSuccess: () =>
    createMessage(MessageTypes.DeleteEmployeeSuccess),
  employeesList: (employees: Employee[]) =>
    createMessage(MessageTypes.EmployeesList, employees),
  error: (context: string, message: string, stack?: string) =>
    createMessage(MessageTypes.Error, { context, message, stack }),
  listEmployees: () => createMessage(MessageTypes.ListEmployees),
  updateEmployee: (update: Partial<ClientEmployee & Document>) =>
    createMessage(MessageTypes.UpdateEmployee, update),
  updateEmployeeSuccess: () => createMessage(MessageTypes.UpdateEmployeeSuccess)
};

export default creators;
