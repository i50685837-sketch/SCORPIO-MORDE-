const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'stopped'], 
    default: 'active' 
  },
  cost: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Bot', botSchema);
