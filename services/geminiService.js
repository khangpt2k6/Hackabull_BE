const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Analyze product description to extract sustainability indicators
 * @param {string} productDescription - The product description to analyze
 * @returns {Promise<Object>} - Extracted sustainability indicators
 */
async function analyzeSustainability(productDescription) {
  const prompt = `
    Analyze the following product description and extract sustainability indicators:
    - Carbon footprint estimation (if mentioned)
    - Water usage (if mentioned)
    - Recycled materials percentage
    - Organic materials
    - Sustainable certifications
    - Ethical manufacturing practices
    - Local production indicators
    
    Product: ${productDescription}
    
    Please respond in JSON format with these fields:
    {
      "carbonFootprint": {"value": number, "unit": "kg CO2e"},
      "waterUsage": {"value": number, "unit": "liters"},
      "recycledMaterials": {"percentage": number, "materials": [string]},
      "certifications": [string],
      "isVegan": boolean,
      "isOrganic": boolean,
      "sustainabilityScore": number (0-100),
      "sustainabilityHighlights": [string],
      "sustainabilityConcerns": [string]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract the JSON part from the response
    const jsonStr = text.match(/\{[\s\S]*\}/);
    if (jsonStr) {
      return JSON.parse(jsonStr[0]);
    }
    
    throw new Error("Failed to extract JSON from AI response");
  } catch (error) {
    console.error("Error analyzing sustainability:", error);
    throw error;
  }
}

/**
 * Calculate a sustainability score based on various factors
 * @param {Object} product - The product data
 * @returns {number} - Sustainability score (0-100)
 */
function calculateSustainabilityScore(product) {
  let score = 50; // Start with a neutral score
  
  // Award points for sustainable attributes
  if (product.sustainability) {
    // Recycled materials
    if (product.sustainability.recycledMaterials && product.sustainability.recycledMaterials.percentage) {
      score += product.sustainability.recycledMaterials.percentage * 0.2;
    }
    
    // Certifications
    if (product.sustainability.certifications && product.sustainability.certifications.length > 0) {
      score += product.sustainability.certifications.length * 5;
    }
    
    // Organic
    if (product.sustainability.isOrganic) {
      score += 10;
    }
    
    // Vegan
    if (product.sustainability.isVegan) {
      score += 10;
    }
    
    // Carbon footprint - lower is better
    if (product.sustainability.carbonFootprint && product.sustainability.carbonFootprint.value) {
      const carbonValue = product.sustainability.carbonFootprint.value;
      if (carbonValue < 10) score += 10;
      else if (carbonValue < 50) score += 5;
      else if (carbonValue > 100) score -= 10;
    }
    
    // Water usage - lower is better
    if (product.sustainability.waterUsage && product.sustainability.waterUsage.value) {
      const waterValue = product.sustainability.waterUsage.value;
      if (waterValue < 100) score += 10;
      else if (waterValue < 500) score += 5;
      else if (waterValue > 1000) score -= 10;
    }
  }
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  analyzeSustainability,
  calculateSustainabilityScore
};