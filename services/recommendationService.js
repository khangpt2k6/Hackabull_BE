// services/recommendationService.js
const Product = require('../models/Product');
const geminiService = require('./geminiService');

/**
 * Find eco-friendly alternatives to a product
 * @param {string} productId - The ID of the original product
 * @param {number} limit - Maximum number of alternatives to return
 * @returns {Promise<Array>} - List of alternative products
 */
async function findEcoFriendlyAlternatives(productId, limit = 5) {
  try {
    // Get the original product
    const originalProduct = await Product.findById(productId);
    if (!originalProduct) {
      throw new Error('Product not found');
    }

    // Find products in the same category with higher sustainability scores
    const alternatives = await Product.find({
      _id: { $ne: productId }, // Exclude the original product
      category: originalProduct.category, // Same category
      sustainabilityScore: { $gt: originalProduct.sustainabilityScore }, // Higher sustainability score
    })
    .sort({ sustainabilityScore: -1 }) // Sort by sustainability score (highest first)
    .limit(limit);

    // If we don't have enough alternatives, find other products in the same category
    if (alternatives.length < limit) {
      const additionalAlternatives = await Product.find({
        _id: { $ne: productId }, // Exclude the original product
        category: originalProduct.category, // Same category
        _id: { $nin: alternatives.map(a => a._id) }, // Exclude already found alternatives
      })
      .sort({ sustainabilityScore: -1 }) // Sort by sustainability score (highest first)
      .limit(limit - alternatives.length);

      alternatives.push(...additionalAlternatives);
    }

    return alternatives;
  } catch (error) {
    console.error('Error finding eco-friendly alternatives:', error);
    throw error;
  }
}

/**
 * Compare two products based on sustainability metrics
 * @param {string} productId1 - First product ID
 * @param {string} productId2 - Second product ID
 * @returns {Promise<Object>} - Comparison results
 */
