import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // link to product
  email: { type: String, required: true },       // customer email
  location: { type: String, required: true },    // shipping or delivery location
  createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', orderSchema);