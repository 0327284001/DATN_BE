
import mongoose, { Schema } from 'mongoose';


const VoucherSchema = new Schema(
  {
    price_reduced: { 
      type: Number, 
      required: true, 
      min: 0, 
    },
    discount_code: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
    },
    quantity_voucher: {
      type: String,
      enum: ['Giảm giá vận chuyển', 'Giảm giá sản phẩm'],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Voucher', VoucherSchema);

