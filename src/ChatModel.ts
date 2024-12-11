import mongoose from 'mongoose';

// Khai báo schema cho Chat
const ChatSchema = new mongoose.Schema({
    cusId: {
        type: String, // ID người gửi
        maxlength: 255,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết tới bảng User
        required: true,
    },
    message: {
        type: String, // Nội dung tin nhắn
        required: true,
    },
    chatType: {
        type: String, // Loại tin nhắn
        enum: ['Văn bản', 'Hình ảnh', 'Video'],
        required: true,
    },
    timestamp: {
        type: Date, // Thời gian gửi
        default: Date.now,
    },
    chatStatus: {
        type: String, // Trạng thái tin nhắn
        enum: ['Đã gửi', 'Đã nhận', 'Đã đọc'],
        default: 'Đã gửi',
    },
});

// Khởi tạo model cho Chat
const ChatModel = mongoose.model('chat', ChatSchema);

export default ChatModel;
