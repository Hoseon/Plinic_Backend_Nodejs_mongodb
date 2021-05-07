var User = require('../models/user');
var BeautyNote = require('../models/BeautyNote');
var Tags = require('../models/Tags');
var BeautyNoteCounter = require('../models/BeautyNoteCounter');
var jwt = require('jsonwebtoken');
var async = require('async');
var config = require('../config/config');
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

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

exports.noteSave = (req, res) => {

  // console.log("-------------------------------request-------------");
  // console.log("qna email -------------------------------- : " + req.body.email);
  // console.log("qna-------------------------------- : " + req.body.select);
  // console.log("qna-------------------------------- : " + req.body.tags);
  // console.log("qna-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '문의하기를 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      BeautyNoteCounter.findOne({
        name: "beautynote"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          BeautyNoteCounter.create({
            name: "beautynote",
            totalCount: 0
          }, function(err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function(callback, counter) {
      let newNote = BeautyNote(req.body);
      newNote.numId = counter.totalCount + 1;
      newNote.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '뷰티노트가 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        var newTags = req.body.tags
        Tags.update({
          _id: '5d2c39cc9cc12aae489d2f08'
        }, {
          $push: {
            tags: newTags
          }
        }, function(err, post2) {
          if (err) {
            console.log("tags error : " + err);
          } else {
            // console.log("result tags : " + JSON.stringify(post2));
          }
        })
        return res.status(201).json(user);
      });
    });
    // create
  }
};


exports.noteUpdate = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log("qna_Update-------------------------------- : " + req.body.email);
  // console.log("qna_Update-------------------------------- : " + req.body.select);
  // console.log("qna_Update_IDIDID-------------------------------- : " + req.body.id);
  // console.log("qna_Update-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '문의하기를 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      BeautyNoteCounter.findOne({
        name: "qna"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          BeautyNoteCounter.create({
            name: "qna",
            totalCount: 0
          }, function(err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function(callback, counter) {
      let newQna = BeautyNote(req.body);
      newQna.numId = counter.totalCount + 1;
      console.log("note body :::::::::::::::::::: " + JSON.stringify(req.body));

      BeautyNote.findOneAndUpdate({
        _id: req.body.id
      }, req.body, function(err, post) {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        if (!post) {
          console.log(err);
          return res.status(400).json({
            'msg': '문의하기가 내용이 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        return res.status(201).json(post);
      });
      // newQna.save((err, user) => {
      //     if (err) {
      //       console.log(err);
      //         return res.status(400).json({ 'msg': '문의하기가 등록되지 않았습니다. <br /> Error : ' + err });
      //     }
      //     return res.status(201).json(user);
      //     // return res.status(201).json(user);
      //     // return res.status(201).json({
      //     //     token: createToken(user)
      //     // });
      // });
    });
    // create
  }
};


exports.replySave = (req, res) => {
  var newReply = req.body
  BeautyNote.update({
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
      return res.status(201).json(post2);
    }
  })

}


exports.replyUpdate = (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  BeautyNote.updateOne({ "comments._id" : req.body.id },
    { $set: { "comments.$.comment" : req.body.comment, "comments.$.createdAt" : Date.now() } },
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
  BeautyNote.updateOne({ "comments._id" : req.body.id },
    { $pull: { comments : { _id : req.body.id }} } ,
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
