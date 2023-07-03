const asyncHandler = require('../middleware/asyncHandler')
const Post = require('../models/Post')
const User = require('../models/User')
const Category = require('../models/Category')
const ErrorResponse = require('../utils/ErrorResponse')
const successResponse = require('../utils/successResponse')


// @desc    Get Post
// @route   POST /api/v1/post
// @access  Private
exports.getPosts = asyncHandler(async (req, res) => {

    const userId = req.user.id;

    const posts = await Post.find({
        $or: [
            { author: userId },
            { 'collaborators.user': userId }
        ]
    })

    successResponse(res, 200, 'Post retrieved successfully !', { posts });

});

exports.getPost = asyncHandler(async (req, res, next) => {

    const postId = req.params.id;
    const userId = req.user.id; // Assuming the authenticated user ID is available in req.user

    const post = await Post.findOne({
        $or: [
            { _id: postId, author: userId },
            { _id: postId, 'collaborators.user': userId }
        ]
    })

    if (!post) {
        return next(new ErrorResponse(`Post ${postId} not found`, 404));
    }

    successResponse(res, 200, 'Post retrieved successfully!', { post });
});
