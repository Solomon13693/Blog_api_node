const express = require('express');
const { getPosts, createPost, getPostById, updatePost, deletePost, approvePost, publishPost } = require('../controller/PostController')
const { protected, authorize } = require('../middleware/auth')
const router = express.Router()
const multer = require('../config/multer')
const path = require('path')

const upload = multer(path.join('public/upload/posts/'));

router
    .route('/:categoryId')
    .post(protected, authorize('admin', 'author'), upload.single('image'), createPost);

router
    .route('/:id')
    .patch(protected, authorize('admin', 'author'), upload.single('image'), updatePost)
    .delete(protected, authorize('admin', 'author'), deletePost)

router
    .route('/:id/approve')
    .post(protected, authorize('admin'), approvePost)

module.exports = router