import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa Interface cho Voucher
interface IVoucher extends Document {
  price_reduced: number;
  discount_code: string;
  quantity_voucher: 'giảm giá vận chuyển' | 'giảm giá sản phẩm';
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
      minlength: 5, // Yêu cầu mã giảm giá ít nhất 5 ký tự
    },
    quantity_voucher: {
      type: String,
      enum: ['giảm giá vận chuyển', 'giảm giá sản phẩm'],
      required: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // Thêm trường `id` vào kết quả trả về
        delete ret._id; // Loại bỏ `_id`
        delete ret.__v; // Loại bỏ phiên bản (__v)
        return ret;
      },
    },
  }
);

// Xuất mô hình Voucher với kiểu dữ liệu IVoucher
export default mongoose.model<IVoucher>('Voucher', VoucherSchema);
