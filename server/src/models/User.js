import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    // Loyalty and balances
    points: { type: Number, default: 0, min: 0 },
    punches: { type: Number, default: 0, min: 0 }, // progress toward the next free drink
    freeDrinks: { type: Number, default: 0, min: 0 },
    wallet: { type: Number, default: 0, min: 0 }, // RWF credit (gift cards, refunds)
    totalSpent: { type: Number, default: 0, min: 0 },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);