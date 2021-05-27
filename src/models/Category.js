var mongoose = require('mongoose');

var categorySchema = mongoose.Schema({
    bigCode: {type: Number, unique:true, required: true, default: 0},
    bigCategoryName: {type: String, required: true, unique:true},
    smallCategory : [{
        smallCode: {type: Number, unique:true, required: true, default: 0},
        smallCategoryName: {type: String, required: true, unique:true},
        createdAt: {type: Date, default: Date.now()},
        updatedAt: {type: Date},
    }],
    createdAt: {type:Date, default:Date.now()},
    updatedAt: Date,
});

categorySchema.methods.getFormattedDate = function (date) {
    return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

categorySchema.methods.getFormattedTime = function (date) {
    return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
    return ("0" + num).slice(-2);
}

var Category = mongoose.model('category',categorySchema);
module.exports = Category;
