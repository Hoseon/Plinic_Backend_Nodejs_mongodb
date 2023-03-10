var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Carezone = require('./models/Carezone');
var CarezoneCounter = require('./models/CarezoneCounter');
var Mission = require('./models/Mission');
var Challenge = require('./models/Challenge'); //2020-02-10 챌린지 추가
var UserImage = require('./models/UserImage');
var async = require('async');
var User_admin = require('./models/User_admin');
var multer = require('multer');
// var FTPStorage = require('multer-ftp');
var sftpStorage = require('multer-sftp');
let Client = require('ssh2-sftp-client');
var path = require('path');
var fs = require('fs');
var del = require('del');
var multerS3 = require('multer-s3');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");

let s3 = new AWS.S3();

let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'plinic',
    metadata: function(req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + '-' + Date.now()
      });
    },
    key: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    },
    acl: 'public-read'
  })
});




//let UPLOAD_PATH = "./uploads/"

//multer 선언 이미지 rest api 개발 20190425
// var storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, path.join(__dirname, '../uploads/'));
//     //cb(null, UPLOAD_PATH)
//   },
//   filename: function(req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })
//
// let upload = multer({
//   storage: storage
// });
//
// var sftpUpload = multer({
//   storage: new sftpStorage({
//     sftp: {
//       host: 'g1partners1.cafe24.com',
//       // secure: true, // enables FTPS/FTP with TLS
//       port: 3822,
//       user: 'g1partners1',
//       password: 'g100210!!',
//     },
//     // basepath: '/www/plinic',
//     destination: function(req, file, cb) {
//       cb(null, '/www/plinic')
//     },
//     filename: function(req, file, cb) {
//       cb(null, file.fieldname + '-' + Date.now())
//     }
//   })
// });
//
// const sftpconfig = {
//   host: 'g1partners1.cafe24.com',
//   port: 3822,
//   user: 'g1partners1',
//   password: 'g100210!!'
// };


//20210507 대댓글 저장
router.post('/:id/recomments', function(req, res) {
  // console.log(req.body);
  var newComment = req.body;
  Carezone.update({
    "comments._id" : req.params.id
  }, {
    $push: {
      "comments.$.recomments" : newComment
    }
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.status(201).json({
      'msg': '댓글이 작성되었습니다!!'
    });
  });
}); 



//20190829 사용자 플리닉 블루투스 월 사용시간 Get!
router.get('/totalusetime/:id/:date', function(req, res) {
  // console.log(req.params.id);
  // console.log(req.params.date);
  var month = req.params.date
  var startdate =  month + "-01T00:00:00.000Z";
  var enddate =   month + "-31T00:00:00.000Z";

  async.waterfall([function(callback) {
  Mission.aggregate([
    { $unwind : "$usedmission" },
    { $match: { email :  req.params.id, 'usedmission.updatedAt' : {"$gte": new Date(startdate) , "$lte" : new Date(enddate) }},
        // { "$usedmission.updatedAt" : {$gte: new Date("2019-08-29")} }

   },
    { $group: { _id : null, sum : { $sum: "$usedmission.points"}}}
  ],function(error, docs){
    res.json(docs)
  }
)
  }]);
});

//20190905 사용자 플리닉 블루투스 총 사용시간 Get!
router.get('/totalallusetime/:id', function(req, res) {
  // console.log(req.params.id);
  // console.log(req.params.date);
  // var month = req.params.date
  // var startdate =  month + "-01T00:00:00.000Z";
  // var enddate =   month + "-31T00:00:00.000Z";

  async.waterfall([function(callback) {
  Mission.aggregate([
    { $unwind : "$usedmission" },
    { $match: { email :  req.params.id},
        // { "$usedmission.updatedAt" : {$gte: new Date("2019-08-29")} }

   },
    { $group: { _id : null, sum : { $sum: "$usedmission.points"}}}
  ],function(error, docs){
    res.json(docs)
  }
)
  }]);
});


