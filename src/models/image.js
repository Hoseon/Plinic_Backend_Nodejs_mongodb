var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var ImageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  desc: String,
  created: { type: Date, default: Date.now }
})


module.exports = mongoose.model('Image', ImageSchema);
