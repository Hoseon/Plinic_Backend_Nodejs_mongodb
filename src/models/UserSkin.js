var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//var bcrypt = require('bcrypt');

var UserSkinSchema = new mongoose.Schema({
  email: {
    type: String
  },
  gender: {
    type: String
  },
  skincomplaint: {
    type: String
  },
  nickname: {
    type: String
  },
  birthday: {
    type: String
  },
  age: {
    type: String
  },
  userskinimage: [{ //사용자 이미지 촬영 누적 기록
    gender: {type:String},
    skintype : {type:String},
    age : {type:String},
    skinregion: {type: String},
    filename: {type:String},
    originalName: {type:String},
    updatedAt: { type: Date, default: Date.now },
  }],
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserSkin', UserSkinSchema);
