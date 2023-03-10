var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var Product = require("../models/Product");
var ProductCounter = require("../models/ProductCounter");
var async = require("async");
var User_admin = require("../models/User_admin");
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
var multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();

let s3upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "plinic",
    metadata: function(req, file, cb) {
      console.log(file);
      cb(null, {
        fieldName: file.fieldname,
        filename: file.fieldname + "-" + Date.now()
      });
    },
    key: function(req, file, cb) {
      console.log(file);
      cb(null, file.fieldname + "-" + Date.now());
    },
    acl: "public-read"
  })
});

router.get("/Main", function(req, res) {
  return res.render("PlinicAdmin/Product/Main/index", {});
});
//상품관리 메인 화면

////////////////////////////////////// 상품 데이터

router.get("/ProductData/ProductRegister", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRegister/index", {});
});
//상품데이터 상품관리 생성 화면

router.get("/ProductData/ProductRegister/edit", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRegister/edit", {});
});
//상품데이터 상품관리 수정 화면

router.get('/', function (req, res) { 
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  var testSearch = createSearchTest(req.query);
  async.waterfall([
    function (callback) {
    if (!search.findUser) return callback(null);
    Product.find(search.findUser, function (err, users) {
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
    Product.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or
      || testSearch.findUser && testSearch.dayCreated[0].createdAt)
     return callback(null, [], 0);
    
     if(testSearch.dayCreated[0]) {
      Product.find(testSearch.dayCreated[0])
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    .exec(function (err, product) {
      if (err) callback(err);
      callback(null, product, maxPage);
    });
  } else {
    Product.find(search.findPost)
      .sort({ tab: -1 })
      // .sort({ "seq": 1 })
      .populate("author")
      // .sort({ "seq": 1, "updatedAt": -1 })
      .skip(skip)
      .limit(limit)
      .exec(function (err, product) {
        if (err) callback(err);
        callback(null, product, maxPage);
    });
  }
  }], function (err, product, maxPage) {
    if (err) return res.json({
      success: false,
      message: err
    });
    return res.render("PlinicAdmin/Product/ProductData/ProductList/index", {
      product: product,
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
}); // 상품데이터 상품관리 리스트 화면 index

router.post('/:id/productUpdate', s3upload.fields([{
  name: 'image'
}, {
  name: 'prodimage'
}]), isLoggedIn, function (req, res, next) {

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

      ]
    }
  };
  s3.deleteObjects(params, function (err, data) {
    if (err) {
      console.log("케어존 수정 아마존 파일 삭제 에러 : " + req.body.prefilename + "err : " + err);
      res.status(500);
    }
    else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    Product.findOneAndUpdate({
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
      res.redirect('/product/');
    });
  });
}); //index 데이터row update



router.get("/producPreview/:id", function (req, res) {
  Product.findById(req.params.id)
    .populate(['author', 'comments.author'])
    .exec(function (err, post) {
      if (err) return res.json({
        success: false,
        message: err
      });

      var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
      // var prod_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.prodfilename;

      var product_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.productFileName;
      var jepumImage = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.productFileName;
      var nextDealImage = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.nextDealfilename;
      var detail_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.detailImageName;
      var announcement_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.announcementFileName;

      res.render("PlinicAdmin/Product/ProductData/ProductList/show", {
        post: post,
        url: url,
        // prod_url: prod_url,
        product_url: product_url,
        jepumImage: jepumImage,
        nextDealImage: nextDealImage,
        detail_url: detail_url,
        announcement_url: announcement_url,
        urlQuery: req._parsedUrl.query,
        user: req.user,
        search: createSearch(req.query)
      });
    });
}); // 상품 상세페이지 show

router.post("/", s3upload.fields([{ name: "productimage" }, {name: "jepumImage" }, 
// {name: "nextDealImage"}, 
{ name: "detailimage" }, { name: "announcement" }]),isLoggedIn, function(req, res, next) {
    async.waterfall(
      [
        function(callback) {
          ProductCounter.findOne(
            {
              name: "product"
            },
            function(err, counter) {
              if (err) callback(err);
              if (counter) {
                callback(null, counter);
              } else {
                ProductCounter.create(
                  {
                    name: "product",
                    totalCount: 0
                  },
                  function(err, counter) {
                    if (err)
                      return res.json({
                        success: false,
                        message: err
                      });
                    callback(null, counter);
                  }
                );
              }
            }
          );
        }
      ],
      function(callback, counter) {
        var newPost = req.body.post;
        newPost.author = req.user._id;
        newPost.numId = counter.totalCount + 1;
        req.body.post.product_num = Date.now();
        req.body.post.createdAt = Date.now();
        req.body.post.isPlinic = true;
        req.body.post.filename = req.files["productimage"][0].key;
        req.body.post.originaFileName = req.files["productimage"][0].originalname;
        req.body.post.productFileName = req.files["jepumImage"][0].key;
        req.body.post.productOriginalName = req.files["jepumImage"][0].originalname;
        // req.body.post.nextDealfilename = req.files["nextDealImage"][0].key;
        // req.body.post.nextDealOriginaFileName = req.files["nextDealImage"][0].originalname;
        req.body.post.detailImageName = req.files["detailimage"][0].key;
        req.body.post.detailImageOriginalName = req.files["detailimage"][0].originalname;
        req.body.post.announcementFileName = req.files["announcement"][0].key;
        req.body.post.announcementOriginalFileName = req.files["announcement"][0].originalname;
        Product.create(req.body.post, function(err, post) {
          if (err)
            return res.json({
              success: false,
              message: err
            });
          counter.totalCount++;
          counter.save();
          res.redirect('/product/');
          // res.render("PlinicAdmin/Product/ProductData/ProductRegister/index", {});
        });
      }
    );
  }
); // 상품 create

router.get('/ProductRegister/:id/edit', isLoggedIn, function (req, res) {
  Product.findById(req.params.id, function (err, post) {
    var url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.filename;
    var product_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.productFileName;
    var nextDeal_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.nextDealfilename;
    var detail_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.detailImageName;
    var announcement_url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/' + post.announcementFileName;

    var prefilename = post.filename; //이전 파일들은 삭제
    var preoriginaFileName = post.originaFileName; //이전 파일들은 삭제

    var preproductFileName = post.productFileName;
    var preproductOriginalName = post.productOriginalName;

    var prenextDealfilename = post.nextDealfilename;
    var prenextDealOriginaFileName = post.nextDealOriginaFileName;

    var predetailImageName = post.detailImageName;
    var predetailImageOriginalName = post.detailImageOriginalName;

    var preannouncementFileName = post.announcementFileName;
    var preannouncementOriginalFileName = post.announcementOriginalFileName;

    if (err) return res.json({
      success: false,
      message: err
    });
    res.render("PlinicAdmin/Product/ProductData/ProductRegister/edit", {
      post: post,
      prefilename: prefilename,
      preoriginaFileName : preoriginaFileName,
      preproductFileName : preproductFileName,
      preproductOriginalName : preproductOriginalName,
      prenextDealfilename : prenextDealfilename,
      prenextDealOriginaFileName : prenextDealOriginaFileName,
      predetailImageName : predetailImageName,
      predetailImageOriginalName : predetailImageOriginalName,
      preannouncementFileName : preannouncementFileName,
      preannouncementOriginalFileName: preannouncementOriginalFileName,
      
      //edit 페이지 이미지 불러오기
      url: url,
      product_url: product_url,
      nextDeal_url: nextDeal_url,
      detail_url: detail_url,
      announcement_url: announcement_url,
      user: req.user
    });
  });
}); // 상품 edit 페이지


router.put('/RegisterEdit/:id', s3upload.fields([{
  name: 'productimage'
}, {
  name: 'jepumImage'
}, {
  name: 'nextDealImage'
}, {
  name: 'detailimage'
}, {
  name: 'announcement'
}]), isLoggedIn, function (req, res, next) {
  req.body.post.updatedAt = Date.now();
  req.body.post.isPlinic = true;
  // req.body.post.filename = req.files['productimage'][0].key;
  // req.body.post.originaFileName = req.files['productimage'][0].originalname;
  // req.body.post.productFileName = req.files['jepumImage'][0].key;
  // req.body.post.productOriginalName = req.files['jepumImage'][0].originalname;
  // req.body.post.detailImageName = req.files['detailimage'][0].key;
  // req.body.post.detailImageOriginalName = req.files['detailimage'][0].originalname;
  // req.body.post.announcementFileName = req.files['announcement'][0].key;
  // req.body.post.announcementOriginalFileName = req.files['announcement'][0].originalname;

  if (req.files['productimage']) {
    req.body.post.filename = req.files['productimage'][0].key;
    req.body.post.originaFileName = req.files['productimage'][0].originalname;
  }
  if (req.files['jepumImage']) {
    req.body.post.productFileName = req.files['jepumImage'][0].key;
    req.body.post.productOriginalName = req.files['jepumImage'][0].originalname;
  }
  if (req.files['nextDealImage']) {
    req.body.post.nextDealfilename = req.files['nextDealImage'][0].key;
    req.body.post.nextDealOriginaFileName = req.files['nextDealImage'][0].originalname;
  }
  if (req.files['detailimage']) {
    req.body.post.detailImageName = req.files['detailimage'][0].key;
    req.body.post.detailImageOriginalName = req.files['detailimage'][0].originalname;
  }
  if (req.files['announcement']) {
    req.body.post.announcementFileName = req.files['announcement'][0].key;
    req.body.post.announcementOriginalFileName = req.files['announcement'][0].originalname;
  }

  var params = {
    Bucket: 'plinic',
    Delete: { // required
      Objects: [ // required
        {
          Key: req.body.prefilename // required
        },
        {
          Key: req.body.preproductFileName // required
        },
        {
          Key: req.body.prenextDealfilename // required
        },
        {
          Key: req.body.predetailImageName // required
        },
        {
          Key: req.body.preannouncementFileName // required
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
    Product.findOneAndUpdate({
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
      res.redirect('/product/');
    });
  });
}); // 상품 edit Update





router.delete('/del/:id', isLoggedIn, function(req, res, next) {
  Product.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    var params = {
      Bucket: 'plinic',
      Delete: { // required
      }
    };
    s3.deleteObjects(params, function(err, data){
      if(err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/product/');
  });
}); //상단 선택 삭제

router.delete('/rowdel/:id', isLoggedIn, function(req, res, next) {
  Product.findOneAndRemove({
    _id: req.params.id,
    // author: req.user._id
  }, function(err, post) {
    if (err) return res.json({
      success: false,
      message: err
    });
    var params = {
      Bucket: 'plinic',
      Delete: { // required
      }
    };
    s3.deleteObjects(params, function(err, data){
      if(err) {
        console.log("케어존 수정 아마존 파일 삭제 에러 : " + "err : " + err);
        res.status(500);
      }
      else console.log("케어존 수정 이전 파일 삭제 완료 : " + JSON.stringify(data));
    });
    res.redirect('/product/');
  });
}); //row 삭제

router.get("/getPlinicProduct", function (req, res, next) {
  async.waterfall([
    () => {
      Product.find(
        {
          outofStock: false, //비공개와 같은 기능으로 사용
          noPublic: false,
          isPlinic: true,
          tab: '투데이'
        }, 
        (err, docs) => {
          if (err) res.sendStatus(400);

          if (docs) res.status(201).json(docs);
        }
      );
    }
  ]);
});

router.get("/getPlinicProductCosmetic", function(req, res, next) {
  async.waterfall([
    () => {
      Product.find(
        {
          outofStock: false,
          noPublic: false,
          isPlinic: true,
          tab: '화장품'
        },
        (err, docs) => {
          if (err) res.sendStatus(400);

          if (docs) res.status(201).json(docs);
        }
      );
    }
  ]);
});

router.get("/getPlinicProductDevice", function(req, res, next) {
  async.waterfall([
    () => {
      Product.find(
        {
          outofStock: false,
          noPublic: false,
          isPlinic: true,
          tab: '기기'
        },
        (err, docs) => {
          if (err) res.sendStatus(400);

          if (docs) res.status(201).json(docs);
        }
      );
    }
  ]);
});

router.get("/getPlinicProductNextDeal", function(req, res, next) {
  async.waterfall([
    () => {
      Product.find(
        {
          outofStock: false,
          noPublic: false,
          isPlinic: true,
          nextDeal: true,
        },
        (err, docs) => {
          if (err) res.sendStatus(400);

          if (docs) res.status(201).json(docs);
        }
      );
    }
  ]);
}); //관리자 페이지 넥스트 딜 true plinic로


router.get("/like/:product_num/:email", function(req, res, next) {
  async.waterfall([
    function(callback) {
      Product.findOne(
        {
          product_num: req.params.product_num
        },
        (err, docs) => {
          if (err) {
            res.sendStatus(400);
          }

          if (docs) {
            docs.likeCount++;
            docs.save();
            callback(null, docs);
          } else {
            res.sendStatus(404);
          }
          
        }
      );
    },
    function(docs, callback) {
      var email = {
        email: req.params.email
      };
      Product.findOneAndUpdate(
        {
          product_num: docs.product_num
        },
        {
          $push: {
            likeUser: email
          }
        },
        (error, docs2) => {
          if (error) callback(error);
          
          if (docs2) callback(null, docs2);
        }
      );
    },
    function (docs2, callback) {
      Product.find({
        product_num: docs2.product_num
      }).lean().exec((err, docs3) => {
        if (err)
          return res.status(400).json({
          })
        if (docs3)
          res.send(JSON.parse(JSON.stringify(docs3)))
          // return res.end(JSON.stringify(docs3));
          // return res.status(200).json({ docs3 });
      })
    }
  ]);
});

router.get("/dislike/:product_num/:email", function(req, res, next) {
  async.waterfall([
    function(callback) {
      Product.findOne(
        {
          product_num: req.params.product_num
        },
        (err, docs) => {
          if (err) res.sendStatus(400);

          if (docs) docs.likeCount--;
          docs.save();
          callback(null, docs);
        }
      );
    },
    function(docs, callback) {
      var email = {
        email: req.params.email
      };
      Product.findOneAndUpdate(
        {
          product_num: docs.product_num
        },
        {
          $pull: {
            likeUser: email
          }
        },
        (error, docs2) => {
          if (error) callback(error);
          if (docs2) callback(null, docs2);
        }
      );
    },
    function (docs2, callback) {
      Product.find({
        product_num: docs2.product_num
      }).lean().exec((err, docs3) => {
        if (err)
          return res.status(400).json({
          })
        if (docs3)
          res.send(JSON.parse(JSON.stringify(docs3)))
          // return res.end(JSON.stringify(docs3));
          // return res.status(200).json({ docs3 });
      })
    }
  ]);
});

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
    if (searchTypes.indexOf("small_category") >= 0) {
      postQueries.push({
        small_category: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.small_category = queries.searchText;
    }
    if (searchTypes.indexOf("product_name") >= 0) {
      postQueries.push({
        product_name: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.product_name = queries.searchText;
    }
    if (searchTypes.indexOf("product_num") >= 0) {
      postQueries.push({
        product_num: {
          $regex: new RegExp(queries.searchText, "i")
        }
      });
      highlight.product_num = queries.searchText;
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