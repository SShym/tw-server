const mongoose = require('mongoose');

const Product = mongoose.Schema({
    name: String,
    imageUrl: String,
    imageUrlId: String,
    count: Number,
    weight: String,
    comments: Array,
})

module.exports = mongoose.model('xproduct', Product)