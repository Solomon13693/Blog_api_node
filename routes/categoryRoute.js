const express = require('express');
const { CreateCategory, updateCategory, deleteCategory, getCategories, getCategory } = require('../controller/CategoryController')
const { protected, authorize } = require('../middleware/auth')

const router = express.Router()

router
    .route('/')
    .get(getCategories)

router
    .route('/:id')
    .get(getCategory)

router
    .route('/')
    .post(protected, authorize('admin'), CreateCategory)

router
    .route('/:id')
    .patch(protected, authorize('admin'), updateCategory)

router
    .route('/:id')
    .delete(protected, authorize('admin'), deleteCategory)

module.exports = router