
// models/Reply.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reply'
    }
  },
  { timestamps: true }
);

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
