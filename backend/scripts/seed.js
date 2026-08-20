require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const defaultCategories = [
  { name: 'Food & Dining', color: '#10b981', icon: 'utensils' },
  { name: 'Shopping', color: '#6366f1', icon: 'shopping-bag' },
  { name: 'Transportation', color: '#0ea5e9', icon: 'car' },
  { name: 'Housing', color: '#f59e0b', icon: 'home' },
  { name: 'Subscriptions', color: '#f43f5e', icon: 'refresh' },
  { name: 'Entertainment', color: '#a855f7', icon: 'film' },
  { name: 'Health', color: '#ec4899', icon: 'heart' },
  { name: 'Investments', color: '#22c55e', icon: 'trending-up' },
  { name: 'Salary', color: '#10b981', icon: 'dollar-sign' },
  { name: 'Other', color: '#94a3b8', icon: 'tag' },
];

async function seedCategories() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('DATABASE_URL or MONGODB_URI environment variable is missing.');
    return;
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('🌱 Seeding default categories...');
  for (const cat of defaultCategories) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      { name: cat.name, color: cat.color, icon: cat.icon, isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✅ Default categories seeded successfully!');
}

if (require.main === module) {
  seedCategories()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed categories:', err);
      process.exit(1);
    });
}

module.exports = { seedCategories };
