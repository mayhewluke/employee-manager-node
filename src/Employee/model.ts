import { Document, model, Model, Schema } from "mongoose";

export interface ClientEmployee {
  employeeName: string;
  phone: string;
  shift: string; // TODO make this a ShiftDay like in the client app
}

export interface Employee extends ClientEmployee {
  userUid: string;
}

export const EmployeeSchema = new Schema({
  employeeName: { type: String, required: true },
  phone: { type: String, required: true },
  shift: { type: String, required: true },
  userUid: { type: String, required: true }
});

export const EmployeeModel: Model<Employee & Document> = model(
  "Employee",
  EmployeeSchema
);
