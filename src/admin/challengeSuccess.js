var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Qna = require("../models/Qna");
var QnaCounter = require("../models/QnaCounter");
var Carezone = require("../models/Carezone");
var CarezoneCounter = require("../models/CarezoneCounter");
var Reward = require("../models/Reward");
var async = require("async");
var User_admin = require("../models/User_admin");
var User = require("../models/user");
var Alarm = require("../models/Alarm");
var multer = require("multer");
// var FTPStorage = require('multer-ftp');
var sftpStorage = require("multer-sftp");
let Client = require("ssh2-sftp-client");
var path = require("path");
var fs = require("fs");
var del = require("del");
var http = require("http");
var FCM = require("fcm-node");
var serverKey = "AIzaSyCAcTA318i_SVCMl94e8SFuXHhI5VtXdhU";
var fcm = new FCM(serverKey);

var multerS3 = require('multer-s3');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();
let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'plinic',
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + '-' + Date.now()
      });
    },
    key: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    },
    acl: 'public-read'
  })
});

//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
    //cb(null, UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  }
});

let upload = multer({
  storage: storage
});

var sftpUpload = multer({
  storage: new sftpStorage({
    sftp: {
      host: "g1partners1.cafe24.com",
      // secure: true, // enables FTPS/FTP with TLS
      port: 3822,
      user: "g1partners1",
      password: "g100210!!"
    },
    // basepath: '/www/plinic',
    destination: function (req, file, cb) {
      cb(null, "/www/plinic");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now());
    }
  })
});

const sftpconfig = {
  host: "g1partners1.cafe24.com",
  port: 3822,
  user: "g1partners1",
  password: "g100210!!"
};

