import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId | string;
  statementId?: mongoose.Types.ObjectId | string | null;
  date: Date;
  amount: number; // Stored in paise/cents
  description: string;
  originalText: string;
  merchantName?: string | null;
  isSubscription: boolean;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: mongoose.Types.ObjectId | string | any;
  category?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    statementId: { type: Schema.Types.ObjectId, ref: 'Statement', default: null },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    originalText: { type: String, required: true },
    merchantName: { type: String, default: null },
    isSubscription: { type: Boolean, default: false },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.statementId) ret.statementId = ret.statementId.toString();
        if (ret.categoryId && typeof ret.categoryId === 'object') {
          const catId = (ret.categoryId.id || ret.categoryId._id || '').toString();
          ret.category = {
            id: catId,
            name: ret.categoryId.name,
            color: ret.categoryId.color,
            icon: ret.categoryId.icon,
          };
          ret.categoryId = catId;
        } else if (ret.categoryId) {
          ret.categoryId = ret.categoryId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.statementId) ret.statementId = ret.statementId.toString();
        if (ret.categoryId && typeof ret.categoryId === 'object') {
          const catId = (ret.categoryId.id || ret.categoryId._id || '').toString();
          ret.category = {
            id: catId,
            name: ret.categoryId.name,
            color: ret.categoryId.color,
            icon: ret.categoryId.icon,
          };
          ret.categoryId = catId;
        } else if (ret.categoryId) {
          ret.categoryId = ret.categoryId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
