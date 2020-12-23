var mongoose = require('mongoose');
var bcrypt   = require("bcrypt-nodejs");

var userSchema = mongoose.Schema({
  email: {type:String, required:true, unique:true},
  nickname: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  createdAt: {type:Date, default:Date.now}
});
userSchema.pre("save", hashPassword);
userSchema.pre("findOneAndUpdate", function hashPassword(next){
  var user = this._update;
  console.log(user);
  // if(!user.newPassword){ //2020-12-23 플리닉 관리자 비밀번호 변경시 단순 초기설정 비밀번호를 보내버린다.
  if(!user.password){
    delete user.password;
    return next();
  } else {
    // user.password = bcrypt.hashSync(user.newPassword); //2020-12-23 플리닉 관리자 비밀번호 변경시 단순 초기설정 비밀번호를 보내버린다.
    user.password = bcrypt.hashSync(user.password); 
    console.log("222" + user.password);
    return next();
  }
});

userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};
userSchema.methods.hash = function (password) {
  return bcrypt.hashSync(password);
};
var User_admin = mongoose.model('user_admin',userSchema);

module.exports = User_admin;

function hashPassword(next){
  var user = this;
  if(!user.isModified("password")){
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
}
