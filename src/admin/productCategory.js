var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var async = require("async");
var User_admin = require("../models/User_admin");
var path = require("path");
var fs = require("fs");
var del = require("del");
var http = require("http");
var Category = require('../models/Category');


router.get("/ProductData/ProductCategory", function (req, res) {
  async.waterfall([function(callback) {
    Category.find(function(err, data){
      if(err) return res.status(400);

      if(data)
        return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
            {
              data: data,
              lastNumber: data.length + 1
            });
    })
  }])
});
//상품데이터 카테고리 화면

router.get("/", function (req, res) {
  return res.render("PlinicAdmin/bootstraptest/index", {});
});
// index

router.post("/", (req, res)=> {
  console.log(req.body.post);
  async.waterfall([()=>{
    let newCategory = Category(req.body.post);

    newCategory.save((err, result)=>{
      if(err)
        return res.status(400).json({
          "msg" : "업데이트 실패"
        })

      if(result)
        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
});

router.delete('/:id', isLoggedIn, function (req, res, next) {
  async.waterfall([()=>{
    Category.findOneAndRemove({
      _id : req.params.id
    },(err, result)=>{
      if(err)
        return res.status(400);

      if(result)

        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
}); //destroy

router.put('/:id', isLoggedIn, function (req, res, next) {
  console.log(req.body.post);
  async.waterfall([()=> {
    Category.findOneAndUpdate({
      _id : req.params.id
    },{
      $push: {
        smallCategory : req.body.post
      },
    },function(err, result){
      if(err)
        return res.status(400);

      if(result)
        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
})

router.put('/bigUpdate/:id', isLoggedIn, function (req, res, next) {
  console.log(req.body.post);
  async.waterfall([()=> {
    Category.findOneAndUpdate({
      _id : req.params.id
    }, req.body.post, function(err, result){
      if(err)
        return res.status(400);

      if(result)
        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
})

router.put('/smallUpdate/:id', isLoggedIn, function (req, res, next) {
  async.waterfall([()=> {
    Category.findOneAndUpdate({
      'smallCategory._id' : req.params.id
    },{
      $pull: {
        smallCategory: {
          _id: req.params.id
        }
      }
    },function(err, result){
      if(err)
        return res.status(400);

      if(result)
        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
})

router.put('/smallUpdateName/:id', isLoggedIn, function (req, res, next) {
  async.waterfall([()=> {
    Category.updateOne({
      'smallCategory._id' : req.params.id
    }, {
      $set: {
        "smallCategory.$" : req.body.post
      }
    }, function(err, result){
      if(err)
        return res.status(400);

      if(result)
        Category.find(function(err, data){
          if(err) return res.status(400);

          if(data)
            return res.render("PlinicAdmin/Product/ProductData/ProductCategory/index",
                {
                  data: data,
                  lastNumber: data.length + 1
                });
        })
    })
  }])
})

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
