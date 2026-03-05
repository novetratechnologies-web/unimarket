// models/TaxRate.js
import mongoose from 'mongoose';

const taxRateSchema = new mongoose.Schema({
  name: String,
  country: String,
  state: String,
  city: String,
  zipCode: String,
  rate: Number,
  priority: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('TaxRate', taxRateSchema);