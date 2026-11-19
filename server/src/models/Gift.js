import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['card', 'coffee'], required: true },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
    itemName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 1 }, // RWF credited to the receiver's wallet
    recipientName: { type: String, required: true, trim: true },
    recipientEmail: { type: String, trim: true, lowercase: true, default: '' },
    recipientPhone: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: ['pending_payment', 'active', 'redeemed'], default: 'pending_payment' },
    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    redeemedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Gift', giftSchema);