const asyncHandler = require('../middleware/asyncHandler')
const User = require('../models/User')
const ErrorResponse = require('../utils/ErrorResponse')
const crypto = require('crypto')

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async (req, res, next) => {

    const checkEmail = await User.findOne({ email: req.body.email })

    if (checkEmail) {
        return next(new ErrorResponse('Email address already exist', 422))
    }

    const checkPhone = await User.findOne({ phone: req.body.phone })

    if (checkPhone) {
        return next(new ErrorResponse('Phone number already exists', 422));
    }

    if (req.file) {
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
            profile: req.file.filename
        })
    }

    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
    })

    // SEND MAIL TO USERS
    await verifyUser(user)

    return res.status(201).json({
        status: 'success',
        message: 'An Email sent to your mail, Please verify your account',
    })

})

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.Login = asyncHandler(async (req, res, next) => {

    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorResponse('Please enter your email address and password', 422))
    }

    const user = await User.findOne({ email: email }).select('+password +verified')

    if (!user || !(await user.comparePassword(password))) {
        return next(new ErrorResponse('Invalid Credentials', 401))
    }

    if (user.verified === false) {
        await verifyUser(user)
        return next(new ErrorResponse('An Email sent to your mail, Please verify your account', 401))
    }

    const jwt = await user.JwtToken()

    return res.status(200).json({
        status: 'success',
        token: jwt
    })

})

// @desc    Verify user
// @route   POST /api/v1/auth/verify/:token
// @access  Public
exports.VerifyAccount = asyncHandler(async (req, res, next) => {

    const hashedToken = await checkCodes(req.params.token)

    const user = await User.findOne({ token: hashedToken, tokenExpires: { $gt: new Date() } }).select('+verified')

    if (!user) {
        return next(new ErrorResponse('Verification is invalid or has expired', 403))
    }

    if (user.verified === true) {
        return next(new ErrorResponse('Account verified already, Please login', 403));
    }

    user.verified = true
    await user.save()

    const jwt = await user.JwtToken()

    return res.status(200).json({
        status: 'success',
        token: jwt
    })

})

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.ForgottenPassword = asyncHandler(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new ErrorResponse('No user found with email address', 404));
    }

    const token = await user.verificationToken(5)
    await user.save({ validationBeforeSave: false })

    try {
        return res.status(200).json({
            status: 'success',
            token,
            message: 'Your password reset token has been send to your email address'
        })
    } catch (error) {
        user.verified = undefined
        user.tokenExpires = undefined
        await user.save({ validateBeforeSave: false })
    }

})

// @desc    Reset password
// @route   GET /api/v1/auth/reset-password/:token
// @access  Public
exports.ResetPassword = asyncHandler(async (req, res, next) => {

    const hashedToken = await checkCodes(req.params.token)
    const { password } = req.body

    const user = await User.findOne({ token: hashedToken, tokenExpires: { $gt: new Date() } })

    if (!user) {
        return next(new ErrorResponse('Verification is invalid or has expired', 403))
    }

    if (!password) {
        return next(new ErrorResponse('Password is required', 422))
    }

    user.password = password
    user.token = undefined
    user.tokenExpires = undefined
    await user.save()

    return res.status(200).json({
        status: 'success',
        message: 'Your password has been reset !'
    })

})

const checkCodes = async (code) => {
    return crypto.createHash('sha256').update(code).digest('hex')
}

const verifyUser = async (user) => {
    // Send mail to user with verification code
    const code = await user.verificationToken(5);
    console.log(code);
    await user.save({ validateBeforeSave: false })
};