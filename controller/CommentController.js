const asyncHandler = require('../middleware/asyncHandler')
const Comment = require('../models/Comment')
const Post = require('../models/Post')
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')
const successResponse = require('../utils/successResponse')

// @desc    Create Post
// @route   POST /api/v1/comment/:postId
// @access  Private
exports.createComment = asyncHandler(async (req, res, next) => {

    const userId = req.user.id
    const postId = req.params.postId

    const post = await Post.findById(postId)
    const user = await User.findById(userId)

    if (!post) {
        return next(new ErrorResponse(`Post with ID ${postId} not found`, 404))
    }

    if (!user) {
        return next(new ErrorResponse(`You not found`, 404))
    }

    const { content } = req.body

    const comment = new Comment({
        content,
        user: userId,
        post: postId,
    });

    await comment.save()

    successResponse(res, 201, 'You just created a comment now', comment)

})

// @desc    Reply Comment
// @route   POST /api/v1/comment/:commentId/reply
// @access  Private
exports.replyComment = asyncHandler(async (req, res, next) => {

    const userId = req.user.id

    const { content } = req.body;
    const { commentId } = req.params;

    const user = await User.findById(userId)

    const comment = await Comment.findById(commentId)

    if (!comment) {
        return next(new ErrorResponse(`Comment with ID ${commentId} not found`, 404))
    }

    if (!user) {
        return next(new ErrorResponse(`User not found`, 404))
    }

    const reply = new Comment({
        content,
        post: comment.post,
        user: userId,
        parentComment: commentId,
    });

    await reply.save()

    successResponse(res, 201, 'You just replied a comment now', comment)

})

// @desc    Get Comment
// @route   POST /api/v1/comment/:postId
// @access  Private
// exports.getComment = asyncHandler(async (req, res, next) => {

//     const { postId } = req.params;

//     const comments = await Comment.find({ post: postId })

//     successResponse(res, 201, 'Comment Retrived succesfully', comments)

// })

 // Get comments and replies for a post
  exports.getCommentsAndReplies = async (req, res) => {
    try {
      const { postId } = req.params;
  
      const comments = await Comment.find({ post: postId }).populate({
        path: 'user',
        select: 'name',
      }).exec();
  
      const commentsWithReplies = await buildCommentTree(comments);
  
      res.status(200).json({
        success: true,
        message: 'Comments and replies retrieved successfully!',
        data: commentsWithReplies,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve comments and replies',
        error: error.message,
      });
    }
  };
  
  const buildCommentTree = async (comments) => {
    const commentMap = {};
    const commentsWithReplies = [];
  
    comments.forEach((comment) => {
      commentMap[comment._id.toString()] = comment;
      comment.replies = [];
    });
  
    comments.forEach((comment) => {
      if (comment.parentComment) {
        const parentComment = commentMap[comment.parentComment.toString()];
        if (parentComment) {
          parentComment.replies.push(comment);
        }
      } else {
        commentsWithReplies.push(comment);
      }
    });
  
    await populateReplies(commentsWithReplies, commentMap);
  
    return commentsWithReplies;
  };
  
  const populateReplies = async (comments, commentMap) => {
    for (const comment of comments) {
      if (comment.replies.length > 0) {
        const populatedReplies = [];
  
        for (const reply of comment.replies) {
          const populatedReply = commentMap[reply._id.toString()];
          if (populatedReply) {
            populatedReplies.push(populatedReply);
            await populateReplies([populatedReply], commentMap);
          }
        }
  
        comment.replies = populatedReplies;
      }
    }
  };
  
  




