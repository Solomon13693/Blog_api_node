const mongoose = require('mongoose');
const slugify = require('slugify')

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Post title is required'],
            unique: true,
        },
        content: {
            type: String,
            required: [true, 'Post content is required'],
        },
        image: {
            type: String,
            required: [true, 'Post Image is required']
        },
        tags: {
            type: Array,
            validate: {
                validator: function (tags) {
                    return tags.length > 0;
                },
                message: 'At least one tag is required',
            },
            required: [true, 'Post tags are required'],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        collaborators: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                }
            },
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        slug: {
            type: String,
        },
        approved: {
            type: Boolean,
            default: false,
        },
        published: {
            type: Boolean,
            default: false,
        },
        publishedDate: {
            type: Date,
        },
        scheduleDate: {
            type: Date,
        }, 
    },
    { timestamps: true }
);

postSchema.pre('save', async function (next) {
    this.slug = slugify(this.title, {
        remove: undefined,
        strict: false,
        lower: true,
        locale: 'vi',
        trim: true
    })
    next()
})

postSchema.pre(/^find/, function (next) {
    this.populate({ path: 'author', select: 'name email' }).populate({
        path: 'category',
        select: 'name'
    }).populate({ path: 'likes', select: 'name' }).populate({ path: 'collaborators.user', select: 'name' });
    next()
})

postSchema.pre(/^find/, function (next) {
    this.where({ approved: true }); // Exclude posts that are not approved and published
    next();
  });

const Post = mongoose.model('Post', postSchema)

module.exports = Post