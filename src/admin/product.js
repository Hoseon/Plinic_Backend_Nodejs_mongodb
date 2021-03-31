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


// router.get("/ProductData/ProductList", function(req, res) {
//   return res.render("PlinicAdmin/Product/ProductData/ProductList/index", {});
// });
//상품데이터 상품관리 리스트 화면

router.get("/ProductData/ProductRegister", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRegister/index", {});
});
//상품데이터 상품관리 생성 화면

router.get("/ProductData/ProductRegister/edit", function(req, res) {
  return res.render("PlinicAdmin/Product/ProductData/ProductRegister/edit", {});
});
//상품데이터 상품관리 수정 화면

router.get('/Product/newIndex', function (req, res) {
  var vistorCounter = null;
  var page = Math.max(1, req.query.page) > 1 ? parseInt(req.query.page) : 1;
  var limit = Math.max(1, req.query.limit) > 1 ? parseInt(req.query.limit) : 7;
  var search = createSearch(req.query);
  async.waterfall([
    function (callback) {
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
    if (search.findUser && !search.findPost.$or) return callback(null, null, 0);
    Product.count(search.findPost, function (err, count) {
      if (err) callback(err);
      skip = (page - 1) * limit;
      maxPage = Math.ceil(count / limit);
      callback(null, skip, maxPage);
    });
  }, function (skip, maxPage, callback) {
    if (search.findUser && !search.findPost.$or) return callback(null, [], 0);
    Product.find(search.findPost).sort({ "seq": 1 }).populate("author").sort({ "seq": 1, "updatedAt": -1 }).skip(skip).limit(limit).exec(function (err, orders) {
      if (err) callback(err);
      callback(null, product, maxPage);
    });
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
      counter: vistorCounter,
      postsMessage: req.flash("postsMessage")[0]
    });
  });
}); // index





router.post("/", s3upload.fields([{ name: "productimage" }, {name: "jepumImage" }, { name: "detailimage" }, { name: "announcement" }]),isLoggedIn, function(req, res, next) {
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
        req.body.post.isPlinic = true;
        req.body.post.filename = req.files["productimage"][0].key;
        req.body.post.originaFileName = req.files["productimage"][0].originalname;
        req.body.post.productFileName = req.files["jepumImage"][0].key;
        req.body.post.productOriginalName = req.files["jepumImage"][0].originalname;
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
          res.render("PlinicAdmin/Product/ProductData/ProductRegister/index", {});
        });
      }
    );
  }
); // create

router.get("/getPlinicProduct", function(req, res, next) {
  async.waterfall([
    () => {
      Product.find(
        {
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