//20190905 사용자 플리닉 블루투스 월별 사용시간 랭킹 Get!
router.get('/ranktotalusetime/:date', function(req, res) {
  // console.log(req.params.id);
  // console.log(req.params.date);
  var month = req.params.date
  var startdate =  month + "-01T00:00:00.000Z";
  var enddate =   month + "-31T00:00:00.000Z";

  async.waterfall([function(callback) {
  Mission.aggregate([
    { $unwind : "$usedmission"},
    { $match: { 'usedmission.updatedAt' : {"$gte": new Date(startdate) , "$lte" : new Date(enddate) }},
        // { "$usedmission.updatedAt" : {$gte: new Date("2019-08-29")} }

   },
    { $group: { _id : '$email', sum : { $sum: "$usedmission.points"}}},
    { $sort : { sum : -1 } }
  ],function(error, docs){
    res.json(docs)
  }
)
  }]);
});


//20190617 미션 참여자 확인
router.get('/getmissionmember/:id', function(req, res) {
  async.waterfall([function(callback) {
    Mission.find({
        missionID: req.params.id
      },
      function(err, docs) {
        res.json(docs);
      }).sort({
      "usetime": -1
    });
  }]);
});

//20200413 챌린지 참여자 확인
router.get('/getchallangemember/:id', function(req, res) {
  async.waterfall([function(callback) {
    Challenge.find({
        missionID: req.params.id,
        missioncomplete : false
      },
      function(err, docs) {
        res.json(docs);
      }).sort({
      "usetime": -1
    });
  }]);
});


