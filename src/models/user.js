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
        default : true
  },
  provider: {
        type: String
    },
  naver: {
        type: Object
    },
  googleId: {
        type: String
    }
});

UserSchema.pre('save',  function(next) {
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

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);
