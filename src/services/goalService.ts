import { SavingsGoal } from '../models/SavingsGoal';

export class GoalService {
  static async createGoal(userId: string, body: any) {
    const { name, targetAmount, currentAmount, deadline } = body;

    const goal = await SavingsGoal.create({
      userId,
      name,
      targetAmount: Math.round(Number(targetAmount) * 100),
      currentAmount: currentAmount ? Math.round(Number(currentAmount) * 100) : 0,
      deadline: deadline ? new Date(deadline) : null,
    });

    const json = goal.toJSON();
    return {
      ...json,
      targetAmount: Number(json.targetAmount),
      currentAmount: Number(json.currentAmount),
    };
  }

  static async getGoals(userId: string) {
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    return goals.map((g) => {
      const json = g.toJSON();
      return {
        ...json,
        targetAmount: Number(json.targetAmount),
        currentAmount: Number(json.currentAmount),
      };
    });
  }

  static async updateGoalProgress(userId: string, id: string, currentAmount: number, mode: 'add' | 'set' = 'add') {
    const existing = await SavingsGoal.findOne({ _id: id, userId });

    if (!existing) {
      throw new Error('Goal not found');
    }

    const inputPaise = Math.round(Number(currentAmount) * 100);
    const rawAmount = mode === 'set' 
      ? inputPaise 
      : existing.currentAmount + inputPaise;

    const newCurrentAmount = rawAmount > existing.targetAmount ? existing.targetAmount : rawAmount;

    existing.currentAmount = newCurrentAmount;
    await existing.save();

    const json = existing.toJSON();
    return {
      ...json,
      targetAmount: Number(json.targetAmount),
      currentAmount: Number(json.currentAmount),
    };
  }

  static async deleteGoal(userId: string, id: string) {
    const existing = await SavingsGoal.findOne({ _id: id, userId });

    if (!existing) {
      throw new Error('Goal not found');
    }

    await SavingsGoal.deleteOne({ _id: id, userId });
  }
}
