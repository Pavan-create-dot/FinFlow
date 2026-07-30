import { prisma } from '../lib/prisma';

export class GoalService {
  static async createGoal(userId: string, body: any) {
    const { name, targetAmount, currentAmount, deadline } = body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: BigInt(Math.round(Number(targetAmount) * 100)),
        currentAmount: currentAmount ? BigInt(Math.round(Number(currentAmount) * 100)) : BigInt(0),
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    return {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    };
  }

  static async getGoals(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return goals.map((g: any) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
    }));
  }

  static async updateGoalProgress(userId: string, id: string, currentAmount: number, mode: 'add' | 'set' = 'add') {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new Error('Goal not found');
    }

    const inputPaise = BigInt(Math.round(Number(currentAmount) * 100));
    const rawAmount = mode === 'set' 
      ? inputPaise 
      : existing.currentAmount + inputPaise;
    // Clamp to target so currentAmount never exceeds targetAmount in the DB
    const newCurrentAmount = rawAmount > existing.targetAmount ? existing.targetAmount : rawAmount;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newCurrentAmount }
    });

    return {
      ...updated,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
    };
  }

  static async deleteGoal(userId: string, id: string) {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new Error('Goal not found');
    }

    await prisma.savingsGoal.delete({
      where: { id }
    });
  }
}
