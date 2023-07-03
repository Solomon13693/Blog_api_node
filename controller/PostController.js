const asyncHandler = require('../middleware/asyncHandler')
const Post = require('../models/Post')
const User = require('../models/User')
const Category = require('../models/Category')
const ErrorResponse = require('../utils/ErrorResponse')
const successResponse = require('../utils/successResponse')
const scheduleReminder = require('../utils/reminderUtils')

// @desc    Create Post
// @route   POST /api/v1/post/:categoryId
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {

    req.body.author = req.user
    req.body.category = req.params.categoryId

    if (req.file) {
        req.body.image = req.file.filename
    }

    const exists = await Post.findOne({ title: req.body.title });

    if (exists) {
        return next(
            new ErrorResponse('Post title already exist', 402)
        );
    }

    const post = await Post.create(req.body)

    successResponse(res, 201, 'Post Created !', post);

})

// @desc    Get Post
// @route   POST /api/v1/post
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {

    let query;

    const queryObj = { ...req.query }

    const removeField = ['select', 'sort', 'page', 'limit', 'search']
    removeField.forEach((params) => delete queryObj[params])

    // get data
    query = Post.find(queryObj)

    const { select, sort, page, limit, search } = req.query

    if (select) {
        const fields = select.split(',').join(' ')
        query = query.select(fields)
    }

    if (sort) {
        const fields = sort.split(',').join(' ')
        query = query.sort(fields)
    } else {
        query = query.sort('-createdAt')
    }

    if (search) {

        const searchTerm = req.query.search; // Search term provided by the user
        const searchTermRegex = new RegExp(searchTerm, 'i'); // Dynamic regular expression pattern

        query.or([
            { title: searchTermRegex },
            { content: searchTermRegex },
            { tags: searchTermRegex },
        ]);

    }

    if (queryObj.author) {
        const user = await User.findOne({ name: queryObj.author })
        query.where('author').equals(user?._id)
    }

    if (queryObj.category) {
        const category = await Category.findOne({ name: queryObj.category })
        query.where('category').equals(category?._id)
    }

    if (queryObj.tags) {
        const fields = queryObj.tags.split(',')
        query = query.where('tags').in(fields)
    }

    // Pagination
    const pages = parseInt(page, 10) || 1
    const limits = parseInt(limit, 10) || 10
    const startIndex = (pages - 1) * limits
    const endIndex = pages * limits
    const total = await Post.countDocuments()

    query = query.skip(startIndex).limit(limits)

    // Execute
    const posts = await query

    // scheduleReminder(posts)

    // Pagination Result
    let pagination = {}

    if (endIndex < total) {
        pagination.next = {
            page: pages + 1,
            limits
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: pages - 1,
            limits
        }
    }

    successResponse(res, 200, 'Post retrieved successfully !', { posts, pagination });

});

// @desc    Get Post by Id
// @route   POST /api/v1/post/:id
// @access  Public
exports.getPostById = asyncHandler(async (req, res, next) => {

    const post = await Post.findOne({ slug: req.params.slug })

    if (!post) {
        return next(new ErrorResponse(`Post with ${req.params.slug} not found`, 404))
    }

    successResponse(res, 200, 'Post retrieved successfully !', { post });

})

// @desc    Update Post
// @route   PATCH /api/v1/post/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {

    const { id } = req.params

    const post = await Post.findById(id)
    const oldImage = post.image;

    if (req.file) {
        req.body.image = req.file.filename
        if (oldImage && oldImage !== req.body.image) {
            deleteImage(oldImage);
        }
    }

    if (!post) {
        return next(new ErrorResponse(`Post with ${idd} not found`, 404))
    }

    const user = await User.findById(req.user.id)

    if (compareAuthorAndUser(post, user) && !isCollaborator(post, user)) {
        return next(new ErrorResponse('Not authorized to perform this action'))
    }

    await Post.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    })

    successResponse(res, 200, 'Post updated successfully !', { post });

})

// @desc    Delete Post
// @route   DELETE /api/v1/post/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res) => {

    const { id } = req.params

    const post = await Post.findById(id)

    if (post.image) {
        deleteImage(post.image);
    }

    if (!post) {
        return next(new ErrorResponse(`Post with ${idd} not found`, 404))
    }

    const user = await User.findById(req.user.id)

    if (compareAuthorAndUser(post, user)) {
        return next(new ErrorResponse('Not authorized to perform this action'))
    }

    await Post.findByIdAndDelete(id)

    successResponse(res, 200, 'Post deleted successfully !');

})

// @desc    Approve Post
// @route   POST /api/v1/post/:id/approve
// @access  Private
exports.approvePost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.id)

    if (!post) {
        return next(new ErrorResponse(`Post with ${req.params.id} not found`, 404))
    }

    if (post.approved === true) {
        return next(new ErrorResponse(`Post ${req.params.id} already approved`, 403))
    }

    post.approved = true
    await post.save({ validateBeforeSave: false })

    // SEND A NOTIFICATION TO THE AUTHOR

    successResponse(res, 200, 'Post has been approved successfully !');

})

