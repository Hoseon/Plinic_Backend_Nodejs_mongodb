var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  email: {
    type: String
  },
  password: {
    type: String
  },
  name: {
    type: String
  },
  username: {
    type: String
  },
  gender: {
    type: String
  },
  country: {
    type: Object
  },
  birthday: {
    type: String
  },
  skincomplaint: {
    type: String
  },
  interest: {
    type: String
  },
  user_jwt: {
    type: Boolean,
    default: true
  },
  provider: {
    type: String
  },
  naver: {
    type: Object
  },
  googleId: {
    type: String
  },
  imagePath : {
    type: String
  },
  filename: String,
  originalName: String,
  desc: String,
  pushtoken: String,
  from: String,
  created: { type: Date, default: Date.now },
  totalusetime: {type:Number, default:0},
  totaluserpoint: {type:Number, default:0}, //사용자 포인트 총 시간
  userpoint: [{ //사용자 포인트 누적 이력
    point: {type:Number},
    updatedAt: {type:Date},
    title: {type:String},
    status: {type:String},
  }],
  mainproduct: [{ //사용자 포인트 누적 이력
    title: {type:String, required:true}, //제품명
    jejosa: {type:String, required:true},//제조사
    brand: {type:String, required:true},//브랜드
    body: {type:String, required:true},
    filename: String,
    originalName: String,
  }],
  subproduct: [{ //사용자 포인트 누적 이력
    title: {type:String, required:true}, //제품명
    jejosa: {type:String, required:true},//제조사
    brand: {type:String, required:true},//브랜드
    body: {type:String, required:true},
    filename: String,
    originalName: String,
  }],
  snsid: String,
  phonenumber: String,
});

UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);
