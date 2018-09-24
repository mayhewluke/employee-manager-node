import { Document, model, Model, Schema } from "mongoose";

import { Employee, EmployeeSchema } from "Employee/model";

// Important: keep the interface and the Schema in sync!
export interface User {
  _id: string;
  employees: Employee[];
}

const UserSchema = new Schema({
  _id: { type: String, required: true },
  employees: { type: [EmployeeSchema], required: true }
});

export const UserModel: Model<User & Document> = model("User", UserSchema);
