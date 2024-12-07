import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa Interface cho Voucher
interface IVoucher extends Document {
  price_reduced: number;
  discount_code: String;
  quantity_voucher: 'giảm giá vận chuyển' | 'giảm giá sản phẩm';
}

// Định nghĩa VoucherSchema với interface IVoucher
const VoucherSchema: Schema<IVoucher> = new Schema({
  price_reduced: { type: Number, required: true },
  discount_code: { type: String, required: true },
  quantity_voucher: {
    type: String,
    enum: ['giảm giá vận chuyển', 'giảm giá sản phẩm'],
    required: true,
  },
});

// Xuất mô hình Voucher với kiểu dữ liệu IVoucher
export default mongoose.model<IVoucher>('Voucher', VoucherSchema);
