const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferences: {
    sustainabilityPriorities: [String],
    preferredCategories: [String],
    avoidedMaterials: [String]
  },
  history: {
    searches: [{
      query: String,
      timestamp: { type: Date, default: Date.now }
    }],
    viewedProducts: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);