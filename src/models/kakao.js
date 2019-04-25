var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var KakaoSchema = new mongoose.Schema({
  provider: {
    type: String,
    lowercase: true,
  },
  id : {
    type: Number,
    lowercase: true,
  },
  _raw: {
    type: String,
    lowercase: true,
  },
  _json: {
    type: Object,
    lowercase: true,
  },
  email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
  password: {
        type: String,
        required: true
    }
});

/*
UserSchema.pre('save',  function(next) {
    var user = this;

     if (!user.isModified('password')) return next();

     bcrypt.genSalt(10, function(err, salt) {
         if (err) return next(err);

         bcrypt.hash(user.password, salt, function(err, hash) {
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
*/
module.exports = mongoose.model('Kakao', KakaoSchema);