//20190617 미션 포기
router.get('/giveupmission/:id', function(req, res) {
  //var carezonelist = null;
  //console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.findOneAndRemove({
      email: req.params.id,
      missioncomplete: false
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//2020-02-10 챌린지 포기
router.get('/giveupchallenge/:id', function(req, res) {
  //var carezonelist = null;
  //console.log("chkmission" +req.params.id);

  Challenge.findOne({
    email: req.params.id
  }, function (err, docs) {
      if (err) {
        console.log("포기전에 챌릭지 이력 가져오기 에러 : " + req.params.id);
      }
      
      if (docs) {
        console.log("포기전 미션 이력 : ");
        console.log(JSON.stringify(docs));
      } else {
        console.log("포기전에 챌릭지 이력 가져오기 에러22 : " + req.params.id);
      }
  });

  async.waterfall([function(callback) {
    Challenge.findOneAndRemove({
      email: req.params.id,
      missioncomplete: false
    }, function (err, docs) {
        if (err) {
          console.log("미션 포기 실패 : " + req.params.id);
          res.sendStatus(400);
        }

        if (docs) {
          res.json(docs);
        } else {
          console.log("미션 포기 실패2 : " + req.params.id + " : Time " + getCovertKoreaTime(Date.now()));
          res.sendStatus(404);
        }
    });
  }]);
});

router.get('/upChallenge/:id', function(req, res) {
  //var carezonelist = null;
  //console.log("chkmission" +req.params.id);

  Challenge.findOne({
    email: req.params.id
  }, function (err, docs) {
      if (err) {
        console.log("챌릭지 이력 가져오기 에러 : " + req.params.id);
      }
      
      if (docs) {
        console.log("미션 이력 : ");
        console.log(JSON.stringify(docs));
      } else {
        console.log("챌릭지 이력 가져오기 에러22 : " + req.params.id);
      }
  });

  async.waterfall([function(callback) {
    Challenge.findOneAndUpdate({
      email: req.params.id,
      missioncomplete: false
      }, {
        $set: {
          missioncomplete: true,
          reward: true
        },
    }, 
    function (err, docs) {
        if (err) {
          console.log("미션 업데이트 실패 : " + req.params.id);
          res.sendStatus(400);
        }

        if (docs) {
          res.json(docs);
        } else {
          console.log("미션 업데이트 실패2 : " + req.params.id + " : Time " + getCovertKoreaTime(Date.now()));
          res.sendStatus(404);
        }
    });
  }]);
});

//미션 참여중인지 체크 하는 내용
router.get('/chkmission/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.find({
      email: req.params.id,
      missioncomplete: false
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//미션 참여중인지 체크 하는 내용
router.get('/challengechkmission/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Challenge.find({
      email: req.params.id,
      missioncomplete: false
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//미션 참여중인지 체크 하는 내용
router.get('/challengechkstart/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Challenge.find({
      email: req.params.id,
      // missioncomplete: false
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

// router.get('/challangecount/:id/:date', function (req, res) {
//   //2021-03-22 가져 오는 시간을 UDT로 가져오고 앱내에서 KST로 변경하여 사용자의 카운트를 매긴다.
  
//   var today = getCovertKoreaTime(new Date(req.params.date)).toISOString().substr(0,10)
//   async.waterfall([function(callback) {
//     Challenge.count({
//       missionID: req.params.id,
//       createdAt: {
//         $gte: today,
//         // $lte: new Date(req.params.date),
//       }
//     }, function(err, docs) {
//       res.json(docs);
//     });
//   }]);
// });


router.get('/challangecount/:id/:date', function (req, res) {
  //2021-03-22 가져 오는 시간을 UDT로 가져오고 앱내에서 KST로 변경하여 사용자의 카운트를 매긴다.
  
  // var start   = new Date(req.params.date);
  
  // var testday = start.setHours(start.getHours() - 9);

  // console.log(testday);

  // var today = getCovertKoreaTime(new Date(testday)).toISOString().substr(0,10)

  // console.log(today);


  var today = getCovertKoreaTime(new Date(req.params.date)).toISOString().substr(0,10)
  

  async.waterfall([function(callback) {
    Challenge.count({
      missionID: req.params.id,
      createdAt: {
        // $gte: testday,
        $gte: today,
        // $lte: new Date(req.params.date),
      }
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});


router.get('/missionusetime/:id/:email', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.findOne({
      missionID: req.params.id,
      email: req.params.email
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//2020-02-10 챌린지 사용 횟수(배열의 갯수 구하기)
router.get('/challengeusetime/:id/:email', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Challenge.findOne({
      missionID: req.params.id,
      email: req.params.email
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});

//2020-02-20 챌린지 성공 횟수(배열의 갯수 구하기)
router.get('/challengeusetime2/:id/:email', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Challenge.findOne({
      missionID: req.params.id,
      email: req.params.email,
      // missioncomplete: false,
      // reward: false,
    }, function (err, docs) {
        if (err) {
          console.log("챌린지 성공횟수 가져오기 에러 : " + req.params.email + " : " + req.params.id);
          res.sendStatus(400);
        }

        if (docs) {
          res.json(docs);
        } else {
          console.log("챌린지 성공횟수 가져오기 에러2 : " + req.params.email + " : " + req.params.id);
          res.sendStatus(400);
        }
    });
  }]);
});

router.get('/getmissionpoint/:id/:email', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.findOne({
      missionID: req.params.id,
      email: req.params.email
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});


router.get('/missionpointupdate/:id/:email/:points', function(req, res) {


  console.log("email " + req.params.email);
  console.log("id " + req.params.id);
  console.log("point " + req.params.points)

  var newPoint = req.params.points;
  newPoint.updatedAt += new Date();
  console.log("-------------- : " + newPoint);
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);

  // let mission = Mission();
  // mission.usedmission.points = 100;


  async.waterfall([function(callback) {
    Mission.findOneAndUpdate({
        missionID: req.params.id,
        email: req.params.email
      }, {
        $push: {
          usedmission: newPoint
        },
        $inc: {
          "usetime": req.params.points
        }
      },
      function(err, docs) {
        if (docs) {
          res.json(docs);
        }
        if (err)
          console.log(err);
      });
  }]);
});




router.get('/list', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find({
      "useYN" : true
      // exposure: {
      //   $lte: new Date()
      // }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "seq": 1,
      "updatedAt": -1,
      
    });
  }]);
});


//////// 과거 미션 리스트 가져 오던 로직
router.get('/firstlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find({
      startmission: {
        $lte: new Date()
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": -1
    }).limit(2);
  }]);
});



//////// 현재 케어챌린지 리스트 가져 오는 로직
router.get('/challengefirstlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find({
      // endmission: {     //종료일이 오늘 날짜/시간으로 지나지 않은것만 가져 온다.
      //   $gt: new Date()
      // }
      // "useYN" : true
      useYN : true
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "seq": 1,
      "updatedAt": -1
    })
    // .limit(5);
  }]);
});

router.get('/secondlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    var secondDay = new Date();
    var secondDay2 = new Date();
    secondDay.setDate(secondDay.getDate());
    secondDay2.setDate(secondDay2.getDate() + 3);
    Carezone.find({
      startmission: {
        $gte: secondDay,
        $lte: secondDay2
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": 1
    }).limit(2);
  }]);
});

