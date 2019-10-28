var mongoose = require('mongoose');

var rewardSchema = mongoose.Schema({
  // missionID : {type:mongoose.Schema.Types.ObjectId, ref:'carezone', required:true},
  missionID : {type:String},
  email : { type:String },
  title: {type:String},
  body: {type:String},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  startmission: Date,
  endmission: Date,
  image_url: String,
  maxmember: {type:Number},
  usetime: {type:Number, default:0},
  missioncomplete: {type:Boolean, default:false},
  usedmission: [{
    points: {type:Number},
    updatedAt: {type:Date},
    status: {type:String},
  }],
  reward: {type:Boolean, default:false}, //상품보상 받은 여부
  product: {type:String}, //보상받을 상품명
  prodfilename: {type:String},
  prodoriginalname: {type:String},
  zonecode: {type:String},
  address: {type:String},
  detailAddress: {type:String},
  desc: {type:String},
  bname: {type:String},
  buildingName: {type:String},
  phoneNumber: {type:String},
  postemail: {type:String},
  name: {type:String},
  comments: [{
    body: {type:String},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin'},
    createdAt: {type:Date, default:Date.now}
  }],
});

rewardSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

rewardSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Reward = mongoose.model('reward',rewardSchema);
module.exports = Reward;
