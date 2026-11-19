import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['bogo', 'percent'], required: true },
    value: { type: Number, default: 0, min: 0, max: 100 }, // percent off (percent type only)
    categories: [{ type: String, enum: ['Coffee', 'Juices', 'Milkshakes', 'Snacks'] }], // empty = all
    code: { type: String, uppercase: true, trim: true }, // optional promo code
    autoApply: { type: Boolean, default: true }, // applied without a code
    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

promotionSchema.index({ code: 1 }, { unique: true, sparse: true });

promotionSchema.methods.isLive = function (now = new Date()) {
  return (
    this.active &&
    (!this.startsAt || this.startsAt <= now) &&
    (!this.endsAt || this.endsAt >= now)
  );
};

export default mongoose.model('Promotion', promotionSchema);