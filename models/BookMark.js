const mongooes = require('mongoose')

const BookMarkSchema = new mongooes.Schema({
    post: {
        type: mongooes.Schema.Types.ObjectId,
        required: [true, 'Category name is required'],
        ref: 'Post',
    },
    user: {
        type: mongooes.Schema.Types.ObjectId,
        required: [true, 'User Is required'],
        ref: 'User',
    }
}, { timestamps: true })


BookMarkSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'post',
        select: 'title content -author -category -likes'
    }).populate({ path: 'user', select: 'name email' });
    next();
});


const BookMark = mongooes.model('BookMark', BookMarkSchema)

module.exports = BookMark