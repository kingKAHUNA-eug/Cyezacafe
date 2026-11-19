import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    drinksTotal: { type: Number, required: true },
    drinksRemaining: { type: Number, required: true },
    days: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'active', 'expired', 'cancelled'],
      default: 'pending_payment',
    },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);