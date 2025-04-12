// scripts/seedProducts.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const geminiService = require('../services/geminiService');

dotenv.config();

// Sample product data
const sampleProducts = [
  {
    name: "Organic Cotton T-Shirt",
    description: "Made from 100% organic cotton grown without harmful pesticides. This t-shirt is GOTS certified and produced in a factory that uses renewable energy. The manufacturing process uses 91% less water than conventional cotton and has a carbon footprint of just 2.1 kg CO2e.",
    price: 24.99,
    category: "Clothing",
    brand: "EcoWear",
    imageUrl: "https://example.com/tshirt.jpg",
    sustainability: {
      carbonFootprint: {
        value: 2.1,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 400,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 0,
        materials: []
      },
      certifications: ["GOTS", "Fair Trade"],
      productionCountry: "Portugal",
      transportationMethod: "Sea freight",
      packagingType: "Recycled paper",
      isVegan: true,
      isOrganic: true
    }
  },
  {
    name: "Standard Cotton T-Shirt",
    description: "Classic cotton t-shirt made from standard cotton. Comfortable fit and durable quality.",
    price: 15.99,
    category: "Clothing",
    brand: "BasicBrand",
    imageUrl: "https://example.com/basic-tshirt.jpg",
    sustainability: {
      carbonFootprint: {
        value: 5.4,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 2700,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 0,
        materials: []
      },
      certifications: [],
      productionCountry: "Bangladesh",
      transportationMethod: "Air freight",
      packagingType: "Plastic bag",
      isVegan: true,
      isOrganic: false
    }
  },
  {
    name: "Recycled Plastic Water Bottle",
    description: "Durable water bottle made from 100% recycled plastic. This bottle is BPA-free and helps reduce single-use plastic waste. Each bottle repurposes approximately one pound of plastic that would otherwise end up in landfills or oceans.",
    price: 19.99,
    category: "Home",
    brand: "GreenLife",
    imageUrl: "https://example.com/bottle.jpg",
    sustainability: {
      carbonFootprint: {
        value: 1.2,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 50,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 100,
        materials: ["Recycled PET"]
      },
      certifications: ["B Corp"],
      productionCountry: "USA",
      transportationMethod: "Ground shipping",
      packagingType: "Minimal recycled cardboard",
      isVegan: true,
      isOrganic: false
    }
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Premium stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. Durable and designed to last a lifetime, reducing the need for disposable bottles.",
    price: 29.99,
    category: "Home",
    brand: "EcoFlow",
    imageUrl: "https://example.com/steel-bottle.jpg",
    sustainability: {
      carbonFootprint: {
        value: 7.8,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 180,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 30,
        materials: ["Recycled steel"]
      },
      certifications: ["B Corp", "Climate Neutral"],
      productionCountry: "China",
      transportationMethod: "Sea freight",
      packagingType: "Recycled paper",
      isVegan: true,
      isOrganic: false
    }
  },
  {
    name: "Conventional Plastic Water Bottle",
    description: "Standard plastic water bottle for everyday use. Lightweight and affordable.",
    price: 5.99,
    category: "Home",
    brand: "BasicBrand",
    imageUrl: "https://example.com/plastic-bottle.jpg",
    sustainability: {
      carbonFootprint: {
        value: 4.2,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 100,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 0,
        materials: []
      },
      certifications: [],
      productionCountry: "China",
      transportationMethod: "Air freight",
      packagingType: "Plastic wrap",
      isVegan: true,
      isOrganic: false
    }
  },
  {
    name: "Bamboo Toothbrush Set",
    description: "Pack of 4 toothbrushes with biodegradable bamboo handles and BPA-free nylon bristles. The packaging is plastic-free and compostable. Bamboo is one of the fastest-growing plants and doesn't require pesticides or fertilizers.",
    price: 12.99,
    category: "Personal Care",
    brand: "EcoSmile",
    imageUrl: "https://example.com/toothbrush.jpg",
    sustainability: {
      carbonFootprint: {
        value: 0.5,
        unit: "kg CO2e"
      },
      waterUsage: {
        value: 30,
        unit: "liters"
      },
      recycledMaterials: {
        percentage: 0,
        materials: []
      },
      certifications: ["Plastic Free", "Compostable"],
      productionCountry: "Vietnam",
      transportationMethod: "Sea freight",
      packagingType: "Compostable paper",
      isVegan: true,
      isOrganic: true
    }
  }
];

// Connect to database
async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Calculate sustainability scores for each product
    const productsWithScores = sampleProducts.map(product => {
      const score = geminiService.calculateSustainabilityScore(product);
      return { ...product, sustainabilityScore: score };
    });
    
    // Insert the sample products
    await Product.insertMany(productsWithScores);
    console.log(`Added ${productsWithScores.length} sample products with sustainability scores`);
    
    mongoose.disconnect();
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();