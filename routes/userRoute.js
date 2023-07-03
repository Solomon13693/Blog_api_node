const express = require('express');
const { BookMarkPost, getBookMark, removeBookmark } = require('../controller/userController');
const router = express.Router()
const { protected, authorize } = require('../middleware/auth')

router
    .route('/:postId/bookmark')
    .post(protected, BookMarkPost)

router
    .route('/:bookmarkId/bookmark')
    .delete(protected, removeBookmark)

router
    .route('/bookmark')
    .get(protected, getBookMark)

module.exports = router