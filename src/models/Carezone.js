var mongoose = require('mongoose');

var carezoneSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    body: {type:String, required:true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
    createdAt: {type:Date, default:Date.now}
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //이미지관리
  filename: String,
  originalName: String,
  desc: String,
  created: { type: Date, default: Date.now },
  missontitle : String,
  missonsubtitle: String,
  product: String,
  startmission: Date,
  // startmission: String,
  endmission: Date,
  // endmission: String,
  exposure : Date,
  // exposure : String,
  prodfilename: String,
  prodoriginalname: String,

  proddesc: String,
  caption: String,
  maxmember: {type:Number},
  currentmember : {type: Number},
  mission: [{
    memberId: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
    name: {type: String},
    body: {type:String, required:true},
    createdAt: {type:Date, default:Date.now},
    status: {type:String},
    //author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}
  }],
  challenge_image1_filename: String,
  challenge_image1_originalname: String,
  challenge_image2_filename: String,
  challenge_image2_originalname: String,
  challenge_image3_filename: String,
  challenge_image3_originalname: String,
  challenge_image4_filename: String,
  challenge_image4_originalname: String,
  challenge_image5_filename: String,
  challenge_image5_originalname: String,
  productcount: {type:Number},
  howtojoin: String,
  condition: String,
  challengestart : Date,
  challengeend : Date,
  bonus: String,

});

carezoneSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

carezoneSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Carezone = mongoose.model('carezone',carezoneSchema);
module.exports = Carezone;
