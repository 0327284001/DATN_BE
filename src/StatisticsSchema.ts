import mongoose from "mongoose";

const StatisticsSchema = new mongoose.Schema({
  revenue: { type: Number, required: true }, // Doanh thu
  date: { type: Date, required: true }, // Ngày ghi nhận doanh thu
  owerId: { type: String, required: true }, // Owner ID để liên kết với user hoặc sản phẩm
});

export default mongoose.model("Statistics", StatisticsSchema);
