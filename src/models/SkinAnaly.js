var mongoose = require('mongoose');

var skinAnalySchema = mongoose.Schema({
  user_id: String,
  email: String,
  agerange: String,
  gender: String,
  skincomplaint: String,
  originalFileName: {
    type: String
  },
  firstcheek: String,
  firstforhead: String,
  munjin: [{
    sleep: Number,
    alcohol: Number,
    fitness: Number,
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  cheek: [{
    input: [{
      filename: String,
      filetype: String,
      upload_date: Date,
    }],
    diff: [{
      label: String,
      value: Number,
      output_image: String
    }],
    tone: [{
      label: String,
      lightest_color: String,
      lightest_color_hex: String,
      darkest_color: String,
      darkest_color_hex: String,
      average_color: String,
      avgrage_color_hex: String
    }],
    pore: [{
      pore_count: {
        type: Number,
        default: 0
      },
      smallest_pore: Number,
      largest_pore: Number,
      average_pore: Number,
      pores: Object,
      output_image: String
    }],
    wrinkles: [{
      url: Object
    }],
  }],
  forehead: [{
    input: [{
      filename: String,
      filetype: String,
      upload_date: Date,
    }],
    diff: [{
      label: String,
      value: Number,
      output_image: String,
    }],
    tone: [{
      label: String,
      lightest_color: String,
      lightest_color_hex: String,
      darkest_color: String,
      darkest_color_hex: String,
      average_color: String,
      avgrage_color_hex: String
    }],
    pore: [{
      pore_count: {
        type: Number,
        default: 0
      },
      smallest_pore: Number,
      largest_pore: Number,
      average_pore: Number,
      pores: {
        type: Object,
        default: 0
      },
      output_image: String
    }],
    wrinkles: [{
      url: Object
    }]
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
});

skinAnalySchema.methods.getFormattedDate = function (date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate());
};

skinAnalySchema.methods.getFormattedTime = function (date) {
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes()) + ":" + get2digits(date.getSeconds());
};

function get2digits(num) {
  return ("0" + num).slice(-2);
}
var SkinAnaly = mongoose.model('skinanaly', skinAnalySchema);
module.exports = SkinAnaly;