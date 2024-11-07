import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "./danhmuc";

export interface Product extends Document {
  _id: number;
  name: string;
  price: number;
  img: string;
  statusPro: boolean;
  desPro: string;
  createdDatePro: Date;
  quantity: number;
  brand: string;
  category: mongoose.Schema.Types.ObjectId;
}

const ProductSchema: Schema = new Schema({
  _id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
  statusPro: { type: Boolean, required: true },
  desPro: { type: String, required: true },
  createdDatePro: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  brand: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
});

export default mongoose.model<Product>("Product", ProductSchema);
