const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let testimonialSchema = new Schema({
    question: {
        type: String,
        default: ''
    },
    answer: {
        type: String,
        default: ''
    },
    is_delete: {
        type: Boolean,
        default:false
      }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('faqquestion', testimonialSchema);