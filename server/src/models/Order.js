import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    unitPrice: { type: Number, required: true }, // includes customizations
    quantity: { type: Number, required: true, min: 1 },
    customization: {
      size: String,
      milk: String,
      syrup: String,
      syrupPumps: Number,
      extraShots: Number,
      notes: String,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    freeDrinkDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    promotion: { type: String, default: '' }, // name of the promo applied

    type: { type: String, enum: ['pickup', 'curbside', 'table'], default: 'pickup' },
    scheduledFor: { type: Date, default: null },
    tableNumber: { type: Number, default: null },
    curbsideInfo: { type: String, default: '', maxlength: 120 }, // e.g. car colour / plate
    note: { type: String, default: '', maxlength: 300 },

    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
        paymentMethod: { type: String, enum: ['cash', 'mtn', 'airtel', 'momo', 'card', 'wallet'], default: 'cash' },
    // submitted = the customer says they paid by mobile money; staff still have to confirm it
    paymentStatus: { type: String, enum: ['unpaid', 'submitted', 'paid', 'refunded'], default: 'unpaid' },
    paymentRef: { type: String, default: '' }, // transaction ID from the mobile money SMS
    paymentSubmittedAt: { type: Date, default: null },
    usedFreeDrink: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
    rewarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);