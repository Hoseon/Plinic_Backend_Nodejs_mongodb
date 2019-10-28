var User = require('../models/user');
var SkinQna = require('../models/SkinQna');
var Reward = require('../models/Reward');
var Mission = require('../models/Mission');
var Tags = require('../models/Tags');
var SkinQnaCounter = require('../models/SkinQnaCounter');
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

exports.rewardSave = (req, res) => {
  // console.log("-------------------------------request-------------");
  // console.log("qna email -------------------------------- : " + req.body.email);
  // console.log("qna-------------------------------- : " + req.body.select);
  // console.log("qna-------------------------------- : " + req.body.tags);
  // console.log("qna-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.address) {
    console.log(req.body.email);
    console.log(req.body.address);
    return res.status(400).json({
      'msg': '정확한 정보를 입력해 주세요. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      let newReward = Reward(req.body);

      newReward.save((err, result) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '발송정보가 저장되지 않았습니다. <br /> Error : ' + err
          });
        }

        req.body.reward = true;
        Mission.findOneAndUpdate({
          missionID: req.body.missionID,
          email: req.body.email
        }, { $set: { "reward" : true, "missioncomplete": true } }, function(err, post) {
          if (err) return res.json({
            success: false,
            message: err
          });
          if (!post) return res.json({
            success: false,
            message: "No data found to update"
          });
          // res.redirect('/banner/' + req.params.id);
        });
        return res.status(201).json(result);
      });
    }], function(callback, counter) {
      // req.body.reward = true;
      // let newMission = Mission(req.body.reward);
      // // newReward.numId = counter.totalCount + 1;
      // newMission.save((err, user) => {
      //   if (err) {
      //     console.log(err);
      //     return res.status(400).json({
      //       'msg': '발송정보가 저장되지 않았습니다. <br /> Error : ' + err
      //     });
      //   }
      //   return res.status(201).json(user);
      // });
    });
    // create
  }
};


exports.skinQnaUpdate = (req, res) => {

  //console.log("-------------------------------request-------------");
  // console.log("qna_Update-------------------------------- : " + req.body.email);
  // console.log("qna_Update-------------------------------- : " + req.body.select);
  // console.log("qna_Update_IDIDID-------------------------------- : " + req.body.id);
  // console.log("qna_Update-------------------------------- : " + JSON.stringify(req.body.qna));
  // //return res.status(400).json({ 'msg': '문의하기가 등록되었습니다. <br /><br /> 곧 관리자에게 Email로 답변을 받을 수 있습니다.' });
  //console.log("-------------------------------response-------------" + res.body.id);

  if (!req.body.email || !req.body.select) {
    return res.status(400).json({
      'msg': '피부고민을 등록 할 수 없습니다. <br / >. 관리자에게 문의 하세요.'
    });
  } else {
    async.waterfall([function(callback) {
      SkinQnaCounter.findOne({
        name: "qna"
      }, function(err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          SkinQnaCounter.create({
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
      let newQna = SkinQna(req.body);
      newQna.numId = counter.totalCount + 1;

      SkinQna.findOneAndUpdate({
        _id: req.body.id
      }, req.body, function(err, post) {
        if (err) {
          console.log(err);
          return res.status(400).json({
            'msg': '피부고민이 등록되지 않았습니다. <br /> Error : ' + err
          });
        }
        if (!post) {
          console.log(err);
          return res.status(400).json({
            'msg': '피부고민이 내용이 등록되지 않았습니다. <br /> Error : ' + err
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
  // console.log(req.body.email);
  // console.log(req.body.id);
  // console.log(req.body.comment);

  var newReply = req.body
  SkinQna.update({
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
  SkinQna.updateOne({
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
  SkinQna.updateOne({
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
