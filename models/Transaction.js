const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  trackingId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETE', 'FAILED'], 
    default: 'PENDING' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
