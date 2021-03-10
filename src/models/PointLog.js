var mongoose = require("mongoose");

var pointLogSchema = mongoose.Schema({
  // _id: { type: mongoose.Schema.Types.ObjectId },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  point: [{
    // _id: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String },
    point: { type: Number },
    status: {type: String},
    createdAt: { type: Date, default: Date.now },

  }],
  totalPoint: { type: Number }
});

pointLogSchema.methods.getFormattedDate = function(date) {
  return ( date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate()));
};

pointLogSchema.methods.getFormattedTime = function(date) {
  return ( get2digits(date.getHours()) + ":" + get2digits(date.getMinutes()) + ":" + get2digits(date.getSeconds()));
};

function get2digits(num) {
  return ("0" + num).slice(-2);
}
var PointLog = mongoose.model("pointLog", pointLogSchema);
module.exports = PointLog;
