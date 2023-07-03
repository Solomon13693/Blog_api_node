const express = require('express');
const router = express.Router();
const AuthRoute = require('./routes/authRoute')
const postRoute = require('./routes/postRoute')
const commentRoute = require('./routes/commentRoute')
const categoryRoute = require('./routes/categoryRoute')
const adminRoute = require('./routes/adminRoute')
const authorRoute = require('./routes/authorRoute')
const userRoute = require('./routes/userRoute')

router.use('/auth', AuthRoute)
router.use('/user', userRoute)
router.use('/post', postRoute)
router.use('/comment', commentRoute)
router.use('/category', categoryRoute)
router.use('/admin', adminRoute)
router.use('/author', authorRoute)

module.exports = router;