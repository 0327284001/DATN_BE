import mongoose from 'mongoose';

const FeebackAppSchema = new mongoose.Schema({
    cusId: {
        type: String,
        maxlength: 255,
        required: true,
    },
    start: {
        type: Number,
        required: true,
    },
    content: {
        type: String,
        maxlength: 255,
    },
    dateFeed: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const FeebackAppModel = mongoose.model('FeebackApp', FeebackAppSchema);

export default FeebackAppModel;  // Sử dụng export default để xuất mô hình
