import mongoose, { Document, Schema } from 'mongoose';

interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId; // Người gửi
  receiver: mongoose.Schema.Types.ObjectId; // Người nhận
  message: string; // Nội dung tin nhắn
  sentAt: Date; // Thời gian gửi
}

const MessageSchema: Schema = new Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
