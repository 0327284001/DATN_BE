import mongoose, { Schema, Document } from "mongoose";

const TransactionSchema: Schema = new Schema({
  amount: { type: String },
  date: { type: Date, required: true },
});

export default mongoose.model<any>("Transaction", TransactionSchema);
