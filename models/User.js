const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  credits: { 
    type: Number, 
    default: 100 
  },
  apiKey: { 
    type: String, 
    default: () => 'sm_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) 
  },
  webhookUrl: { 
    type: String, 
    default: 'https://scorpiomorde.io/api/v1/callback' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
