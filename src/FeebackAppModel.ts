

const mongoose = require('mongoose');

const FeebackAppSchema = mongoose.Schema({
    //id ngẫu nhiên của mongo không cần khai báo
    cusId: {
        type: String,
        maxlength: 255
    },
    start: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        maxlength: 255
    },
    dateFeed: {
        type: Date
    },

});

const FeebackAppModel = mongoose.model('feebackapp', FeebackAppSchema);
module.exports = FeebackAppModel;
