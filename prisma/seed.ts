import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  // Fixed: "Other" was missing but the AI prompt uses it as a valid category
  { name: 'Other', color: '#94a3b8', icon: 'tag' },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isSystem: true,
      },
    });
  }
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
