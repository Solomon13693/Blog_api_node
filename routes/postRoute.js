const express = require('express');
const { getPosts, createPost, getPostById, updatePost, deletePost, approvePost, publishPost, addCollaborator, removeCollaborator, likePost, UnlikePost } = require('../controller/PostController')
const { protected, authorize } = require('../middleware/auth')
const router = express.Router()
const multer = require('../config/multer')
const path = require('path')

const upload = multer(path.join('public/upload/posts/'));

router
    .route('/:categoryId')
    .post(protected, authorize('admin', 'author'), upload.single('image'), createPost);

router
    .route('/')
    .get(getPosts)

router
    .route('/:slug')
    .get(getPostById)

router
    .route('/:id')
    .patch(protected, authorize('reader', 'author'), upload.single('image'), updatePost)
    .delete(protected, authorize('admin', 'author'), deletePost)

router
    .route('/:id/approve')
    .post(protected, authorize('admin'), approvePost)

router
    .route('/:id/publish')
    .post(protected, authorize('reader'), publishPost)

router
    .route('/:id/like')
    .post(protected, likePost)

router
    .route('/:id/unlike')
    .post(protected, UnlikePost)

router
    .route('/:id/add/collaborator')
    .post(protected, authorize('admin'), addCollaborator)

router
    .route('/:id/remove/collaborator')
    .post(protected, authorize('admin'), removeCollaborator)

module.exports = router