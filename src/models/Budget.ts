import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId | string;
  categoryId: mongoose.Types.ObjectId | string | any;
  category?: any;
  amount: number; // Stored in paise/cents
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId) ret.userId = ret.userId.toString();
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

budgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
