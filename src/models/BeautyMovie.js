var mongoose = require('mongoose');

var beautyMovieSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:true},
  views: {type:Number, default: 0},
  numId: {type:Number, required:true},
  comments: [{
    email: {type:String},
    body: {type:String},
    createdAt: {type:Date, default:Date.now},
    recomments: [{ //대댓글
      body: {type:String},
      email: {type:String},
      parent_id: {type:String},
      createdAt: {type:Date, default:Date.now}
    }],
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
  endmission: Date,
  prodfilename: String,
  prodoriginalname: String,
  proddesc: String,
  posturl: String,
  posturlId: String,
  editor: {type: Boolean, default: false},
  editorUpdateAt: Date,
  like: {type:Number, default: 0},
  likeuser: {type:Array, default: ''},
  midtext: String,
});

beautyMovieSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

beautyMovieSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var BeautyMovie = mongoose.model('beautyMovie',beautyMovieSchema);
module.exports = BeautyMovie;