router.get('/Challenge/newIndex', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 100;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);
  async.waterfall([function (callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function (err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function (callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function (err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function (user) {
        or.push({
          author: mongoose.Types.ObjectId(user._id)
        });
      });
      if (search.findPost.$or) {
        search.findPost.$or = search.findPost.$or.concat(or);
      } else if (or.length > 0) {
        search.findPost = {
          $or: or
        };
      }
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or
      || testSearch.findUser && testSearch.dayCreated[0].createdAt) return callback(null, null, 0);
    Reward.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or
      || testSearch.findUser && testSearch.dayCreated[0].createdAt) return callback(null, [], 0);
    
      if(testSearch.dayCreated[0]) {
        Reward.find(testSearch.dayCreated[0])
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .exec(function (err, reward) {
        if (err) callback(err);
        callback(null, reward, maxPage);
      });
    } else {
      Reward.find(search.findPost)
      .sort({ "seq": 1 })
      .populate("author")
      .sort({ "seq": 1, "createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .exec(function (err, reward) {
      if (err) callback(err);
      callback(null, reward, maxPage);
    });
  }
  }], function (err, reward, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Challenges/ChallengeSuccess/index", {
      reward: reward,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      testSearch: testSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // new index


router.get("/Challenge/new", function (req, res) {
  return res.render("PlinicAdmin/Contents/Challenges/ChallengeSuccess/new", {});
});
//콘텐츠관리 챌린지 신규 등록 화면


router.post('/Challenge/', s3upload.fields([{ name: 'image' }, { name: 'homeimage' }, { name: 'challenge_image1' }, { name: 'challenge_image2' }, { name: 'challenge_image3' }, { name: 'challenge_image4' }, { name: 'challenge_image5' }]), isLoggedIn, function (req, res, next) {
    async.waterfall([function (callback) {
      CarezoneCounter.findOne({
        name: "carezone"
      }, function (err, counter) {
        if (err) callback(err);
        if (counter) {
          callback(null, counter);
        } else {
          CarezoneCounter.create({
            name: "carezone",
            totalCount: 0
          }, function (err, counter) {
            if (err) return res.json({
              success: false,
              message: err
            });
            callback(null, counter);
          });
        }
      });
    }], function (callback, counter) {
      var newPost = req.body.post;
      newPost.author = req.user._id;
      newPost.numId = counter.totalCount + 1;
      req.body.post.filename = req.files['image'][0].key;
      req.body.post.originalName = req.files['image'][0].originalname;
      req.body.post.homeimage_filename = req.files['homeimage'][0].key;
      req.body.post.homeimage_originalname = req.files['homeimage'][0].originalname;
      // req.body.post.prodfilename = req.files['prodimage'][0].key;
      // req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
      req.body.post.challenge_image1_filename = req.files['challenge_image1'][0].key;
      req.body.post.challenge_image1_originalname = req.files['challenge_image1'][0].originalname;

      if (req.files['challenge_image2']) {
        req.body.post.challenge_image2_filename = req.files['challenge_image2'][0].key;
        req.body.post.challenge_image2_originalname = req.files['challenge_image2'][0].originalname;
      }
      if (req.files['challenge_image3']) {
        req.body.post.challenge_image3_filename = req.files['challenge_image3'][0].key;
        req.body.post.challenge_image3_originalname = req.files['challenge_image3'][0].originalname;
      }
      if (req.files['challenge_image4']) {
        req.body.post.challenge_image4_filename = req.files['challenge_image4'][0].key;
        req.body.post.challenge_image4_originalname = req.files['challenge_image4'][0].originalname;
      }
      if (req.files['challenge_image5']) {
        req.body.post.challenge_image5_filename = req.files['challenge_image5'][0].key;
        req.body.post.challenge_image5_originalname = req.files['challenge_image5'][0].originalname;
      }
      Carezone.create(req.body.post, function (err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        counter.totalCount++;
        counter.save();
        res.redirect('/contents/Challenge/newIndex');
      });
    });
}); 
// create


router.delete('/Challenge/:id', isLoggedIn, function (req, res, next) {
  console.log(req);
  Carezone.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function (err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!post) return res.json({
      success: false,
      message: "No data found to delete"
    });
    var params = {
      Bucket: 'plinic',
      Delete: { // required
        Objects: [ // required
          { Key: post.filename },
          { Key: post.prodfilename },
          { Key: post.homeimage },
          { Key: post.challenge_image1_filename },
          { Key: post.challenge_image2_filename },
          { Key: post.challenge_image3_filename },
          { Key: post.challenge_image4_filename },
          { Key: post.challenge_image5_filename }
        ]
      }
    };
    s3.deleteObjects(params, function (err, data) {
      console.log()
      if (err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/contents/Challenge/newIndex');
  });
}); 
//destroy


router.get("/Challenge/:id", function (req, res) {
  Reward.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      //배너 이미지 가져 오기 20190502
      //res.setHeader('Content-Type', 'image/jpeg');
      // var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      // console.log(post.day);
      res.render("PlinicAdmin/Contents/Challenges/ChallengeSuccess/show", {
        post: post,
        // url: url,
        prod_url: prod_url,
        // homeImage: homeImage,
        // challenge_url1: challenge_url1,
        // challenge_url2: challenge_url2,
        // challenge_url3: challenge_url3,
        // challenge_url4: challenge_url4,
        // challenge_url5: challenge_url5,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
});
//콘텐츠관리 챌린지 Show


router.get('/Challenge/:id/edit', isLoggedIn, function (req, res) {
  Carezone.findById(req.params.id, function (err, post) {
    // var url = req.protocol + '://' + req.get('host') + '/carezone_images/' + post._id;
    var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
    // var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;
    var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
    // var challenge_url1 = req.protocol + '://' + req.get('host') + '/challenge_image1/' + post._id;
    var homeImage = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.homeimage_filename;

    var challenge_url1 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image1_filename;
    // var challenge_url2 = req.protocol + '://' + req.get('host') + '/challenge_image2/' + post._id;
    var challenge_url2 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image2_filename;
    // var challenge_url3 = req.protocol + '://' + req.get('host') + '/challenge_image3/' + post._id;
    var challenge_url3 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image3_filename;
    // var challenge_url4 = req.protocol + '://' + req.get('host') + '/challenge_image4/' + post._id;
    var challenge_url4 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image4_filename;
    // var challenge_url5 = req.protocol + '://' + req.get('host') + '/challenge_image5/' + post._id;
    var challenge_url5 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image5_filename;

    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginalName = post.originalName; //이전 파일들은 삭제

    var preprodfilename = post.prodfilename;
    var preprodoriginalname = post.prodoriginalname;

    var homeimage_filename = post.homeimage_filename;
    var homeimage_originalname = post.homeimage_originalname;

    var pre_challenge1_filename = post.challenge_image1_filename;
    var pre_challenge1_originalfilename = post.challenge_image1_originalname;

    var pre_challenge2_filename = post.challenge_image2_filename;
    var pre_challenge2_originalfilename = post.challenge_image2_originalname;

    var pre_challenge3_filename = post.challenge_image3_filename;
    var pre_challenge3_originalfilename = post.challenge_image3_originalname;

    var pre_challenge4_filename = post.challenge_image4_filename;
    var pre_challenge4_originalfilename = post.challenge_image4_originalname;

    var pre_challenge5_filename = post.challenge_image5_filename;
    var pre_challenge5_originalfilename = post.challenge_image5_originalname;

    if (err) return res.json({
      success: false,
      message: err
    });
    // if (!req.user._id.equals(post.author)) return res.json({
    //   success: false,
    //   message: "Unauthrized Attempt"
    // });
    res.render("PlinicAdmin/Contents/ChallengeMgt/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      preprodfilename: preprodfilename,
      preprodoriginalname: preprodoriginalname,
      prehomeimage_filename: homeimage_filename,
      prehomeimage_originalname: homeimage_originalname,
      pre_challenge1_filename: pre_challenge1_filename,
      pre_challenge1_originalname: pre_challenge1_originalfilename,
      pre_challenge2_filename: pre_challenge2_filename,
      pre_challenge2_originalname: pre_challenge2_originalfilename,
      pre_challenge3_filename: pre_challenge3_filename,
      pre_challenge3_originalname: pre_challenge3_originalfilename,
      pre_challenge4_filename: pre_challenge4_filename,
      pre_challenge4_originalname: pre_challenge4_originalfilename,
      pre_challenge5_filename: pre_challenge5_filename,
      pre_challenge5_originalname: pre_challenge5_originalfilename,
      url: url,
      prod_url: prod_url,
      homeImage: homeImage,
      challenge_url1: challenge_url1,
      challenge_url2: challenge_url2,
      challenge_url3: challenge_url3,
      challenge_url4: challenge_url4,
      challenge_url5: challenge_url5,
      user: req.user
    });
  });
}); 
// 콘텐츠관리 챌린지 edit


router.put('/Challenge/:id', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}, {
  name: 'homeimage'
}, {
  name: 'challenge_image1'
}, {
  name: 'challenge_image2'
}, {
  name: 'challenge_image3'
}, {
  name: 'challenge_image4'
}, {
  name: 'challenge_image5'
}]), isLoggedIn, function (req, res, next) {
  req.body.post.updatedAt = Date.now();
  req.body.post.filename = req.files['image'][0].key;
  req.body.post.originalName = req.files['image'][0].originalname;
  // req.body.post.prodfilename = req.files['prodimage'][0].key;
  // req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
  req.body.post.homeimage_filename = req.files['homeimage'][0].key;
  req.body.post.homeimage_originalname = req.files['homeimage'][0].originalname;
  req.body.post.challenge_image1_filename = req.files['challenge_image1'][0].key;
  req.body.post.challenge_image1_originalname = req.files['challenge_image1'][0].originalname;

  if (req.files['challenge_image2']) {
    req.body.post.challenge_image2_filename = req.files['challenge_image2'][0].key;
    req.body.post.challenge_image2_originalname = req.files['challenge_image2'][0].originalname;
  }
  if (req.files['challenge_image3']) {
    req.body.post.challenge_image3_filename = req.files['challenge_image3'][0].key;
    req.body.post.challenge_image3_originalname = req.files['challenge_image3'][0].originalname;
  }

  if (req.files['challenge_image4']) {
    req.body.post.challenge_image4_filename = req.files['challenge_image4'][0].key;
    req.body.post.challenge_image4_originalname = req.files['challenge_image4'][0].originalname;
  }

  if (req.files['challenge_image5']) {
    req.body.post.challenge_image5_filename = req.files['challenge_image5'][0].key;
    req.body.post.challenge_image5_originalname = req.files['challenge_image5'][0].originalname;
  }

  var params = {
    Bucket: 'plinic',
    Delete: { // required
      Objects: [ // required
        {
          Key: req.body.prefilename // required
        },
        {
          Key: req.body.preprodfilename // required
        },
        {
          Key: req.body.pre_challenge1_filename // required
        },
        {
          Key: req.body.pre_challenge2_filename // required
        },
        {
          Key: req.body.pre_challenge3_filename // required
        },
        {
          Key: req.body.pre_challenge4_filename // required
        },
        {
          Key: req.body.pre_challenge5_filename // required
        },
        {
          Key: req.body.pre_challenge5_filename // required
        },

      ]
    }
  };
  s3.deleteObjects(params, function (err, data) {
    if (err) {
      console.log("케어존 수정 아마존 파일 삭제 에러 : " + req.body.prefilename + "err : " + err);
      res.status(500);
    }
    else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    Carezone.findOneAndUpdate({
      _id: req.params.id,
      // author: req.user._id
    }, req.body.post, function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      if (!post) return res.json({
        success: false,
        message: "No data found to update"
      });
      res.redirect('/contents/Challenge/' + req.params.id);
    });
  });
}); 
//update


