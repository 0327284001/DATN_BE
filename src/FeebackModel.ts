import mongoose from 'mongoose'; // Chỉ import mongoose một lần
import { IProduct } from "./product";

interface IFeedback extends Document {
    cusId: string;
    prodId: mongoose.Types.ObjectId | IProduct; // Có thể là ObjectId hoặc đối tượng Product
    start: number;
    dateFeed: Date;
}

const FeebackSchema = new mongoose.Schema({
    cusId: {
        type: String,
        required: true,
    },
    prodId: {
        type: mongoose.Schema.Types.ObjectId, // Dùng ObjectId để liên kết đến sản phẩm
        ref: 'Product', // Tham chiếu đến collection 'product'
        required: true,
    },

    start: { // Sửa tên trường từ 'start' thành 'stars'
        type: Number,
        required: true,
        min: 1,
        max: 5, // Xếp hạng thường từ 1 đến 5
    },
    dateFeed: {
        type: Date,
        default: Date.now, // Đặt ngày mặc định là ngày hiện tại
    },
});

const FeebackModel = mongoose.model('feeback', FeebackSchema);
export default FeebackModel; // Sử dụng export thay vì module.exports nếu dùng ES6
