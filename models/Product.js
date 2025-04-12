const mongoose = require('mongoose');

const sustainabilitySchema = new mongoose.Schema({
  carbonFootprint: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'kg CO2e' }
  },
  waterUsage: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'liters' }
  },
  recycledMaterials: {
    percentage: { type: Number, min: 0, max: 100 },
    materials: [String]
  },
  certifications: [String],
  productionCountry: String,
  transportationMethod: String,
  packagingType: String,
  isVegan: { type: Boolean, default: false },
  isOrganic: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  imageUrl: String,
  sustainability: sustainabilitySchema,
  sustainabilityScore: { type: Number, min: 0, max: 100 },
  alternatives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