router.put('/Challenge/SeqUpdate/:id', isLoggedIn, function (req, res, next) {
  // console.log(req.params.id);
  // console.log(req.body);
  // console.log(req.body.seq[0]);
  req.body.seq = req.body.seq[0];
  req.body.updatedAt = Date.now();
  Carezone.findOneAndUpdate({
    _id: req.body.seqNumberId[0],
  }, req.body, function (err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    if (!post) return res.json({
      success: false,
      message: "No data found to update"
    });
    res.redirect('/contents/Challenge/newIndex');
  });
});


router.post('/:id/comments', function(req, res) {

  //사용자의 Email을 User Collection에서 찾아서 PushToken키를 가져온다.
  var pushtoken = '';
  if(req.body.post.email !== '') {
    User.findOne({
      email : req.body.post.email
    },function(err, User) {
      if(User) {
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: User.pushtoken,
          // collapse_key: 'your_collapse_key',

          notification: {
            // "title": this.beautyNoteOneLoadData.title,
            // "body": this.registerReply.comment,
            // "subtitle" : '댓글알림 subtitle',
            // "badge": 1,
            title: '플리닉 보상 알림',
            body: req.body.comment.body,
            sound: "default",
            click_action: "FCM_PLUGIN_ACTIVITY",
          },

          data: { //you can send only notification or only data(or include both)
            mode: "alarm",
            id: req.body._id
          }
        };

        fcm.send(message, function(err, response) {
          if (err) {
            console.log("챌린지 보상 푸시 전송 실패 " + req.body.email);
          } else {
            console.log("Successfully sent with response: ", response);
          }
        });
      }
    });

    //알람 테이블에 해당 내용 저장
    Alarm.create({
      writerEmail: req.body.post.email, //게시글 이메일
      email: req.body.comment.email, //관리자 댓글 이메일
      skinId: req.params.id, //게시글 아이디
      alertType: "챌린지알림",
      // alarmName: "축하합니다! 챌린지에 성공하여 이벤트 상품이 발송 될 예정입니다.",
      alarmName: req.body.comment.body,
      alarmDesc: req.body.comment.body,
      alarmCondition: false,
      mange: true,
      
    }, function(err, counter) {
      if (err) return response.json({
        success: false,
        message: err
      });
    });

  }


  var newComment = req.body.comment;
  newComment.author = req.user._id;
  Reward.update({
    _id: req.params.id
  }, {
    $push: {
      comments: newComment
    }
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    res.redirect('/challengeSuccess/Challenge/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); 
//create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  Reward.update({
        _id: req.params.postId
      }, {
        $pull: {
          comments: {
            _id: req.params.commentId
          }
        }
      },
      function(err, post) {
        if (err) return res.json({
          success: false,
          message: err
        });
        res.redirect('/challengeSuccess/Challenge/' + req.params.postId + "?" +
            req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
      });
}); 
//destroy a comment


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;


function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (
    queries.searchType &&
    queries.searchText &&
    queries.searchText.length >= 2
  ) {
    //검색어 글자수 제한 하는 것
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("email") >= 0) {
      postQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.email = queries.searchText;
    }
    if (searchTypes.indexOf("name") >= 0) {
      postQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.name = queries.searchText;
    }
    if (searchTypes.indexOf("author!") >= 0) {
      findUser = {
        nickname: queries.searchText
      };
      highlight.author = queries.searchText;
    } else if (searchTypes.indexOf("author") >= 0) {
      findUser = {
        nickname: {
          $regex: new RegExp(queries.searchText, "i")
        }
      };
      highlight.author = queries.searchText;
    }
    if (postQueries.length > 0)
      findPost = {
        $or: postQueries
      };
  }
  return {
    searchType: queries.searchType,
    searchText: queries.searchText,
    findPost: findPost,
    findUser: findUser,
    highlight: highlight
  };
}

