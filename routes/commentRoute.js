const express = require('express');
const { createComment, getComment, replyComment, getCommentsAndReplies } = require('../controller/CommentController');
const { protected } = require('../middleware/auth')
const router = express.Router()

router
    .route('/:postId')
    .post(protected, createComment)
    .get(protected, getCommentsAndReplies)

router
    .route('/:commentId/reply')
    .post(protected, replyComment)


module.exports = router