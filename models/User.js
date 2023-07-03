const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: [8, 'Name must be a least 8 characters above'],
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        unique: true,
        validate: [validator.isEmail, 'Email address is not valid'],
        required: [true, "Email address is required"]
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
    profile: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'author', 'reader'],
        default: 'reader'
    },
    verified: {
        type: Boolean,
        default: false,
        select: false
    },
    joined: {
        type: Date,
        default: Date.now()
    },
    token: String,
    tokenExpires: Date,
})

// Hash Password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
})

// Compare Password
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

// Verification Token
userSchema.methods.verificationToken = function (length) {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }

    this.token = crypto.createHash('sha256').update(code).digest('hex')
    this.tokenExpires = new Date(Date.now() + 1 * 60 * 1000);

    return code;
    
}

// Create JWT token
userSchema.methods.JwtToken = async function () {
    return await jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    });
}

const User = mongoose.model('User', userSchema)

module.exports = User