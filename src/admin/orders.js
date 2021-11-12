var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var async = require("async");
var User_admin = require("../models/User_admin");
var Orders = require("../models/Orders");
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
var OrdersCounter = require("../models/OrdersCounter");

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

router.get("/Main", function (req, res) {
  return res.render("PlinicAdmin/Orders/Main/index", {});
});
//주문 관리 메인 화면

router.get('/', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 20;
  var search = createSearch(req.query);
  // var testSearch = createSearchTest(req.query);
  async.waterfall([
    function (callback) {
    if (!search.findUser) return callback(null);
    Orders.find(search.findUser, function (err, users) {
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
      };
      callback(null);
    });
  }, function (callback) {
    if (search.findUser && !search.findPost.$or || search.findUser && 
      search.dayCreated[0]) 
    return callback(null, null, 0);
    Orders.count(search.findPost || search.dayCreated[0], function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, 
  function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or ||    
      search.findUser && search.dayCreated[0]) 
    return callback(null, [], 0);

    if(search.dayCreated[0]) {
      Orders.find(search.dayCreated[0])
      .sort({paid_at : -1})
      .skip(skip)
      .limit(limit)
      .exec(function(err, orders) {
        if (err) callback(err);
        callback(null, orders, maxPage);
      });
    } else {
    Orders.find(search.findPost)
    .sort({ paid_at: -1 })
    .skip(skip)
    .limit(limit)
    .exec(function (err, orders) {
      if (err) callback(err);
      callback(null, orders, maxPage);
    });
  }
  }], 
  function (err, orders, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Orders/OrderMgt/index", {
      orders: orders,
      user: req.user,
      page: page,
      maxPage: maxPage,
      urlQuery: req._parsedUrl.query,
      search: search,
      // testSearch: testSearch,
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // new index


router.post('/statusUpdate/:id', function(req, res) {
  // console.log(req.body);
  var newstatus = req.body;
  Orders.findOneAndUpdate({
    _id: req.params.id,
  }, 
  req.body.post,
  {
    $push: {
      body: newstatus
    }
  }, 
  function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    res.redirect("/orders/");
  });
}); // 주문 상태 업데이트


router.post('/:id/deliverNoUpdate', function(req, res) {
    // console.log(req.body);
    var status = req.body;
    var newdeliverNo = req.body;
    // status = 'deliver_during';
    Orders.findOneAndUpdate({
      _id: req.params.id
    }, 
    req.body.post,
    {
      $push: {
        body: newdeliverNo
      }
    }, 
    function(err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });
      res.redirect("/orders/");
    });
  }); // 운송장 번호 Update


  router.delete('/del/:id', isLoggedIn, function(req, res, next) {
    Orders.findOneAndRemove({
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
          ]
        }
      };
      s3.deleteObjects(params, function(err, data){
        if(err) {
          console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
          res.status(500);
        }
        else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
      });
      res.redirect('/orders/');
    });
  }); // 데이터 삭제


  router.post('/', isLoggedIn, function(req, res, next){

    async.waterfall([function(callback){
      OrdersCounter.findOne({name:"orders"}, function (err,counter) {
        if(err) callback(err);
        if(counter){
           callback(null, counter);
        } else {
          
        }
      });
    }],function(callback, counter){
      var newPost = req.body.post;
      newPost.author = req.user._id;
      Orders.create(req.body.post,function (err,post) {
        if(err) return res.json({success:false, message:err});
        res.redirect('/orders');
      });
    });
  });


