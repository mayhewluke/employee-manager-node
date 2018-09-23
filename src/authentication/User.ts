import { Document, model, Model, Schema } from "mongoose";

// Important: keep the interface and the Schema in sync!
export interface User {
  _id: string;
}

const UserSchema = new Schema({
  _id: String,
});

export const UserModel: Model<User & Document> = model("User", UserSchema);
