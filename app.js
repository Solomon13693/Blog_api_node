const express = require('express')
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler')
const routes = require('./routes')
require('colors');
require('dotenv').config()
const app = express()
const path = require('path')

const connectDB = require('./config/Database');
const ErrorResponse = require('./utils/ErrorResponse');

// INIT DB CONNECTION
connectDB()

app.use(morgan('dev'))
app.use(express.json())

// STATIC FILE
app.use(express.static('public'))

app.use('/api/v1', routes)

// Catch-all route for handling "Route not found" error
  app.use('*', (req, res, next) => {
    return next(
        new ErrorResponse(`${req.baseUrl} routes not found`, 404)
    );
})

// Error Handler
app.use(errorHandler);

module.exports = app