import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    category: { type: String, required: true, enum: ['Coffee', 'Juices', 'Milkshakes', 'Snacks'] },
    price: { type: Number, required: true, min: 0 }, // RWF
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    customizable: {
      type: Boolean,
      default: function () {
        return ['Coffee', 'Milkshakes'].includes(this?.category);
      },
    },

    // Bean Passport details (used for Coffee items)
    brewMethod: { type: String, enum: ['', 'espresso', 'pour-over', 'cold-brew', 'drip'], default: '' },
    origin: { type: String, trim: true, default: '' },
    roast: { type: String, enum: ['', 'light', 'medium', 'dark'], default: '' },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, available: 1 });

export default mongoose.model('MenuItem', menuItemSchema);