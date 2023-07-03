const express = require('express');
const { getPosts, getPost } = require('../controller/AuthorController')
const { protected, authorize } = require('../middleware/auth')
const router = express.Router()

router
    .route('/posts')
    .get(protected, getPosts)

router
    .route('/post/:id')
    .get(protected, getPost)

module.exports = router