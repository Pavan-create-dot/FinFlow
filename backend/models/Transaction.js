const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    statementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Statement', default: null },
    date: { type: Date, required: true },
    amount: { type: Number, required: true }, // Stored in paise
    description: { type: String, required: true },
    originalText: { type: String, required: true },
    merchantName: { type: String, default: null },
    isSubscription: { type: Boolean, default: false },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
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
      transform: (_doc, ret) => {
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

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
