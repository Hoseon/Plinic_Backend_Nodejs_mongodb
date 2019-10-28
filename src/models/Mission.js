var mongoose = require('mongoose');

var missionSchema = mongoose.Schema({
  missionID : {type:mongoose.Schema.Types.ObjectId, ref:'carezone', required:true},
  email : { type:String },
  title: {type:String},
  body: {type:String},
  //author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  // views: {type:Number, default: 0},
  // numId: {type:Number, required:true},
  // comments: [{
  //   body: {type:String, required:true},
  //   author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  //   createdAt: {type:Date, default:Date.now}
  // }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date,
  //이미지관리
  // filename: String,
  // originalName: String,
  // desc: String,
  // created: { type: Date, default: Date.now },
  // missontitle : String,
  // missonsubtitle: String,
  // product: String,
  startmission: Date,
  endmission: Date,
  image_url: String,
  // prodfilename: String,
  // prodoriginalname: String,
  // proddesc: String,
  maxmember: {type:Number},
  usetime: {type:Number, default:0},
  missioncomplete: {type:Boolean, default:false},
  // currentmember : {type: Number},
  usedmission: [{
    // memberId: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
    // name: {type: String},
    points: {type:Number},
    updatedAt: {type:Date},
    status: {type:String},
    //author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}
  }],
  reward: {type:Boolean, defalut:false},
  userImageFilename: {type:String},
});

missionSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

missionSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Mission = mongoose.model('mission',missionSchema);
module.exports = Mission;
