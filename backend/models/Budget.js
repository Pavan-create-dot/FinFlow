const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true }, // Stored in paise
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
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
      transform: (_doc, ret) => {
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

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;
