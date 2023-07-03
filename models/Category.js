const mongooes = require('mongoose')

const categorySchema = new mongooes.Schema({
    name: {
        type : String, 
        required : [ true, 'Category name is required' ],
        unique: [ true ]
    }
}, { timestamps: true })

const Category = mongooes.model('Category', categorySchema)

module.exports = Category