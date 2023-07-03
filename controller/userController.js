const asyncHandler = require('../middleware/asyncHandler')
const BookMark = require('../models/BookMark')
const Post = require('../models/Post')
const ErrorResponse = require('../utils/ErrorResponse')
const successResponse = require('../utils/successResponse')

exports.BookMarkPost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.postId)

    if (!post) {
        return next(new ErrorResponse(`Post not found`, 404))
    }

    if (await BookMark.findOne({ post: req.params.postId, user: req.user.id })) {
        return next(new ErrorResponse('You already marked this post', 403))
    }

    const bookmark = await BookMark.create({
        post: post.id,
        user: req.user.id
    })

    successResponse(res, 201, `${post.title} have been added to your book mark`, bookmark)

})

exports.removeBookmark = asyncHandler(async (req, res, next) => {

    const bookmarkId = req.params.bookmarkId;
    const userId = req.user.id;

    // Find the post by ID and author
    const bookmark = await BookMark.findOne({ _id: bookmarkId, user: userId });

    if (!bookmark) {
        return next(new ErrorResponse(`Bookmark not found`, 404));
    }

    // Call the remove method on the post object
    await bookmark.deleteOne({ _id: bookmark.id });

    // Return a success response
    successResponse(res, 200, 'Bookmark deleted successfully!');

});

exports.getBookMark = asyncHandler(async (req, res, next) => {

    const bookmark = await BookMark.find({ user: req.user.id })

    successResponse(res, 200, 'Book mark retreive succesfully!', bookmark);

})

