import mongoose, { Schema } from "mongoose";

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
  imgPro: { type: [String], maxlength: 255 }, // Đây là một mảng chứa URL của hình ảnh
  owerId: { type: String, required: true },  // Owner ID
  quantitySold: { type: Number, default: 0 },
  soldDate: { type: Date }, 
  import_price:{ type: Number, required: true },
});


export default mongoose.model("Product", ProductSchema);
