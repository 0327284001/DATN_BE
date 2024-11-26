import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  details: { type: Array, default: [] }, // Chi tiết doanh thu
});

export default mongoose.model("Revenue", revenueSchema);
