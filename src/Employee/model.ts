import { Schema } from "mongoose";

export interface Employee {
  employeeName: string;
  phone: string;
  shift: string; // TODO make this a ShiftDay like in the client app
}

export const EmployeeSchema = new Schema({
  employeeName: { type: String, required: true },
  phone: { type: String, required: true },
  shift: { type: String, required: true }
});
