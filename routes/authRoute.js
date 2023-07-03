const express = require('express');
const { Register, Login, VerifyAccount, ForgottenPassword, ResetPassword } = require('../controller/AuthController')
const multer = require('../config/multer')
const path = require('path')

const upload = multer(path.join('public/upload/profile/'));

const router = express.Router()

router
    .route('/register')
    .post(upload.single('profile'), Register)

router
    .route('/login')
    .post(Login)

router
    .route('/verify/:token')
    .post(VerifyAccount)

router
    .route('/forgot-password')
    .post(ForgottenPassword)

router
    .route('/reset-password/:token')
    .post(ResetPassword)

module.exports = router