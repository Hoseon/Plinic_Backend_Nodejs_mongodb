var mongoose = require('mongoose');

var alertSchema = mongoose.Schema({
  alertType: { type: String, required: true },
  email: { type: String, required: true },
  address: [{
    isMain: {type: Boolean, default: false},
    name: { type: String, },
    phonenumber: { type: String, },
    address: { type: String, },
    buildingName: { type: String, },
    detailAddress: { type: String, },
    zonecode: { type: String, },
    desc: {type: String},
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
});

alertSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

alertSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Alert = mongoose.model('address',alertSchema);
module.exports = Alert;
