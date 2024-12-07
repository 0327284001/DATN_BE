import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
  price_reduced: { type: Number, required: true },
  discount_code: { type: Number, required: true },
  quantity_voucher: { type: String, enum: ['giảm giá vận chuyển', 'giảm giá sản phẩm'], required: true },
});

export default mongoose.model('Voucher', VoucherSchema);
