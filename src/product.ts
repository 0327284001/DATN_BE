import mongoose, { Schema } from "mongoose";

export interface IProduct extends Document {
  namePro: string;
  price: number;
  desPro?: string;
  creatDatePro: Date;
  quantity: number;
  cateId: mongoose.Types.ObjectId;
  brand: string;
  statusPro: boolean;
  listPro: string;
  imgPro: string[];
  owerId: string;
  quantitySold?: number;
  soldDate?: Date;
  import_price: number;
  isHidden: boolean; // Thêm trường này vào interface
}

const ProductSchema = new mongoose.Schema({
  namePro: { type: String, required: true },
  price: { type: Number, required: true },
  desPro: { type: String, required: false },
  creatDatePro: { type: Date, required: true },
  quantity: { type: Number, required: true },
  cateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true },
  statusPro: { type: Boolean, required: true },
  listPro: { type: String, required: true },
  imgPro: { type: [String], maxlength: 255 }, 
  owerId: { type: String, required: true },  
  quantitySold: { type: Number, default: 0 },
  soldDate: { type: Date }, 
  import_price:{ type: Number, required: true },
  isHidden: { type: Boolean, default: false }, // Thêm trường này vào schema
});

export default mongoose.model<IProduct>("Product", ProductSchema);
