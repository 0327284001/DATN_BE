import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    cusId: { type: String, maxlength: 255 },
    revenue_all: { type: Number, required: true },
    name_order: { type: String, maxlength: 255, required: true }, 
    phone_order: { type: String, maxlength: 15, required: true }, 
    address_order: { type: String, maxlength: 500, required: true }, 
    payment_method: { type: String, maxlength: 255, required: true }, 
    prodDetails: [{
        prodId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        revenue: { type: Number, required: true },
        quantity: { type: Number, required: true },
        prodSpecification: { type: String, maxlength: 255 }
    }],
    content: { type: String, maxlength: 255 },
    orderStatus: { type: String, maxlength: 255 },
    orderDate: { type: Date }
});

export default mongoose.model("Order", OrderSchema);
