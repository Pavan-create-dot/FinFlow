const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, default: null },
    bankName: { type: String, default: 'Unknown Bank' },
    status: { 
      type: String, 
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
      default: 'PENDING' 
    },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId) ret.userId = ret.userId.toString();
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Statement = mongoose.model('Statement', statementSchema);
module.exports = Statement;