router.get("/:id", function (req, res) {
  Orders.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });

      // console.log(post);

      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;
      res.render("PlinicAdmin/Orders/OrderMgt/show", {
        post: post,
        url: url,
        prod_url: prod_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 제품 상세페이지 show




function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("postsMessage", "Please login first.");
  res.redirect("/");
}

module.exports = router;


// function createSearchTest(querie) {

//   findUser = null

//   if (!isEmpty2(querie.termCheck)) {
//     var dayCreated = [];//기간별 조희
//     var findAfter = {
//     };

//     if (!isEmpty2(querie.termCheck)) {
//       var paid_at = new Date();
//       if(isEmpty2(!querie.termCheck.all)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-12);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       if(isEmpty2(!querie.termCheck.dday)) {
//         var today = new Date();
//         var preToday = paid_at;
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       if(isEmpty2(!querie.termCheck.threeDay)) {
//         var today = new Date();
//         var preToday = paid_at.setDate(paid_at.getDate()-3);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }
  
//       if(isEmpty2(!querie.termCheck.weeklyy)) {
//         var today = new Date();
//         var preToday = paid_at.setDate(paid_at.getDate()-7);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       if(isEmpty2(!querie.termCheck.monthy)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-1);

//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       if(isEmpty2(!querie.termCheck.threeMonthy)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-3);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       if(isEmpty2(!querie.termCheck.year)) {
//         var today = new Date();
//         var preToday = paid_at.setFullYear(paid_at.getFullYear()-1);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//         dayCreated.push();
//       }

//       isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
//       isEmpty2(!querie.termCheck.dday) ? findAfter.dday = true : findAfter.dday = false;
//       isEmpty2(!querie.termCheck.threeDay) ? findAfter.threeDay = true : findAfter.threeDay = false;
//       isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
//       isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
//       isEmpty2(!querie.termCheck.threeMonthy) ? findAfter.threeMonthy = true : findAfter.threeMonthy = false;
//       isEmpty2(!querie.termCheck.year) ? findAfter.year = true : findAfter.year = false;
//     }

//     return {
//       findUser: findUser,
//       findAfter: findAfter,
//       dayCreated : dayCreated
//     };

//   } else {

//     findUser = null

//     var dayCreated = [];
//     var findAfter = {
//       all: false,
//       ddaty: false,
//       threeDay: false,
//       weeklyy: false,
//       monthy: false,
//       threeMonthy: false,
//       year: false,
//     };

//     if (!isEmpty2(querie.termCheck)) {
//       var paid_at = new Date();
//       if(isEmpty2(!querie.termCheck.all)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-12);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       if(isEmpty2(!querie.termCheck.dday)) {
//         var today = new Date();
//         var preToday = paid_at;
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       if(isEmpty2(!querie.termCheck.threeDay)) {
//         var today = new Date();
//         var preToday = paid_at.setDate(paid_at.getDate()-3);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }
  
//       if(isEmpty2(!querie.termCheck.weeklyy)) {
//         var today = new Date();
//         var preToday = paid_at.setDate(paid_at.getDate()-7);
        
//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       if(isEmpty2(!querie.termCheck.monthy)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-1);

//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       if(isEmpty2(!querie.termCheck.threeMonthy)) {
//         var today = new Date();
//         var preToday = paid_at.setMonth(paid_at.getMonth()-3);

//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       if(isEmpty2(!querie.termCheck.year)) {
//         var today = new Date();
//         var preToday = paid_at.setFullYear(paid_at.getFullYear()-1);

//         dayCreated.push({
//           paid_at: {
//             $gte: preToday,
//             $lte: today,
//           }
//         });
//       } else {
//       }

//       isEmpty2(!querie.termCheck.all) ? findAfter.all = true : findAfter.all = false;
//       isEmpty2(!querie.termCheck.dday) ? findAfter.dday = true : findAfter.dday = false;
//       isEmpty2(!querie.termCheck.threeDay) ? findAfter.threeDay = true : findAfter.threeDay = false;
//       isEmpty2(!querie.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
//       isEmpty2(!querie.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
//       isEmpty2(!querie.termCheck.threeMonthy) ? findAfter.threeMonthy = true : findAfter.threeMonthy = false;
//       isEmpty2(!querie.termCheck.year) ? findAfter.year = true : findAfter.year = false;
//     }


//     return {
//       findUser: findUser,
//       findAfter: findAfter,
//       dayCreated: dayCreated
//     };
//   }
  
// }

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
    // var searchTypes = queries.searchType.toLowerCase().split(",");
    var searchTypes = queries.searchType;
    var postQueries = [];
    if (searchTypes.indexOf("imp_uid") >= 0) {
      postQueries.push({
        imp_uid: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.imp_uid = queries.searchText;
    }
    if (searchTypes.indexOf("buyer_email") >= 0) {
      postQueries.push({
        buyer_email: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.buyer_email = queries.searchText;
    }
    if (searchTypes.indexOf("buyer_tel") >= 0) {
      postQueries.push({
        buyer_tel: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.buyer_tel = queries.searchText;
    }
    if (searchTypes.indexOf("buyer_name") >= 0) {
      postQueries.push({
        buyer_name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.buyer_name = queries.searchText;
    }
    if (searchTypes.indexOf("name") >= 0) {
      postQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.name = queries.searchText;
    }
    if (searchTypes.indexOf("deliverNo") >= 0) {
      postQueries.push({
        deliverNo: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.deliverNo = queries.searchText;
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
  } else if(queries.searchType && queries.searchText === '') {
    var postQueries = [];
    // var searchTypes = queries.searchType.toLowerCase().split(",");
    var searchTypes = queries.searchType;

    if (searchTypes.indexOf("deliver_completed")>= 0) {
      postQueries.push({
        status: {
          $regex: "deliver_completed"
        }
      });
      highlight.status = queries.searchType;
    }
    if (searchTypes.indexOf("cencel_completed")>= 0) {
      postQueries.push({
        status: {
          $regex: "cencel_completed"
        }
      });
      highlight.status = queries.searchType;
    }
    if (searchTypes.indexOf("return_request")>= 0) {
      postQueries.push({
        status: {
          $regex: "return_request"
        }
      });
      highlight.status = queries.searchType;
    }
    if (searchTypes.indexOf("return_completed")>= 0) {
      postQueries.push({
        status: {
          $regex: "return_completed"
        }
      });
      highlight.status = queries.searchType;
    }
    if (searchTypes.indexOf("swap_request")>= 0) {
      postQueries.push({
        status: {
          $regex: "swap_request"
        }
      });
      highlight.status = queries.searchType;
    }
    if (searchTypes.indexOf("swap_completed")>= 0) {
      postQueries.push({
        status: {
          $regex: "swap_completed"
        }
      });
      highlight.status = queries.searchType;
    }

    if (searchTypes.indexOf("author!")>= 0) {
      findUser = {
        nickname: author
      };
      highlight.author = author
    } else if (searchTypes.indexOf("author")>= 0) {
      findUser = {
        nickname: {
          nickname: author
        }
      };
      highlight.author = author
    }
    if (postQueries.length > 0)
    findPost = {
      $or: postQueries
    };
    
  }
  // return {
  //   searchType: queries.searchType,
  //   searchText: queries.searchText,
  //   findPost: findPost,
  //   findUser: findUser,
  //   // testPostQueries: testPostQueries,
  //   highlight: highlight
  // };




  if (!isEmpty2(queries.termCheck)) {
    var dayCreated = [];//기간별 조희
    var findAfter = {
    };

    if (!isEmpty2(queries.termCheck)) {
      var paid_at = new Date();
      if(isEmpty2(!queries.termCheck.all)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-12);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.dday)) {
        var today = new Date();
        var preToday = paid_at;
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.threeDay)) {
        var today = new Date();
        var preToday = paid_at.setDate(paid_at.getDate()-3);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }
  
      if(isEmpty2(!queries.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = paid_at.setDate(paid_at.getDate()-7);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.monthy)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-1);

        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.threeMonthy)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-3);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.year)) {
        var today = new Date();
        var preToday = paid_at.setFullYear(paid_at.getFullYear()-1);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.status_ready)) {
        
        dayCreated.push({
          status: {
            $regex: "status_ready"
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.paid)) {
        
        dayCreated.push({
          status: {
            $regex: "paid"
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.deliver_ready)) {
        
        dayCreated.push({
          status: {
            $regex: "deliver_ready"
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.deliver_during)) {
        
        dayCreated.push({
          status: {
            $regex: "deliver_during"
          }
        });
      } else {
        dayCreated.push();
      }

      if(isEmpty2(!queries.termCheck.deliver_completed)) {
        
        dayCreated.push({
          status: {
            $regex: "deliver_completed"
          }
        });
      } else {
        dayCreated.push();
      }

      // point 결제 확인중 ~ 체크박스 식
      isEmpty2(!queries.termCheck.status_ready) ? findAfter.status_ready = true : findAfter.status_ready = false;
      isEmpty2(!queries.termCheck.paid) ? findAfter.paid = true : findAfter.paid = false;
      isEmpty2(!queries.termCheck.deliver_ready) ? findAfter.deliver_ready = true : findAfter.deliver_ready = false;
      isEmpty2(!queries.termCheck.deliver_during) ? findAfter.deliver_during = true : findAfter.deliver_during = false;
      isEmpty2(!queries.termCheck.deliver_completed) ? findAfter.deliver_completed = true : findAfter.deliver_completed = false;
      

      isEmpty2(!queries.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!queries.termCheck.dday) ? findAfter.dday = true : findAfter.dday = false;
      isEmpty2(!queries.termCheck.threeDay) ? findAfter.threeDay = true : findAfter.threeDay = false;
      isEmpty2(!queries.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!queries.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
      isEmpty2(!queries.termCheck.threeMonthy) ? findAfter.threeMonthy = true : findAfter.threeMonthy = false;
      isEmpty2(!queries.termCheck.year) ? findAfter.year = true : findAfter.year = false;
    }

    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated : dayCreated,
      searchType: queries.searchType,
      searchText: queries.searchText,
      findPost: findPost,
      // testPostQueries: testPostQueries,
      highlight: highlight
    };

  } else {

    findUser = null

    var dayCreated = [];
    var findAfter = {
      all: false,
      ddaty: false,
      threeDay: false,
      weeklyy: false,
      monthy: false,
      threeMonthy: false,
      year: false,
    };

    if (!isEmpty2(queries.termCheck)) {
      var paid_at = new Date();
      if(isEmpty2(!queries.termCheck.all)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-12);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.dday)) {
        var today = new Date();
        var preToday = paid_at;
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.threeDay)) {
        var today = new Date();
        var preToday = paid_at.setDate(paid_at.getDate()-3);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }
  
      if(isEmpty2(!queries.termCheck.weeklyy)) {
        var today = new Date();
        var preToday = paid_at.setDate(paid_at.getDate()-7);
        
        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.monthy)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-1);

        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.threeMonthy)) {
        var today = new Date();
        var preToday = paid_at.setMonth(paid_at.getMonth()-3);

        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.year)) {
        var today = new Date();
        var preToday = paid_at.setFullYear(paid_at.getFullYear()-1);

        dayCreated.push({
          paid_at: {
            $gte: preToday,
            $lte: today,
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.status_ready)) {

        dayCreated.push({
          status: {
            $regex: "status_ready"
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.paid)) {

        dayCreated.push({
          status: {
            $regex: "paid"
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.deliver_ready)) {

        dayCreated.push({
          status: {
            $regex: "deliver_ready"
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.deliver_during)) {

        dayCreated.push({
          status: {
            $regex: "deliver_during"
          }
        });
      } else {
      }

      if(isEmpty2(!queries.termCheck.deliver_completed)) {

        dayCreated.push({
          status: {
            $regex: "deliver_completed"
          }
        });
      } else {
      }

      // point 결제 확인중~ 체크박스 식
      isEmpty2(!queries.termCheck.status_ready) ? findAfter.status_ready = true : findAfter.status_ready = false;
      isEmpty2(!queries.termCheck.paid) ? findAfter.paid = true : findAfter.paid = false;
      isEmpty2(!queries.termCheck.deliver_ready) ? findAfter.deliver_ready = true : findAfter.deliver_ready = false;
      isEmpty2(!queries.termCheck.deliver_during) ? findAfter.deliver_during = true : findAfter.deliver_during = false;
      isEmpty2(!queries.termCheck.deliver_completed) ? findAfter.deliver_completed = true : findAfter.deliver_completed = false;


      isEmpty2(!queries.termCheck.all) ? findAfter.all = true : findAfter.all = false;
      isEmpty2(!queries.termCheck.dday) ? findAfter.dday = true : findAfter.dday = false;
      isEmpty2(!queries.termCheck.threeDay) ? findAfter.threeDay = true : findAfter.threeDay = false;
      isEmpty2(!queries.termCheck.weeklyy) ? findAfter.weeklyy = true : findAfter.weeklyy = false;
      isEmpty2(!queries.termCheck.monthy) ? findAfter.monthy = true : findAfter.monthy = false;
      isEmpty2(!queries.termCheck.threeMonthy) ? findAfter.threeMonthy = true : findAfter.threeMonthy = false;
      isEmpty2(!queries.termCheck.year) ? findAfter.year = true : findAfter.year = false;
    }


    return {
      findUser: findUser,
      findAfter: findAfter,
      dayCreated: dayCreated,
      searchType: queries.searchType,
      searchText: queries.searchText,
      findPost: findPost,
      // testPostQueries: testPostQueries,
      highlight: highlight
    };
  }
}


// function createSearchTest(querie) {
//   findUser = null,
//   highlight = {};

//   if(querie.testSearchType){
//     var testPostQueries = [];
//     // var testSearchType = queries.testSearchType.toLowerCase().split(",");
//     var testSearchTypes = querie.testSearchType;
//     if (testSearchTypes.indexOf("status_ready,paid,deliver_ready,deliver_during,deliver_completed")>= 0) {
//       testPostQueries.push({
//         status: {
//           $regex: "status_ready,paid,deliver_ready,deliver_during,deliver_completed"
//         }
//       });
//       highlight.status = "status_ready,paid,deliver_ready,deliver_during,deliver_completed";
//     }

//     if (testSearchTypes.indexOf("cencel_request,cencel_progress,cencel_completed")>= 0) {
//       testPostQueries.push({
//         status: {
//           $regex: "cencel_request,cencel_progress,cencel_completed"
//         }
//       });
//       highlight.status = "cencel_request,cencel_progress,cencel_completed";
//     }

//     if (testSearchTypes.indexOf("return_request,return_progress,return_completed")>= 0) {
//       testPostQueries.push({
//         status: {
//           $regex: "return_request,return_progress,return_completed"
//         }
//       });
//       highlight.status = "return_request,return_progress,return_completed";
//     }

//     if (testSearchTypes.indexOf("swap_request,swap_during,swap_completed")>= 0) {
//       testPostQueries.push({
//         status: {
//           $regex: "swap_request,swap_during,swap_completed"
//         }
//       });
//       highlight.status = "swap_request,swap_during,swap_completed";
//     }
//   }
//   return {
//     testSearchType: querie.testSearchType,
//     testPostQueries: testPostQueries,
//     highlight: highlight
//   };
// }



function isEmpty2(str) {
  if(typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false ;
}