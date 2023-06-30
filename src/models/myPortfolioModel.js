const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let myPortFolioSchema = new Schema({
    stock: [{
        stockId: {
            type: mongoose.Types.ObjectId
        }
    }],
    portfolioCat:{
        Type:String
    },
    userid:{
        Types:mongoose.Schema.Types.ObjectId
    }
    
});

module.exports = mongoose.model('mystockportfolio', myPortFolioSchema);

