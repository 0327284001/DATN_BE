import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "./danhmuc";
// bên file index bọn tôi chỉ sửa những cái liên quan đến product 
export interface Product extends Document {
  // prodId sinh ngẫu nhiên dùng id mặc định của mongo
  owerId: number;           // ID của chủ sở hữu sản phẩm
  statusPro?: boolean;      // Trạng thái sản phẩm (có thể có hoặc không)
  price: number;            // Giá sản phẩm
  desPro?: string;          // Mô tả sản phẩm (tối đa 255 ký tự)
  creatDatePro?: Date;      // Ngày tạo sản phẩm
  quantity: number;         // Số lượng sản phẩm
  listPro?: string;         // Danh sách phân loại các loại mô hình, là cái danh mục đấy
  imgPro?: string[];        // Danh sách hình ảnh sản phẩm (tối đa 255 ký tự mỗi hình)
  namePro?: string;         // Tên sản phẩm (tối đa 255 ký tự)
  cateId: number;           // ID của danh mục sản phẩm
  brand?: string;           // Thương hiệu sản phẩm (tối đa 255 ký tự)
}

const ProductSchema: Schema = new Schema({
  owerId: { type: Number, required: true },
  statusPro: { type: Boolean },
  price: { type: Number, required: true },
  desPro: { type: String, maxlength: 255 },
  creatDatePro: { type: Date },
  quantity: { type: Number, required: true },
  listPro: { type: String, maxlength: 255 },
  imgPro: { type: [String], maxlength: 255 },
  namePro: { type: String, maxlength: 255 },
  cateId: { type: Number, required: true },
  brand: { type: String, maxlength: 255 },
});

export default mongoose.model<Product>("Product", ProductSchema);