async function compareProducts(productId1, productId2) {
  try {
    // Get both products
    const [product1, product2] = await Promise.all([
      Product.findById(productId1),
      Product.findById(productId2)
    ]);

    if (!product1 || !product2) {
      throw new Error('One or both products not found');
    }

    // Calculate comparison metrics
    const comparison = {
      products: {
        [product1._id]: {
          name: product1.name,
          brand: product1.brand,
          sustainabilityScore: product1.sustainabilityScore,
          price: product1.price
        },
        [product2._id]: {
          name: product2.name,
          brand: product2.brand,
          sustainabilityScore: product2.sustainabilityScore,
          price: product2.price
        }
      },
      comparisons: {
        sustainabilityScore: {
          difference: product1.sustainabilityScore - product2.sustainabilityScore,
          betterProduct: product1.sustainabilityScore > product2.sustainabilityScore ? product1._id : product2._id
        },
        price: {
          difference: product1.price - product2.price,
          betterProduct: product1.price < product2.price ? product1._id : product2._id
        },
        valueRatio: {
          product1: product1.sustainabilityScore / product1.price,
          product2: product2.sustainabilityScore / product2.price,
          betterProduct: (product1.sustainabilityScore / product1.price) > (product2.sustainabilityScore / product2.price) 
            ? product1._id : product2._id
        }
      },
      detailedComparison: {}
    };

    // Compare detailed sustainability metrics if available
    if (product1.sustainability && product2.sustainability) {
      // Carbon footprint comparison
      if (product1.sustainability.carbonFootprint && product2.sustainability.carbonFootprint) {
        comparison.detailedComparison.carbonFootprint = {
          values: {
            [product1._id]: product1.sustainability.carbonFootprint.value,
            [product2._id]: product2.sustainability.carbonFootprint.value
          },
          difference: product1.sustainability.carbonFootprint.value - product2.sustainability.carbonFootprint.value,
          betterProduct: product1.sustainability.carbonFootprint.value < product2.sustainability.carbonFootprint.value ? 
            product1._id : product2._id,
          unit: product1.sustainability.carbonFootprint.unit
        };
      }

      // Water usage comparison
      if (product1.sustainability.waterUsage && product2.sustainability.waterUsage) {
        comparison.detailedComparison.waterUsage = {
          values: {
            [product1._id]: product1.sustainability.waterUsage.value,
            [product2._id]: product2.sustainability.waterUsage.value
          },
          difference: product1.sustainability.waterUsage.value - product2.sustainability.waterUsage.value,
          betterProduct: product1.sustainability.waterUsage.value < product2.sustainability.waterUsage.value ? 
            product1._id : product2._id,
          unit: product1.sustainability.waterUsage.unit
        };
      }

      // Recycled materials comparison
      if (product1.sustainability.recycledMaterials && product2.sustainability.recycledMaterials) {
        comparison.detailedComparison.recycledMaterials = {
          values: {
            [product1._id]: product1.sustainability.recycledMaterials.percentage,
            [product2._id]: product2.sustainability.recycledMaterials.percentage
          },
          difference: product1.sustainability.recycledMaterials.percentage - product2.sustainability.recycledMaterials.percentage,
          betterProduct: product1.sustainability.recycledMaterials.percentage > product2.sustainability.recycledMaterials.percentage ? 
            product1._id : product2._id
        };
      }

      // Certifications comparison
      if (product1.sustainability.certifications && product2.sustainability.certifications) {
        comparison.detailedComparison.certifications = {
          values: {
            [product1._id]: product1.sustainability.certifications,
            [product2._id]: product2.sustainability.certifications
          },
          uniqueToProd1: product1.sustainability.certifications.filter(cert => 
            !product2.sustainability.certifications.includes(cert)),
          uniqueToProd2: product2.sustainability.certifications.filter(cert => 
            !product1.sustainability.certifications.includes(cert)),
          shared: product1.sustainability.certifications.filter(cert => 
            product2.sustainability.certifications.includes(cert))
        };
      }
    }

    // Generate AI-powered comparison summary
    try {
      const summaryPrompt = `
        Compare these two products from a sustainability perspective:
        
        Product 1: ${product1.name} by ${product1.brand}
        Sustainability Score: ${product1.sustainabilityScore}/100
        Price: $${product1.price}
        
        Product 2: ${product2.name} by ${product2.brand}
        Sustainability Score: ${product2.sustainabilityScore}/100
        Price: $${product2.price}
        
        ${product1.sustainability && product2.sustainability ? `
        Carbon Footprint: 
        - Product 1: ${product1.sustainability.carbonFootprint?.value || 'N/A'} ${product1.sustainability.carbonFootprint?.unit || ''}
        - Product 2: ${product2.sustainability.carbonFootprint?.value || 'N/A'} ${product2.sustainability.carbonFootprint?.unit || ''}
        
        Recycled Materials:
        - Product 1: ${product1.sustainability.recycledMaterials?.percentage || 'N/A'}%
        - Product 2: ${product2.sustainability.recycledMaterials?.percentage || 'N/A'}%
        ` : ''}
        
        Provide a brief (3-4 sentences) comparison summary focusing on sustainability, which product is more eco-friendly, and whether the price difference is justified by the sustainability benefits.
      `;

      const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await aiModel.generateContent(summaryPrompt);
      comparison.aiSummary = result.response.text();
    } catch (error) {
      console.error('Error generating AI comparison summary:', error);
      comparison.aiSummary = 'AI-powered comparison currently unavailable.';
    }

    return comparison;
  } catch (error) {
    console.error('Error comparing products:', error);
    throw error;
  }
}

/**
 * Get sustainability tips for a specific product category
 * @param {string} category - Product category
 * @returns {Promise<Object>} - Sustainability tips
 */
async function getSustainabilityTips(category) {
  try {
    const prompt = `
      Provide 3-5 specific sustainability tips for consumers looking to purchase products in the "${category}" category.
      Focus on:
      1. What sustainability features to look for
      2. Common greenwashing tactics to avoid
      3. How to properly dispose of or recycle the product
      4. Alternative more sustainable options in this category
      
      Format your response as a JSON object with this structure:
      {
        "category": "${category}",
        "tips": [
          {
            "title": "Tip title",
            "description": "Detailed explanation"
          }
        ],
        "greenwashingWarnings": [
          {
            "claim": "Common misleading claim",
            "reality": "The actual truth"
          }
        ],
        "disposalGuidance": "How to properly dispose of these products",
        "sustainableAlternatives": ["Alternative 1", "Alternative 2"]
      }
    `;

    const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await aiModel.generateContent(prompt);
    const text = result.response.text();
    
    // Extract the JSON part from the response
    const jsonStr = text.match(/\{[\s\S]*\}/);
    if (jsonStr) {
      return JSON.parse(jsonStr[0]);
    }
    
    throw new Error("Failed to extract JSON from AI response");
  } catch (error) {
    console.error("Error getting sustainability tips:", error);
    throw error;
  }
}

module.exports = {
  findEcoFriendlyAlternatives,
  compareProducts,
  getSustainabilityTips
};