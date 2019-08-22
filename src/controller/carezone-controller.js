var User = require('../models/user');
var Carezone = require('../models/Carezone');
var jwt = require('jsonwebtoken');
var async = require('async');
var config = require('../config/config');

function createToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name
  }, config.jwtSecret, {
    //expiresIn: 200 // 86400 expires in 24 hours
    expiresIn: 86400 // 86400 expires in 24 hours
  });
}

exports.replySave = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  Carezone.update({
    _id: req.body.id
  }, {
    $push: {
      comments: newReply
    }
  }, function(err, post2) {
    if (err) {
      console.log("tags error : " + err);
      return res.status(400).json(err);
    } else {
      // console.log("result tags : " + JSON.stringify(post2));
      return res.status(201).json(post2);
    }
  })

}


exports.replyUpdate = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  Carezone.updateOne({
      "comments._id": req.body.id
    }, {
      $set: {
        "comments.$.comment": req.body.comment,
        "comments.$.createdAt": Date.now()
      }
    },
    function(err, post2) {
      if (err) {
        console.log("tags error : " + err);
        return res.status(400).json({
          'msg': '댓글이 수정 되지 않았습니다. <br /> Error : ' + err
        });
      } else {
        // console.log("result tags : " + JSON.stringify(post2));
        return res.status(201).json(post2);
      }
    })

}


exports.replyDelete = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  Carezone.updateOne({
      "comments._id": req.body.id
    }, {
      $pull: {
        comments: {
          _id: req.body.id
        }
      }
    },
    function(err, post2) {
      if (err) {
        console.log("tags error : " + err);
        return res.status(400).json({
          'msg': '댓글이 삭제 되지 않았습니다. <br /> Error : ' + err
        });
      } else {
        // console.log("result tags : " + JSON.stringify(post2));
        return res.status(201).json(post2);
      }
    })

}
