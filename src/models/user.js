var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
//var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user_admin', required:false},
  mpoint: {type:mongoose.Schema.Types.Object, ref:'pointLog', required:false},
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
  updatedAt: { type: Date, default: Date.now },
  totalusetime: {type:Number, default:0},
  totaluserpoint: {type:Number, default:0}, //사용자 포인트 총 시간
  userpoint: [{ //사용자 포인트 누적 이력
    point: {type:Number},
    updatedAt: {type:Date},
    title: {type:String},
    status: {type:String},
  }],
  mainproduct: [{ //사용자 포인트 누적 이력
    product_num: {type:String, required:true},
    brand_name: String,
    big_category: String,
    small_category: String,
    product_name: String,
    seller: String,
    color_type: String,
    function: String,
    ingredient: [{
      korean_name: {type:String},
      english_name: {type:String},
      ewg_level: {type:String},
      purpose: {type:String},
    }],
    image_url: String,
    weight: String,
    price: String,
    
    // title: {type:String, required:true}, //제품명
    // jejosa: {type:String, required:true},//제조사
    // brand: {type:String, required:true},//브랜드
    // body: {type:String, required:true},
    // filename: String,
    // originalName: String,
  }],
  subproduct: [{ //
    product_num: {type:String, required:true},
    brand_name: String,
    big_category: String,
    small_category: String,
    product_name: String,
    seller: String,
    color_type: String,
    function: String,
    ingredient: [{
      korean_name: {type:String},
      english_name: {type:String},
      ewg_level: {type:String},
      purpose: {type:String},
    }],
    image_url: String,
    weight: String,
    price: String,
    // title: {type:String, required:true}, //제품명
    // jejosa: {type:String, required:true},//제조사
    // brand: {type:String, required:true},//브랜드
    // body: {type:String, required:true},
    // filename: String,
    // originalName: String,
  }],
  snsid: String,
  phonenumber: String,
  pwreset: {
    type: Boolean,
    default: false
  },
  pwresetvalue: String,
  ispush: {
    type: Boolean,
    default: false
  },
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

// UserSchema.pre('findOneAndUpdate', function(next) {
//   var user = this;
//   if (!user._update.isModified('password')) return next();
//   bcrypt.genSalt(10, function(err, salt) {
//     if (err) return next(err);
//     bcrypt.hash(user._update.password, salt, null, function(err, hash) {
//       if (err) return next(err);
//       user._update.password = hash;
//       next();
//     });
//   });
// });

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1)+ "-" + get2digits(date.getDate());
};

UserSchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}


module.exports = mongoose.model('User', UserSchema);
