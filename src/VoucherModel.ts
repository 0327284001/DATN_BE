import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa Interface cho Voucher
interface IVoucher extends Document {
  price_reduced: number;
  discount_code: string;
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
  },
});

// Xuất mô hình Voucher với kiểu dữ liệu IVoucher
export default mongoose.model<IVoucher>('Voucher', VoucherSchema);
