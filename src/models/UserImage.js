var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserImageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  email: String,
  created: { type: Date, default: Date.now }
})


module.exports = mongoose.model('UserImage', UserImageSchema);
