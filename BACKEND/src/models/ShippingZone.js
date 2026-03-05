// models/ShippingZone.js
import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema({
  name: String,
  countries: [{
    country: String,
    state: String,
    zipCodes: [String]
  }],
  methods: [{
    name: String,
    carrier: String,
    rate: Number,
    freeShippingThreshold: Number,
    minWeight: Number,
    maxWeight: Number,
    minValue: Number,
    maxValue: Number,
    estimatedDays: {
      min: Number,
      max: Number
    },
    guaranteed: Boolean,
    requiresSignature: Boolean
  }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ShippingZone', shippingZoneSchema);