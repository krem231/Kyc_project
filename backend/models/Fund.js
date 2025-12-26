const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'vnd'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  create_at: {
    type: Date,
    default: Date.now
  }
});

const Fund = mongoose.model('Fund', fundSchema);
module.exports = Fund;