// @desc    Publish Post
// @route   POST /api/v1/post/:id/publish
// @access  Private
exports.publishPost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.id)
    const user = await User.findById(req.user.id)

    if(!post){
        return next(new ErrorResponse(`Post with id of ${req.params.id}, does not exist`))
    }

    if (post.approved === false) {
        return next(new ErrorResponse(`Post ${req.params.id} has not been approved`, 403))
    }

    if (post.published === true) {
        return next(new ErrorResponse(`Post ${req.params.id} has been published`, 403))
    }

    if (compareAuthorAndUser(post, user) && !isCollaborator(post, user)) {
        return next(new ErrorResponse('Not authorized to perform this action', 401))
    }

    if (post.scheduleDate && post.scheduleDate > Date.now()) {
        return next(new ErrorResponse(`Post ${req.params.id} is already scheduled for publishing`, 403));
    }

    if (req.body.scheduleDate) {

        const scheduleDate = new Date(req.body.scheduleDate);

        if (scheduleDate <= Date.now()) {
            return next(new ErrorResponse('Invalid schedule date', 400));
        }

        post.scheduleDate = scheduleDate;
        await post.save();

        await scheduleReminder(post, scheduleDate)

        successResponse(res, 200, 'Post scheduled for publishing successfully!');

    } else {
        // Publish the post immediately
        post.published = true;
        post.publishedDate = Date.now();
        await post.save({ validateBeforeSave: false });
        successResponse(res, 200, 'Post published successfully!');

    }


})

// @desc    Like Post
// @route   POST /api/v1/post/:id/like
// @access  Private
exports.likePost = asyncHandler(async (req, res, next) => {

    const { id } = req.params

    const post = await Post.findById(id)

    const existingLike = post.likes.find(
        (user) => user.toString() === req.user.id);

    if (existingLike) {
        return next(new ErrorResponse(`${req.user.name} already liked the post`))
    }

    post.likes.push(req.user.id)
    await post.save({ validateBeforeSave: false })

    successResponse(res, 200, `Post liked by ${req.user.name}`);

})

// @desc    Unlike Post
// @route   POST /api/v1/post/:id/unlike
// @access  Private
exports.UnlikePost = asyncHandler(async (req, res, next) => {

    const { id } = req.params
    const userId = req.user.id

    const post = await Post.findById(id)

    if (!post.likes.includes(userId)) {
        return next(new ErrorResponse(`Post is not liked by the ${req.user.name} `, 400));
    }

    const removeLike = post.likes.filter((like) => like.toString() !== userId)

    post.likes = removeLike
    await post.save({ validateBeforeSave: false })

    successResponse(res, 200, `Post unliked by ${req.user.name}`);

})

// @desc    Add Callaborator
// @route   POST /api/v1/post/:id/add/collaborator
// @access  Private
exports.addCollaborator = asyncHandler(async (req, res, next) => {

    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
        return next(new ErrorResponse(`Post with ${id} not found`, 404));
    }

    const user = await User.findById(req.user.id);

    if (compareAuthorAndUser(post, user)) {
        return next(new ErrorResponse('Not authorized to perform this action', 401));
    }

    const collaborator = await User.findById(req.body.collaborator);

    if (!collaborator) {
        return next(new ErrorResponse('User not found', 404));
    }

    // Check if the collaborator already exists in the collaborators array
    const existingCollaborator = post.collaborators.find(
        (c) => c.user.toString() === collaborator._id.toString()
    );

    if (existingCollaborator) {
        return next(
            new ErrorResponse('Collaborator already exists in the post', 400)
        );
    }

    post.collaborators.push({ user: collaborator._id });
    await post.save({ validateBeforeSave: false });

    successResponse(res, 200, `${collaborator.name} has been added`);
    // TODO: send email notification for collaborator and author of the blog
});

// @desc    Remove Callaborator
// @route   POST /api/v1/post/:id/remove/collaborator
// @access  Private
exports.removeCollaborator = asyncHandler(async (req, res, next) => {

    const { id } = req.params
    const post = await Post.findById(id)

    if (!post) {
        return next(new ErrorResponse(`Post with ${idd} not found`, 404))
    }

    const user = await User.findById(req.user.id)

    if (compareAuthorAndUser(post, user)) {
        return next(new ErrorResponse('Not authorized to perform this action', 401))
    }

    const collaborator = await User.findById(req.body.collaborator)

    if (!collaborator) {
        return next(new ErrorResponse('User not found', 404))
    }

    post.collaborators.pull({ user: collaborator._id })
    await post.save({ validateBeforeSave: false })

    successResponse(res, 200, `${collaborator.name} has been removed successfully`);
});

// Functions
const compareAuthorAndUser = (post, user) => {
    return post.author.toString() !== user.id
}

function deleteImage(filename) {

    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join('public/upload/posts/', filename);

    fs.unlink(imagePath, (err) => {
        if (err) {
            console.error(`Error deleting former image: ${err}`);
        }
    });
}

const isCollaborator = (post, user) => {
    return post.collaborators.some((collaborator) =>  collaborator.user._id.toString() === user._id.toString());
};
