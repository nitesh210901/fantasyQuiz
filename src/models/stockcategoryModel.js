const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockcategorySchema = new Schema({
    fantasy_type: {
        type: String,
        default: 'cricket'
    },
    name: {
        type: String,
        default: ''
    },
    sub_title: {
        type: String,
        default: ''
    },
    Order:{
        type: Number,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    tbl_order: {
        type: Number,
        default: 0
    },
    stocks_id: [{
        type: String
    }]
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockcategory', stockcategorySchema);