function createSearchTest(querie) {
  findUser = null
  if (!isEmpty2(querie.termCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date()
        today = today.setMonth(today.getMonth());;
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.yesterday)) {
        var today = new Date();
        today = today.setDate(today.getDate());
        var preToday = created.setDate(created.getDate()-1);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        today = today.setDate(today.getDate());
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        today = today.setMonth(today.getMonth());
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!querie.termCheck.startDate && !querie.termCheck.endDate)) {
        // var startDate = startDate.setDate(startDate.getDate());
        // var endDate = endDate.setDate(endDate.getDate());
        dayCreated.push({
          createdAt: {
            $gte: querie.termCheck.startDate,
            $lte: querie.termCheck.endDate,
          }
        });
      } else {
        dayCreated.push();
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.yesterday) ? findAfter.yesterday = true : findAfter.yesterday = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated : dayCreated
    };

  } else {

    var dayCreated = [];
    var findAfter = {
      all : false,
      weeklyy: false,
      monthy: false,
      yesterday: false,

    };
    if (!isEmpty2(querie.termCheck)) {
      var created = new Date();
      if(isEmpty2(!querie.termCheck.all)) {
        var today = new Date();
        today = today.setMonth(today.getMonth());
        var preToday = created.setMonth(created.getMonth()-12);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.yesterday)) {
        var today = new Date();
        today = today.setDate(today.getDate());
        var preToday = created.setDate(created.getDate()-1);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }
  
      if(isEmpty2(!querie.termCheck.weeklyy)) {
        var today = new Date();
        today = today.setDate(today.getDate());
        var preToday = created.setDate(created.getDate()-7);
        
        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.monthy)) {
        var today = new Date();
        today = today.setMonth(today.getMonth());
        var preToday = created.setMonth(created.getMonth()-1);

        dayCreated.push({
          createdAt: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!querie.termCheck.startDate && !querie.termCheck.endDate)) {
          // var startDate = startDate.setDate(startDate.getDate());
          // var endDate = endDate.setDate(endDate.getDate());
        dayCreated.push({
          createdAt: {
            $gte: querie.termCheck.startDate,
            $lte: querie.termCheck.endDate,
          }
        });
      } else {
      }

      isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!querie.termCheck.yesterday) ? findAfter.yesterday = true : findAfter.yesterday = false;
      isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
    }


    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated: dayCreated
    };
  }
  
}

function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}