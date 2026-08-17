import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';

const categories = [
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

export async function seedCategories() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('DATABASE_URL or MONGODB_URI environment variable is missing.');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  logger.info('Seeding default categories...');
  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      { name: cat.name, color: cat.color, icon: cat.icon, isSystem: true },
      { upsert: true, returnDocument: 'after' }
    );
  }
  logger.info('Default categories seeded successfully!');
}

if (require.main === module) {
  seedCategories()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      logger.error(err, 'Failed to seed categories');
      process.exit(1);
    });
}
