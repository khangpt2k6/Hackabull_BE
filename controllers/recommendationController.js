const recommendationService = require('../services/recommendationService');
const geminiService = require('../services/geminiService');
const Product = require('../models/Product');

/**
 * Get eco-friendly alternatives for a product
 */
exports.getAlternatives = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;
    
    const alternatives = await recommendationService.findEcoFriendlyAlternatives(productId, parseInt(limit));
    res.json(alternatives);
  } catch (error) {
    console.error('Error getting alternatives:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Compare two products
 */
exports.compareProducts = async (req, res) => {
  try {
    const { product1Id, product2Id } = req.params;
    
    const comparison = await recommendationService.compareProducts(product1Id, product2Id);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing products:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get sustainability tips for a category
 */
exports.getSustainabilityTips = async (req, res) => {
  try {
    const { category } = req.params;
    
    const tips = await recommendationService.getSustainabilityTips(category);
    res.json(tips);
  } catch (error) {
    console.error('Error getting sustainability tips:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Analyze a product description and return sustainability indicators
 */
exports.analyzeProductDescription = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: 'Product description is required' });
    }
    
    const analysis = await geminiService.analyzeSustainability(description);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing product description:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Calculate sustainability score for a product
 */
exports.calculateScore = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const score = geminiService.calculateSustainabilityScore(product);
    
    // Update the product with the new score
    product.sustainabilityScore = score;
    await product.save();
    
    res.json({ productId, sustainabilityScore: score });
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    res.status(500).json({ message: error.message });
  }
};