router.get('/thirdlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    var thirdDay = new Date();
    var thirdDay2 = new Date();
    thirdDay.setDate(thirdDay.getDate() + 3);
    thirdDay2.setDate(thirdDay2.getDate() + 10);
    Carezone.find({
      startmission: {
        $gte: thirdDay,
        $lt: thirdDay2
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": 1
    }).limit(1);
  }]);
});

router.get('/moresecondlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    var secondDay = new Date();
    var secondDay2 = new Date();
    secondDay.setDate(secondDay.getDate());
    secondDay2.setDate(secondDay2.getDate() + 3);
    Carezone.find({
      startmission: {
        $gte: secondDay,
        $lte: secondDay2
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": 1
    }).limit(1);
  }]);
});

router.get('/morethirdlist', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    var thirdDay = new Date();
    var thirdDay2 = new Date();
    thirdDay.setDate(thirdDay.getDate() + 3);
    thirdDay2.setDate(thirdDay2.getDate() + 10);
    Carezone.find({
      startmission: {
        $gte: thirdDay,
        $lt: thirdDay2
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": 1
    }).limit(2);
  }]);
});

router.get('/main_list', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.find({
      exposure: {
        $lte: new Date()
      }
    }, function(err, docs) {
      res.json(docs);
    }).sort({
      "startmission": 1
    }).limit(3);
  }]);
});

router.get('/mission/:id', function(req, res) {
  //var carezonelist = null;
  async.waterfall([function(callback) {
    Carezone.findOne({
      _id: req.params.id
    }, function(err, docs) {
      res.json(docs);
    })
  }]);
});



