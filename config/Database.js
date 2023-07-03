const mongoose = require('mongoose')

const connectDB = async() => {

    const conn = await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.green.inverse);

}

module.exports = connectDB