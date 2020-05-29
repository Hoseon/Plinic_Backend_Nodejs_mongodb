var mongoose = require('mongoose');

var appreviewschema = mongoose.Schema({
  isReview : {type: Boolean, default:false},
  target : {type: String}
});

appreviewschema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

appreviewschema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var AppReview = mongoose.model('appreview',appreviewschema);
module.exports = AppReview;