router.get('/', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1; //현재 페이지가 2페이지 이상인 경우 제어
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10; //한페이지에 보여지는 노출 갯수
  var search = createSearch(req.query);
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function(callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function(err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function(user) {
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
  }, function(callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Carezone.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit; //다음페이지로 넘어가고 전페이지의 만큼의 갯수를 뺸 후 노출갯수를 표현한다.
      maxPage = Math.ceil(count / limit); //최대 페이지는 현재 모든 아이템 갯수 나누니 노출갯수를 나누어 페이지 표시를 한다.
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Carezone.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, carezone) {
      if (err) callback(err);
      callback(null, carezone, maxPage);
    });
  }], function(err, carezone, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("carezone/index", {
      carezone: carezone,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // index

router.get('/newIndex', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10;
  var search = createSearch(req.query);
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function(callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function(err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function(user) {
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
  }, function(callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Carezone.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Carezone.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, carezone) {
      if (err) callback(err);
      callback(null, carezone, maxPage);
    });
  }], function(err, carezone, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/ChallengeMgt/index", {
      carezone: carezone,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // new index

router.get('/nIndex', function(req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 10;
  var search = createSearch(req.query);
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      vistorCounter = counter;
      callback(null);
    });
  }, function(callback) {
    if (!search.findUser) return callback(null);
    User_admin.find(search.findUser, function(err, users) {
      if (err) callback(err);
      var or = [];
      users.forEach(function(user) {
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
  }, function(callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Carezone.count(search.findPost, function(err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function(skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Carezone.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err, carezone) {
      if (err) callback(err);
      callback(null, carezone, maxPage);
    });
  }], function(err, carezone, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Contents/Comments/ChallengeComment/index", {
      carezone: carezone,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // nIndex 챌린지 댓글 리스트


router.get('/new', isLoggedIn, function(req, res) {
  res.render("carezone/new", {
    user: req.user
  });
}); // new



router.post('/', s3upload.fields([{
  name: 'image'
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
}]), isLoggedIn, function(req, res, next) {
  async.waterfall([function(callback) {
    CarezoneCounter.findOne({
      name: "carezone"
    }, function(err, counter) {
      if (err) callback(err);
      if (counter) {
        callback(null, counter);
      } else {
        CarezoneCounter.create({
          name: "carezone",
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

    if(req.files['challenge_image2']){
      req.body.post.challenge_image2_filename = req.files['challenge_image2'][0].key;
      req.body.post.challenge_image2_originalname = req.files['challenge_image2'][0].originalname;
    }
    if(req.files['challenge_image3']){
      req.body.post.challenge_image3_filename = req.files['challenge_image3'][0].key;
      req.body.post.challenge_image3_originalname = req.files['challenge_image3'][0].originalname;
    }
    if(req.files['challenge_image4']){
      req.body.post.challenge_image4_filename = req.files['challenge_image4'][0].key;
      req.body.post.challenge_image4_originalname = req.files['challenge_image4'][0].originalname;
    }
    if(req.files['challenge_image5']){
      req.body.post.challenge_image5_filename = req.files['challenge_image5'][0].key;
      req.body.post.challenge_image5_originalname = req.files['challenge_image5'][0].originalname;
    }
    Carezone.create(req.body.post, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      counter.totalCount++;
      counter.save();
      res.redirect('/carezone');
    });
  });
}); // create





router.get('/:id', function(req, res) {
  Carezone.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      //배너 이미지 가져 오기 20190502
      //res.setHeader('Content-Type', 'image/jpeg');
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      var homeImage = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.homeimage_filename;
      var challenge_url1 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image1_filename;
      var challenge_url2 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image2_filename;
      var challenge_url3 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image3_filename;
      var challenge_url4 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image4_filename;
      var challenge_url5 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image5_filename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("carezone/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        homeImage: homeImage,
        challenge_url1: challenge_url1,
        challenge_url2: challenge_url2,
        challenge_url3: challenge_url3,
        challenge_url4: challenge_url4,
        challenge_url5: challenge_url5,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // show

router.get('/nIndex/:id', function(req, res) {
  Carezone.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      post.views++;
      post.save();

      //배너 이미지 가져 오기 20190502
      //res.setHeader('Content-Type', 'image/jpeg');
      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      var challenge_url1 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image1_filename;
      var challenge_url2 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image2_filename;
      var challenge_url3 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image3_filename;
      var challenge_url4 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image4_filename;
      var challenge_url5 = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.challenge_image5_filename;
      //fs.createReadStream(path.join(__dirname, '../uploads/', post.filename)).pipe(res);
      res.render("PlinicAdmin/Contents/Comments/ChallengeComment/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        challenge_url1: challenge_url1,
        challenge_url2: challenge_url2,
        challenge_url3: challenge_url3,
        challenge_url4: challenge_url4,
        challenge_url5: challenge_url5,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // show


router.get('/:id/edit', isLoggedIn, function(req, res) {
  Carezone.findById(req.params.id, function(err, post) {
    // var url = req.protocol + '://' + req.get('host') + '/carezone_images/' + post._id;
    var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
    // var prod_url = req.protocol + '://' + req.get('host') + '/prod_images/' + post._id;
    var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
    // var challenge_url1 = req.protocol + '://' + req.get('host') + '/challenge_image1/' + post._id;
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
    res.render("carezone/edit", {
      post: post,
      prefilename: prefilename,
      preoriginalName: preoriginalName,
      preprodfilename: preprodfilename,
      preprodoriginalname: preprodoriginalname,
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
      challenge_url1: challenge_url1,
      challenge_url2: challenge_url2,
      challenge_url3: challenge_url3,
      challenge_url4: challenge_url4,
      challenge_url5: challenge_url5,
      user: req.user
    });
  });
}); // edit

router.put('/:id', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
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
}]), isLoggedIn, function(req, res, next) {
  req.body.post.updatedAt = Date.now();
  req.body.post.filename = req.files['image'][0].key;
  req.body.post.originalName = req.files['image'][0].originalname;
  req.body.post.prodfilename = req.files['prodimage'][0].key;
  req.body.post.prodoriginalname = req.files['prodimage'][0].originalname;
  req.body.post.challenge_image1_filename = req.files['challenge_image1'][0].key;
  req.body.post.challenge_image1_originalname = req.files['challenge_image1'][0].originalname;

  if(req.files['challenge_image2']){
    req.body.post.challenge_image2_filename = req.files['challenge_image2'][0].key;
    req.body.post.challenge_image2_originalname = req.files['challenge_image2'][0].originalname;
  }
  if(req.files['challenge_image3']){
    req.body.post.challenge_image3_filename = req.files['challenge_image3'][0].key;
    req.body.post.challenge_image3_originalname = req.files['challenge_image3'][0].originalname;
  }

  if(req.files['challenge_image4']){
    req.body.post.challenge_image4_filename = req.files['challenge_image4'][0].key;
    req.body.post.challenge_image4_originalname = req.files['challenge_image4'][0].originalname;
  }

  if(req.files['challenge_image5']){
    req.body.post.challenge_image5_filename = req.files['challenge_image5'][0].key;
    req.body.post.challenge_image5_originalname = req.files['challenge_image5'][0].originalname;
  }

  // var s3parmas = {
  //   Bucket: 'plinic',
  //   Key: req.body.prefilename,
  //   Key: req.body.preprodfilename,
  //   Key: req.body.pre_challenge1_filename,
  //   Key: req.body.pre_challenge2_filename,
  //   Key: req.body.pre_challenge3_filename,
  //   Key: req.body.pre_challenge4_filename,
  //   Key: req.body.pre_challenge5_filename,
  // };

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
        }
      ]
    }
  };
  s3.deleteObjects(params, function(err, data){
    if(err) {
      console.log("케어존 수정 아마존 파일 삭제 에러 : " + req.body.prefilename + "err : " + err);
      res.status(500);
    }
    else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    Carezone.findOneAndUpdate({
      _id: req.params.id,
      // author: req.user._id
    }, req.body.post, function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      if (!post) return res.json({
        success: false,
        message: "No data found to update"
      });
      res.redirect('/carezone/' + req.params.id);
    });
  });

  // del([path.join(__dirname, '../uploads/', req.body.prefilename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.preprodfilename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.pre_challenge1_filename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.pre_challenge2_filename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.pre_challenge3_filename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.pre_challenge4_filename)]).then(deleted => {});
  // del([path.join(__dirname, '../uploads/', req.body.pre_challenge5_filename)]).then(deleted => {});
}); //update



router.delete('/:id', isLoggedIn, function(req, res, next) {
  Carezone.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function(err, post) {
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
          { Key: post.challenge_image1_filename },
          { Key: post.challenge_image2_filename },
          { Key: post.challenge_image3_filename },
          { Key: post.challenge_image4_filename },
          { Key: post.challenge_image5_filename }
        ]
      }
    };
    s3.deleteObjects(params, function(err, data){
      console.log()
      if(err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/carezone');
  });
}); //destroy



router.post('/:id/comments', function(req, res) {
  var newComment = req.body.comment;
  newComment.author = req.user._id;
  Carezone.update({
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
    res.redirect('/carezone/' + req.params.id + "?" + req._parsedUrl.query);
  });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req, res) {
  Carezone.update({
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
      res.redirect('/carezone/' + req.params.postId + "?" +
        req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
    });
}); //destroy a comment




//20191002 사용자가 참여한 미션 이력 구하기
router.get('/historymission/:id', function(req, res) {
  //var carezonelist = null;
  // console.log("chkmission" +req.params.id);
  async.waterfall([function(callback) {
    Mission.find({
      email: req.params.id
    }, function(err, docs) {
      res.json(docs);
    });
  }]);
});


//20191025 사용자 이미지 가져 오기

router.get('/chkuserimage/:id', (req, res, next) => {

  UserImage.findOne({
    email: req.params.id
  }, function(err, image) {
    if (err) {
      res.sendStatus(404);
    }
    if (!image) {
      res.json('NOTFOUND');
    }
    if (image) {
      var filename = image.filename;
      res.json(filename);
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    }
    //res.json(docs);
  });
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect('/');
}

module.exports = router;

function createSearch(queries) {
  var findPost = {},
    findUser = null,
    highlight = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 2) { //검색어 글자수 제한 하는 것
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("title") >= 0) {
      postQueries.push({
        title: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.title = queries.searchText;
    }
    if (searchTypes.indexOf("body") >= 0) {
      postQueries.push({
        body: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.body = queries.searchText;
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
    if (postQueries.length > 0) findPost = {
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

function getCovertKoreaTime(time) {
  return new Date(
    new Date(time).getTime() - new Date().getTimezoneOffset() * 60000
  )

function get2digits(num) {
  return ("0" + num).slice(-2);
}
  
function getFormattedDate(date) {
  return date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate());
};

}
