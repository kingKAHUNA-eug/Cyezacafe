import mongoose from 'mongoose';

// One entry per coffee a customer has tried (Bean Passport).
const passportEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    brewMethod: { type: String, default: '' },
    origin: { type: String, default: '' },
    roast: { type: String, default: '' },
    timesTried: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: null },
    notes: { type: String, maxlength: 300, default: '' },
    firstTriedAt: { type: Date, default: Date.now },
    lastTriedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

passportEntrySchema.index({ user: 1, menuItem: 1 }, { unique: true });

export default mongoose.model('PassportEntry', passportEntrySchema);