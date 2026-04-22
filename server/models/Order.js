import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prize: { type: mongoose.Schema.Types.ObjectId, ref: 'Prize', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'in progress', 'delivered', 'rejected'], 
    default: 'pending' 
  },
  cost: { type: Number, required: true }, // Coins at time of order
  // Denormalized data for easier history display
  prizeTitle: { type: String },
  prizeImage: { type: String },
  userName: { type: String },
  userEmail: { type: String }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
