import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa Interface cho Voucher
interface IVoucher extends Document {
  price_reduced: number;
  discount_code: string;
<<<<<<< HEAD
  quantity_voucher: 'giảm giá vận chuyển' | 'giảm giá sản phẩm';
  id: string;  // Thêm id vào interface nếu bạn muốn rõ ràng về kiểu dữ liệu của id
}

// Định nghĩa VoucherSchema với interface IVoucher
const VoucherSchema: Schema<IVoucher> = new Schema(
  {
    price_reduced: { 
      type: Number, 
      required: true, 
      min: 0, // Không cho phép giá trị âm
    },
    discount_code: { 
      type: String, 
      required: true, 
      unique: true, // Đảm bảo mã giảm giá là duy nhất
      trim: true, // Loại bỏ khoảng trắng thừa
      minlength: 5, // Ví dụ, yêu cầu mã giảm giá ít nhất 5 ký tự
    },
    quantity_voucher: {
      type: String,
      enum: ['giảm giá vận chuyển', 'giảm giá sản phẩm'],
      required: true,
    },
=======
  quantity_voucher: 'Giảm giá vận chuyển' | 'Giảm giá sản phẩm';
}

// Định nghĩa VoucherSchema với interface IVoucher
const VoucherSchema: Schema<IVoucher> = new Schema({
  price_reduced: { type: Number, required: true },
  discount_code: { type: String, required: true },
  quantity_voucher: {
    type: String,
    enum: ['Giảm giá vận chuyển', 'Giảm giá sản phẩm'],
    required: true,
>>>>>>> bfebbcc5a4004232810a6180dda251952c901318
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // Thêm trường `id` vào kết quả trả về
        delete ret._id;  // Loại bỏ `_id`
        return ret;
      },
    },
  }
);

// Xuất mô hình Voucher với kiểu dữ liệu IVoucher
export default mongoose.model<IVoucher>('Voucher', VoucherSchema);
