import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
  email: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, default: 'confirmed' },
  created_at: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', orderSchema);