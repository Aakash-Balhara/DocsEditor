const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document',
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    email: { type: String },
    role: {
      type: String,
      enum: ['viewer', 'commenter', 'editor'],
      default: 'viewer'
    }
  }],
  comments: [{
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  versions: [{
    content: { type: String },
    title: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
