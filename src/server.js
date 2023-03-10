const express = require('express');
const kakao_auth = require('./kakao_auth.js');
const naver_auth = require('./naver_auth.js');
var passport = require('passport');
var mongoose = require('mongoose');
const MongoClient = require("mongodb").MongoClient;
var config = require('./config/config');
var cors = require('cors');
var port = process.env.PORT || 8001;
var NaverStrategy = require('passport-naver').Strategy;
var KakaoStrategy = require('passport-kakao').Strategy;
var ejs = require('ejs');
var User = require('./models/user');
var Image = require('./models/image');
var FtpImage = require('./models/FtpImage');
var UserImage = require('./models/UserImage');
var Address = require('./models/Address');
var ADBanner = require('./models/ADBanner');
var Banner = require('./models/Banner');
var TopBanner = require('./models/TopBanner');
var Carezone = require('./models/Carezone');
var Beauty = require('./models/Beauty');
var CommuBeauty = require('./models/CommuBeauty');
var BeautyNote = require('./models/BeautyNote');
var Exhibition = require('./models/Exhibition');
var SkinQna = require('./models/SkinQna');
var SkinChart = require('./models/SkinChart');
var Notice = require('./models/Notice');
var Reward = require('./models/Reward');
var Chulsuk = require('./models/Chulsuk');
var Tags = require('./models/Tags');
var AppReview = require('./models/AppReview');
var Product = require('./models/Product');
var Test = require('./models/Test');
var SkinAnaly = require('./models/SkinAnaly');
var SkinReport = require('./models/SkinReport');
var ProductsReview = require('./models/ProductsReview');
var PointLog = require('./models/PointLog');
var Orders = require('./models/Orders');

const GoogleStrategy = require('passport-google-oauth20');
var jwt = require('jsonwebtoken');
var config = require('./config/config');
var userController = require('./controller/user-controller');
var multer = require('multer');
// var FTPStorage = require('multer-ftp');
var sftpStorage = require('multer-sftp');
let Client = require('ssh2-sftp-client');
// let sftp = new Client();
const url = require('url')
var path = require('path');
var dotenv = require('dotenv');
var fs = require('fs');
var del = require('del');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
const percentRank = require('percentile-rank');
var UserSkin = require('./models/UserSkin');
var Category = require('./models/Category');

var multerS3 = require('multer-s3');
const AWS = require("aws-sdk");
AWS.config.loadFromPath(__dirname + "/config/awsconfig.json");


var axios = require("axios");
var cheerio = require("cheerio");

const convert = require('xml-js');

let s3 = new AWS.S3();

var FormData = require('form-data');

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

let s3skinupload = multer({
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
      cb(null, "skin/" + file.fieldname + '-' + Date.now()+'.jpg')
    },
    acl: 'public-read'
  })
});






let UPLOAD_PATH = "./uploads/"
//let PORT = 3000;

// sftp.connect({
//   host: 'g1partners1.cafe24.com',
//   port: 3822,
//   username: 'g1partners1',
//   password: 'g100210!!'
// }).then(() => {
//   return sftp.list('/www/plinic');
// }).then(data => {
//   console.log(data, 'the data info');
// }).catch(err => {
//   console.log(err, 'catch error');
// });

const sftpconfig = {
  host: 'g1partners1.cafe24.com',
  port: 3822,
  user: 'g1partners1',
  password: 'g100210!!',
  keepalive: true
}

//multer ?????? ????????? rest api ?????? 20190425
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
    //cb(null, UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

let upload = multer({
  storage: storage
})

var sftpUpload = multer({
  storage: new sftpStorage({
    sftp: {
      host: 'g1partners1.cafe24.com',
      // secure: true, // enables FTPS/FTP with TLS
      port: 3822,
      user: 'g1partners1',
      password: 'g100210!!',
    },
    // basepath: '/www/plinic',
    destination: function (req, file, cb) {
      cb(null, '/www/plinic')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
});

module.exports = function (app) {
  var app = express();
  app.use(cors());
  //?????? ?????? ??????
  dotenv.config({ path: path.join(__dirname, '.env') })

  // get our request parameters
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json({
    limit: '100mb'
  }));
  app.use(bodyParser.urlencoded({
    limit: '100mb',
    parameterLimit: 1000000,
    extended: true
  }));
  app.use(cookieParser());
  app.use(methodOverride("_method"));
  app.use(flash());
  app.use(session({
    secret: 'MySecret'
  }));
  app.use(countVisitors);

  // Use the passport package in our application


  // app.use(passport.initialize());


  //????????????
  var passport = require('./config/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  var passportMiddleware = require('./middleware/passport');
  passport.use(passportMiddleware);


  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  //???????????? ?????? ?????? ??????
  app.get('/gethashtags', function (req, res) {
    Tags.find(function (err, docs) {
      if (err) {
        res.sendStatus(400);
      }
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      res.json(docs);
    });
  });



  //????????? ????????? ?????? ??????
  //????????? ?????????
  app.post('/images', upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newImage = new Image();
    newImage.filename = req.file.filename;
    newImage.originalName = req.file.originalname;
    newImage.desc = req.body.desc
    newImage.save(err => {
      if (err) {
        return res.sendStatus(402);
      }
      res.status(201).send({
        newImage
      });
    });
  });

  //?????? ?????? ????????? ?????????
  app.post('/beautynoteimages', s3upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new BeautyNote();
    newUser.filename = req.file.key;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.desc
    newUser.save(err => {
      if (err) {
        console.log("Image Error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  //????????? ????????? ?????????
  app.post('/userimages', s3upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new UserImage();
    newUser.filename = req.file.key;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.desc
    newUser.save(err => {
      if (err) {
        console.log("Image Error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  //????????? ????????? ??????
  app.post('/userupdateimages', s3upload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newUser = new UserImage();
    newUser.isNew = false; // ????????? ????????? ????????? ???????????? ????????? Update , ?????? ????????? ?????????????????? new??? ??????.
    newUser.filename = req.file.key;
    newUser.originalName = req.file.originalname;
    newUser.email = req.body.email;
    newUser._id = req.body.id;
    newUser.save(err => {
      if (err) {
        console.log("error : " + err);
        return res.sendStatus(402);
      }
      res.status(201).send({
        newUser
      });
    });
  });

  // Get all uploaded images
  app.get('/userimages', (req, res, next) => {
    // use lean() to get a plain JS object
    // remove the version key from the response
    UserImage.find({}, '-__v').lean().exec((err, images) => {
      if (err) {
        res.sendStatus(400);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = req.protocol + '://' + req.get('host') + '/images/' + img._id;
      }
      res.json(images);
    })
  });


  // Get one image by its ID
  app.get('/userimages/:id', (req, res, next) => {

    UserImage.findOne({
      email: req.params.id
    }, function (err, image) {
      if (err) {
        res.sendStatus(404);
      }
      if (!image) {
        res.sendStatus(404);
      }
      if (image) {
        res.json(image);
        // res.setHeader('Content-Type', 'image/jpeg');
        // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      }
      //res.json(docs);
    });

    // let imgId = req.params.id;
    // UserImage.findone(imgId, (err, image) => {
    //   if (err) {
    //     res.sendStatus(400);
    //   }
    //   // stream the image back by loading the file
    // res.setHeader('Content-Type', 'image/jpeg');
    // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    // })
  });

  // Get one image by its ID
  app.get('/userimagesdown/:id', (req, res, next) => {

    UserImage.findOne({
      email: req.params.id
    }, function (err, image) {
      if (err) {
        res.sendStatus(404);
      }
      if (!image) {
        res.sendStatus(404);
      }
      if (image) {
        // res.json(image);
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      }
      //res.json(docs);
    });

    // let imgId = req.params.id;
    // UserImage.findone(imgId, (err, image) => {
    //   if (err) {
    //     res.sendStatus(400);
    //   }
    //   // stream the image back by loading the file
    // res.setHeader('Content-Type', 'image/jpeg');
    // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    // })
  });


  app.get('/userupdateimages/:id', (req, res, next) => {

    UserImage.findOne({
      email: req.params.id
    }, function (err, image) {
      if (err) {
        res.sendStatus(404);
      }
      res.json(image);
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      //res.json(docs);
    });

    // let imgId = req.params.id;
    // UserImage.findone(imgId, (err, image) => {
    //   if (err) {
    //     res.sendStatus(400);
    //   }
    //   // stream the image back by loading the file
    // res.setHeader('Content-Type', 'image/jpeg');
    // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    // })
  });



  // Get all uploaded images
  app.get('/images', (req, res, next) => {
    // use lean() to get a plain JS object
    // remove the version key from the response
    Image.find({}, '-__v').lean().exec((err, images) => {
      if (err) {
        res.sendStatus(404);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = req.protocol + '://' + req.get('host') + '/images/' + img._id;
      }
      res.json(images);
    })
  });


  // Get one image by its ID
  app.get('/images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Banner.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });


  app.get('/prod_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });

  app.get('/beauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/commubeauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    CommuBeauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      if (image.filename) {
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      } else {
        res.sendStatus(200);
      }
    })
  });

  app.get('/beautynote_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    BeautyNote.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/skinqna_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    SkinQna.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/carezone_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });



  app.get('/notice_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Notice.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/notice_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Notice.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });


  //????????? ????????? ????????? ??????
  app.get('/test_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Test.findById(imgId, (err, image) => {
      if (err) {
       res.sendStatus(404);
      }
      // stream the image back by loading the file
     res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
   })
  });

  app.get('/test_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Test.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
     fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
   })
  });







  // Get one image by its ID
  // app.get('/carezone_images/:id', (req, res, next) => {
  //   let imgId = req.params.id;
  //
  //   Carezone.findById(imgId, (err, image) => {
  //     if (err) {
  //       res.sendStatus(400);
  //     }
  //     // stream the image back by loading the file
  //     res.setHeader('Content-Type', 'image/jpeg');
  //     fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
  //   })
  // });

  app.get('/carezone_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });

  app.get('/challenge_image1/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.challenge_image1_filename)).pipe(res);
    })
  });

  app.get('/challenge_image2/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.challenge_image2_filename)).pipe(res);
    })
  });

  app.get('/challenge_image3/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.challenge_image3_filename)).pipe(res);
    })
  });

  app.get('/challenge_image4/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.challenge_image4_filename)).pipe(res);
    })
  });

  app.get('/challenge_image5/:id', (req, res, next) => {
    let imgId = req.params.id;

    Carezone.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.challenge_image5_filename)).pipe(res);
    })
  });

  // Get one image by its ID
  app.get('/beauty_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
    })
  });

  app.get('/beauty_prodimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    Beauty.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(path.join(__dirname, '../uploads/', image.prodfilename)).pipe(res);
    })
  });


  // Delete one image by its ID
  app.delete('/images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Image.findByIdAndRemove(imgId, (err, image) => {
      if (err && image) {
        res.sendStatus(404);
      }

      del([path.join(__dirname, '../uploads/', image.filename)]).then(deleted => {
        res.sendStatus(200);
      })

      del([path.join('', '')])
    })
  });

  app.get('/userskinscore/:id', (req, res, next) => {

    SkinChart.findOne({
      email: req.params.id
    }, function (err, score) {
      if (err) {
        res.sendStatus(400);
      }
      // res.setHeader('Content-Type', 'image/jpeg');
      // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      res.json(score);
    });
  });

  app.get('/userskinchart/:id/:month', (req, res, next) => {
    console.log(req.params.id);
    console.log(req.params.month);

    var start = new Date('2019-07-02');
    var end = new Date('2019-07-05');
    // var month = new Date(req.params.month);
    // console.log(month)
    SkinChart.find({
        email: req.params.id
      },
      // {saveDate : { $gte: '2019-07', $lte: '20' }},
      {
        score: {
          $elemMatch: {
            saveDate: {
              $gte: new Date('2019-07-10T00:00:00.000+00:00')
            }
          }
        }
      },
      // { students: { $elemMatch: { school: 102, age: { $gt: 10} } } } )
      // {'score.saveDate' : { $lte: new Date('2019-07-01') } },
      function (err, score) {
        if (err) {
          console.log(err), res.sendStatus(400);
        }
        // res.setHeader('Content-Type', 'image/jpeg');
        // fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
        res.json(score);
      });
  });

  app.get('/beautynoteimage/:id', (req, res, next) => {
    let imgId = req.params.id;

    BeautyNote.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }

      if (image.filename) {
        // stream the image back by loading the file
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      } else {
        res.sendStatus(200);
      }
    })
  });

  app.get('/skinqnaimage/:id', (req, res, next) => {
    let imgId = req.params.id;

    SkinQna.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      if (image.filename) {
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      } else {
        res.sendStatus(200);
      }
    })
  });

  app.get('/exhibition_images/:id', (req, res, next) => {
    let imgId = req.params.id;

    Exhibition.findById(imgId, (err, image) => {
      if (err) {
        res.sendStatus(404);
      }
      // stream the image back by loading the file
      if (image.filename) {
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(path.join(__dirname, '../uploads/', image.filename)).pipe(res);
      } else {
        res.sendStatus(200);
      }
    })
  });

  app.get('/userpush/:email', function(req, res) {
    User.findOne({
      email : req.params.email
    }, (err, user) => {
      if(err) {
        res.status(400).json({'msg':'????????? ????????? ?????? ??? ????????????'})
      }

      if(user) {
        res.status(201).json(
          user.ispush
        )
      } else  {
        res.status(400).json({'msg':'????????? ????????? ?????? ??? ????????????'})
      }
    })
  });


  // Demo Route (GET http://localhost:8001)
  app.get('/', function (req, res) {
    return res.send('Hello! The API is at http://localhost:' + port + '/api');
  });



  var routes = require('./routes');
  app.use('/api', routes);

  app.set('view engine', 'ejs');
  // app.set('views', './src/views')
  //cafe24?????? ejs ?????? ?????????????????? ???????????? ????????????
  app.set('views', __dirname + '/views');


  //????????? ????????? ????????? ????????? ?????? 20190430 ?????????
  app.use('/home', require('./home'));
  app.use('/users', require('./users'));
  app.use('/posts', require('./posts'));
  app.use('/menus', require('./menus'));
  app.use('/banner', require('./banner'));
  app.use('/topbanner', require('./topbanner'));
  app.use('/carezone', require('./carezone'));
  app.use('/beauty', require('./beauty'));
  app.use('/notice', require('./notice'));
  app.use('/qna', require('./qna'));
  app.use('/faq', require('./faq'));
  app.use('/commubeauty', require('./commubeauty'));
  app.use('/beautyMovie', require('./beautyMovie'));
  app.use('/beautynote', require('./beautynote'));
  app.use('/skinqna', require('./skinqna'));
  app.use('/exhibition', require('./exhibition'));
  app.use('/reward', require('./reward'));
  // app.use('/product', require('./product'));
  app.use('/test', require('./test'));
  app.use('/bootstraptest', require('./bootstraptest'));

  //????????? ??? ????????? 2020-12-23
  app.use('/contents', require('./admin/contents'));

  //????????? ?????? 2021-01-20
  app.use('/beautyTip', require('./admin/beautyTip'));
  app.use('/postDisplay', require('./admin/postDisplay'));


  //?????? ???????????? 2020-04-01
  app.use('/product', require('./admin/product'));

  //// ???????????????

  //????????? ?????? ??????
  app.use('/challengeSuccess', require('./admin/challengeSuccess'));
  //????????? ?????? ??????
  app.use('/movies', require('./admin/movies'));
  //????????? ???????????? ??????
  app.use('/movieDisplay', require('./admin/movieDisplay'));
  //????????? ?????? ??????
  app.use('/challengeComments', require('./admin/challengeComments'));
  //?????? ?????? ??????
  app.use('/movieComments', require('./admin/movieComments'));
  //???????????? ?????? ??????
  app.use('/skinqnaComments', require('./admin/skinqnaComments'));
  //???????????? ?????? ??????
  app.use('/noticeComments', require('./admin/noticeComments'));
  //FAQ ?????? ??????
  app.use('/faqComments', require('./admin/faqComments'));
  //???????????? ?????? ??????
  app.use('/answerComments', require('./admin/answerComments'));
  //??? ?????? ??????
  app.use('/homePopups', require('./admin/homePopups'));
  //?????? ?????? ??????
  app.use('/adBanners', require('./admin/adBanners'));

  //// ????????????

  //????????? ?????????(???) ??????
  app.use('/paymentWebs', require('./admin/paymentWebs'));
  //????????? ????????????(???) ??????
  app.use('/paymentApps', require('./admin/paymentApps'));
  //?????? ???????????? ??????
  app.use('/productCategory', require('./admin/productCategory'));
  //?????? ??? ?????? ??????
  app.use('/productTabShow', require('./admin/productTabShow'));
  //?????? ?????? ???????????? ??????
  app.use('/productRecomShow', require('./admin/productRecomShow'));
  //????????? ?????? ??????
  app.use('/productTransCost', require('./admin/productTransCost'));
  //???????????? ??????
  app.use('/productQnA', require('./admin/productQnA'));
  
  // ????????????
  app.use('/orders', require('./admin/orders'));
  // ??????????????????
  app.use('/members', require('./admin/members'));
  // ?????? ??????
  app.use('/alarm', require('./admin/alarm'));
  // ??????/?????? ??????
  app.use('/alarmSetting', require('./admin/alarmSetting'));
  // ?????? ??????
  app.use('/groups', require('./admin/groups'));
  // ????????? ??????
  app.use('/pointSetting', require('./admin/pointSetting'));
  // ????????? ???????????? ??????
  app.use('/challengeOngoing', require('./admin/challengeOngoing'));

  app.get('/ejs', (req, res) => {
    res.render('home');
  })

  app.get('/google', passport.authenticate('google', {
    scope: ['profile']
  }));

  function createToken(user) {
    return jwt.sign({
      id: user.id,
      email: user.email
    }, config.jwtSecret, {
      expiresIn: 86400 // 86400 expires in 24 hours
      //expiresIn: 200 // 86400 expires in 24 hours
    });
  }

  passport.use(new KakaoStrategy({
      clientID: '3fad3ed55ef1830fd6d1c10faf0d9072',
      clientSecret: '13NCCqRqTNBCcrN8vVNuyupWrH3kv6qM', // clientSecret??? ???????????? ???????????? ????????? ????????? ??? ???????????? ?????? ???
      callbackURL: '/auth/login/kakao/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({
        'kakao.id': profile.id
      }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.nickname,
            email: profile.id,
            username: profile.nickname,
            provider: 'kakao',
            naver: profile._json
          });
          user.save(function (err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));

  app.get('/auth/kakao', passport.authenticate('kakao', {
    failureRedirect: '#!/login'
  }));

  app.get('/api/auth/login/kakao/callback', passport.authenticate('kakao', {
    successRedirect: '/api',
    failureRedirect: '#!/login'
  }));


  passport.use(new NaverStrategy({
      clientID: 'cIUVxjnNe7iTuqbTQZvu',
      clientSecret: 'joXW3wHq8s',
      callbackURL: '/auth/login/naver/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({
        'naver.id': profile.id
      }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.displayName,
            provider: 'naver',
            naver: profile._json
          });
          user.save(function (err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));

  app.route('/auth/naver')
    .get(passport.authenticate('naver', {
      failureRedirect: '#!/auth/login'
    }));


  app.route('/auth/login/naver/callback')
    .get(passport.authenticate('naver', {
      successRedirect: '/api',
      failureRedirect: '#!/auth/login'
    }));



  passport.use(new GoogleStrategy({
      callbackURL: '/auth/google/callback',
      clientID: '182510992437-ri45f5fdo8be7h193uvfohcugf9jh5fl.apps.googleusercontent.com',
      clientSecret: 'RsAmattHXCaNXID1JlnluzJi'
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({
        'google.id': profile.id
      }, function (err, user) {
        if (!user) {
          user = new User({
            googleId: profile.googleId,
            username: profile.displayName,
            provider: 'google',
            naver: profile._json
          });
          user.save(function (err) {
            if (err) console.log('mongoDB error : ' + err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));


  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
  }));


  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/api',
    failureRedirect: '#!/login'
  }));

  app.post('/ftpimages', sftpUpload.single('image'), (req, res, next) => {
    // Create a new image model and fill the properties
    let newImage = new FtpImage();
    newImage.filename = req.file.filename;
    newImage.originalName = req.file.originalname;
    newImage.desc = req.body.desc
    newImage.save(err => {
      if (err) {
        return res.sendStatus(402);
      }
      res.status(201).send({
        newImage
      });
    });
  });


  // Get all uploaded images
  app.get('/ftpimages', (req, res, next) => {
    // use lean() to get a plain JS object
    // remove the version key from the response
    FtpImage.find({}, '-__v').lean().exec((err, images) => {
      if (err) {
        res.sendStatus(404);
      }

      // Manually set the correct URL to each image
      for (let i = 0; i < images.length; i++) {
        var img = images[i];
        img.url = 'http://g1partners1.cafe24.com/plinic/' + img.filename;
      }
      res.json(images);
    })
  });

  // Delete one image by its ID
  app.delete('/ftpimages/:id', (req, res, next) => {
    let imgId = req.params.id;

    FtpImage.findByIdAndRemove(imgId, (err, image) => {
      if (err && image) {
        res.sendStatus(400);
      }
      let client = new Client();
      let remotefile = '/www/plinic/'
      remotefile = remotefile.concat(image.filename);
      client.connect(sftpconfig).then(() => {
          return client.delete(remotefile);
        })
        .then(() => {
          res.sendStatus(200);
          return client.end();
        }).catch(err => {
          console.error(err.message);
          res.sendStatus(400);
        });
    });
  });



  app.get('/totalusetime/:id', function (req, res, next) {
    User.findOne({
        email: req.params.id
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          res.json(docs['totalusetime']);
        }
      });
  });

  app.get('/scrab', function (req, res, next) {
    console.log("??? ????????? ??????");

    function getHtml() {
      try {
        return axios.get("http://www.beautynury.com/news/lists/cat/10/k/200");
      } catch (error) {
        console.error(error);
      }
    };

    function getHtml2() {
      try {
        return axios.get("http://www.beautynury.com/news/lists/cat/10/k/200/page/15");
      } catch (error) {
        console.error(error);
      }
    };

    axios.all([getHtml(), getHtml2()]).then(axios.spread((get1, get2) => {

      let ulList = [];
      const $ = cheerio.load(get1.data += get2.data);
      const $bodyList = $("div.sub_news_list ul.main_article").children("li");

      $bodyList.each(function (i, elem) {
        // console.log(i);
        ulList[i] = {
          title: $(this).find('a h2').text(),
          sub_title: $(this).find('a h3').text(),
          desc: $(this).find('a div.description').text(),
          // url: $(this).find('strong.news-tl a').attr('href'),
          image_url: $(this).find('div.thumbnail img').attr('src'),
          image_alt: $(this).find('p.poto a img').attr('alt'),
          // summary: $(this).find('p.lead').text().slice(0, -11),
          date: $(this).find('div.rep_info').text()
        };
      });

      const data = ulList.filter(n => n.title);
      // console.log(data);
      res.json(data);
      return data;

      // var reulst = Object.assign(get1.data, get2.data);
      // console.log(reulst);
      // console.log(get1.data);
      // console.log(get2.data);
      // res.sendStatus(200);
    }))
  });

  app.get('/multiGet', async function (req, res, next) {
    var result;
    for (let i = 1; i <= 10; i++) {
      var request = require('request');
      console.log("???????");
      await request({
        url: 'http://localhost:8001/getCsmtcs/' + i,
        method: 'GET'
      }, function (error, response, body) {
        result += body;
        if (i = 10) {
          res.send(result);
        }
      })
    }
  })

  app.get('/getCsmtcs/:pageNo', function (req, res, next) {
    console.log(req.params.pageNo);
    var page = req.params.pageNo;
    var request = require('request');

    var url = 'http://apis.data.go.kr/1470000/CsmtcsMfcrtrInfoService/getCsmtcsMfcrtrInfoList';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=T5dLT4fW1bs5ht%2BVj9O4RRT6jXNlhj9nm1zTtpmee3RmA42ubtUTAHK4ZgnbHfCZwAHIU3YSiO9u1c2jPnb5fQ%3D%3D'; /* Service Key*/
    // queryParams += '&' + encodeURIComponent('entp_name') + '=' + encodeURIComponent('(???)??????????????????'); /* ????????? */
    // queryParams += '&' + encodeURIComponent('entp_permit_date') + '=' + encodeURIComponent('20120302'); /* ???????????? */
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(page); /* ??????????????? */
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* ??? ????????? ?????? ??? */

    request({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {
      //console.log('Status', response.statusCode);
      //console.log('Headers', JSON.stringify(response.headers));
      //console.log('Reponse received', body);
      res.send(body);
    });
  });

  app.get('/getItem22', function (req, res, next) {

    console.log("??? ????????? 11");
    var request = require('request');
    var fs = require('fs')

    var url = 'http://apis.data.go.kr/1471057/FcssJdgmnPrdlstInforService/getEvaluationItemList';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=xuUpbB%2BmtX%2Fjia%2BmBNs%2BgkoI%2Bv2PMiT%2BL%2BDKhYC1KPJvue9SKKA%2BJSeFdTs69jERJODPLcZFqb4OG4ktBBbnTw%3D%3D'; /* Service Key*/
    // queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* ????????? ?????? */
    // queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* ??? ????????? ?????? ??? */

    request({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {
      console.log('Status', response.statusCode);
      console.log('Headers', JSON.stringify(response.headers));
      console.log('Reponse received', body);
      res.json({
        Status: response.statusCode,
        Headers: JSON.stringify(response.headers),
        body: body
      })
    }).pipe(fs.WriteStream('notimeout.xml'))

  });

  app.get('/getItem11', function (req, res, next) {

    var request = require('request');

    var url = 'http://apis.data.go.kr/1471057/FcssJdgmnPrdlstInforService/getEvaluationItemList';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=xuUpbB%2BmtX%2Fjia%2BmBNs%2BgkoI%2Bv2PMiT%2BL%2BDKhYC1KPJvue9SKKA%2BJSeFdTs69jERJODPLcZFqb4OG4ktBBbnTw%3D%3D'; /* Service Key*/
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* ????????? ?????? */
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* ??? ????????? ?????? ??? */

    request({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {
      console.log('Status', response.statusCode);
      console.log('Headers', JSON.stringify(response.headers));
      console.log('Reponse received', body);
      res.json({
        Status: response.statusCode,
        Headers: JSON.stringify(response.headers),
        body: body
      })
    });
  });

  //????????????(??????) ????????? ????????? S3 2020-04-16
  app.post('/eyeskin', s3skinupload.single('eyeimage'), (req, res, next) => {
    // console.log(JSON.stringify(req.body));
    // console.log(JSON.stringify(req.file));
    if (!req.body || !req.file) {
      return res.status(400).json({
        'msg': '?????? ????????? ???????????? ???????????????.'
      });
    }

    UserSkin.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) {
        res.sendStatus(404);
      }
      if (!user) { //????????? ????????? ?????? ?????? ????????? ???????????? ?????? ?????? ???
        let newUserSkin = new UserSkin();
        newUserSkin.filename = req.file.key;
        newUserSkin.originalName = req.file.originalname;
        newUserSkin.email = req.body.email;
        newUserSkin.gender = req.body.gender;
        newUserSkin.skincomplaint = req.body.skincomplaint;
        newUserSkin.nickname = req.body.nickname;
        newUserSkin.birthday = req.body.birthday;
        newUserSkin.age = req.body.age;
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'eye',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        newUserSkin.userskinimage = userImage;
        newUserSkin.save((err, result) => {
          if (err) {
            return res.status(400).json({
              'msg': '????????? ???????????????.'
            });
          }
          if (result) {
            res.status(201).send({
              ok: "ok ?????? ?????? ?????? ??????" // newUser
            });
          }
        });
      }
      if (user) { //????????? ????????? ?????? ?????? ????????? push ?????? ???
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'eye',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        UserSkin.update({
          email: req.body.email
        }, {
          $push: {
            userskinimage: userImage
          },
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            return res.status(201).json({
              'msg': '????????? ?????? ???????????? ???????????? ???'
            });
          }
        });
      }
    });
  });


  //????????????(??????) ????????? ????????? S3 2020-04-16
  app.post('/hairskin', s3skinupload.single('hairimage'), (req, res, next) => {
    // console.log(JSON.stringify(req.body));
    // console.log(JSON.stringify(req.file));
    if (!req.body || !req.file) {
      return res.status(400).json({
        'msg': '?????? ????????? ???????????? ???????????????.'
      });
    }

    UserSkin.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) {
        res.sendStatus(404);
      }
      if (!user) { //????????? ????????? ?????? ?????? ????????? ???????????? ?????? ?????? ???
        let newUserSkin = new UserSkin();
        newUserSkin.filename = req.file.key;
        newUserSkin.originalName = req.file.originalname;
        newUserSkin.email = req.body.email;
        newUserSkin.gender = req.body.gender;
        newUserSkin.skincomplaint = req.body.skincomplaint;
        newUserSkin.nickname = req.body.nickname;
        newUserSkin.birthday = req.body.birthday;
        newUserSkin.age = req.body.age;
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'hair',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        newUserSkin.userskinimage = userImage;
        newUserSkin.save((err, result) => {
          if (err) {
            return res.status(400).json({
              'msg': '????????? ???????????????.'
            });
          }
          if (result) {
            res.status(201).send({
              ok: "ok ?????? ?????? ?????? ??????" // newUser
            });
          }
        });
      }
      if (user) { //????????? ????????? ?????? ?????? ????????? push ?????? ???
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'hair',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        UserSkin.update({
          email: req.body.email
        }, {
          $push: {
            userskinimage: userImage
          },
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            return res.status(201).json({
              'msg': '????????? ?????? ???????????? ???????????? ???'
            });
          }
        });
      }
    });
  });



  //????????????(??????) ????????? ????????? S3
  app.post('/foreheadskin', s3skinupload.single('foreheadimage'), (req, res, next) => {
    // console.log(JSON.stringify(req.body));
    // console.log(JSON.stringify(req.file));
    if (!req.body || !req.file) {
      return res.status(400).json({
        'msg': '?????? ????????? ???????????? ???????????????.'
      });
    }

    UserSkin.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) {
        res.sendStatus(404);
      }
      if (!user) { //????????? ????????? ?????? ?????? ????????? ???????????? ?????? ?????? ???
        let newUserSkin = new UserSkin();
        newUserSkin.filename = req.file.key;
        newUserSkin.originalName = req.file.originalname;
        newUserSkin.email = req.body.email;
        newUserSkin.gender = req.body.gender;
        newUserSkin.skincomplaint = req.body.skincomplaint;
        newUserSkin.nickname = req.body.nickname;
        newUserSkin.birthday = req.body.birthday;
        newUserSkin.age = req.body.age;
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'forehead',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        newUserSkin.userskinimage = userImage;
        newUserSkin.save((err, result) => {
          if (err) {
            return res.status(400).json({
              'msg': '????????? ???????????????.'
            });
          }
          if (result) {
            res.status(201).send({
              ok: "ok ?????? ?????? ?????? ??????" // newUser
            });
          }
        });
      }
      if (user) { //????????? ????????? ?????? ?????? ????????? push ?????? ???
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'forehead',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        UserSkin.update({
          email: req.body.email
        }, {
          $push: {
            userskinimage: userImage
          },
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            return res.status(201).json({
              'msg': '????????? ?????? ???????????? ???????????? ???'
            });
          }
        });
      }
    });
  });

  //????????????(???) ????????? ????????? S3
  app.post('/cheekskin', s3skinupload.single('cheekimage'), (req, res, next) => {
    // console.log(JSON.stringify(req.body));
    // console.log(JSON.stringify(req.file));
    if (!req.body || !req.file) {
      return res.status(400).json({
        'msg': '?????? ????????? ???????????? ???????????????.'
      });
    }

    UserSkin.findOne({
      email: req.body.email
    }, function (err, user) {
      if (err) {
        res.sendStatus(404);
      }
      if (!user) { //????????? ????????? ?????? ?????? ????????? ???????????? ?????? ?????? ???
        let newUserSkin = new UserSkin();
        newUserSkin.filename = req.file.key;
        newUserSkin.originalName = req.file.originalname;
        newUserSkin.email = req.body.email;
        newUserSkin.gender = req.body.gender;
        newUserSkin.skincomplaint = req.body.skincomplaint;
        newUserSkin.nickname = req.body.nickname;
        newUserSkin.birthday = req.body.birthday;
        newUserSkin.age = req.body.age;
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'cheek',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        newUserSkin.userskinimage = userImage;
        newUserSkin.save((err, result) => {
          if (err) {
            return res.status(400).json({
              'msg': '????????? ???????????????.'
            });
          }
          if (result) {
            res.status(201).send({
              ok: "ok ??? ?????? ?????? ??????" // newUser
            });
          }
        });
      }
      if (user) { //????????? ????????? ?????? ?????? ????????? push ?????? ???
        let userImage = {
          gnder: req.body.gender,
          skintype: req.body.skincomplaint,
          age: req.body.age,
          skinregion: 'cheek',
          filename: req.file.key,
          originalName: req.file.originalname
        }
        UserSkin.update({
          email: req.body.email
        }, {
          $push: {
            userskinimage: userImage
          },
        }, function(err, post2) {
          if (err) {
            // console.log("tags error : " + err);
            return res.status(400).json(err);
          } else {
            return res.status(201).json({
              'msg': '????????? ??? ???????????? ???????????? ???'
            });
          }
        });
      }
    });
  });


  //????????????(???) ????????? ????????? S3
  app.post('/cameratest', s3skinupload.array("test", 12), (req, res, next) => {
      // console.log(JSON.stringify(req.body));
      console.log(JSON.stringify(req.files));
      if (!req.body || !req.file) {
        return res.status(400).json({
          'msg': '?????? ????????? ???????????? ???????????????.'
        });
      }
    });

  //???????????? ????????? ?????? ?????? 2020-02-14
  app.get('/loadchulsuk/:email', function (req, res, next) {
    Chulsuk.findOne({
        email: req.params.email
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else if(!docs){
          res.json('');
        } else {
          res.json(docs['chulcheck']);
        }
      });
  });

  //????????? ????????? ?????? ?????? ?????? 2020-02-18
  app.get('/reloadUserPoint/:email', function (req, res, next) {
    User.findOne({
        email: req.params.email
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          res.json(docs.totaluserpoint);
        }
      });
  });

  //??? ?????? ???, ???????????? ?????? ????????? ????????? ????????? ??????. 2020-03-18
  app.get('/appreview/', function (req, res, next) {
    AppReview.findOne({
        target: 'ios'
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          // console.log(JSON.stringify(docs));
          res.json(docs);
        }
      });
  });

  //??? ?????? ???, ???????????? ?????? ????????? ????????? ????????? ??????. 2020-03-18
  app.get('/appversion/', function (req, res, next) {
    AppReview.findOne({
        target: 'ios'
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          // console.log(JSON.stringify(docs));
          res.json(docs);
        }
      });
  });

  //2020-11-06 ?????? ?????? ??? ?????? ????????? ???????????? ????????? ????????????
  app.get('/checkskinreport/:email', function (req, res, next) {
    SkinReport.findOne({
        email: req.params.email
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          res.json(docs);
        }
      });
  });

  app.get('/Point/getPlinicPoint/', async function(req, res, next) {
    var request1 = require('request');
    var url = 'http://plinicshop.com:50082/Point/getPointList'
    await request1({
      url: url,
      method: 'GET'
    }, function (error, response, body) {
      if(error) {
        return res.status(400).send({
          'msg': '???????????? ????????? ?????? ??????'
        });
      }
      if(body) {
        res.send(JSON.parse(body));
      }
    })
  })


  //2021-03-11 ????????????????????? ?????? DB?????? ????????????
  app.get('/Point/getUserPlinicPointLog/:email', async function(req, res, next) {
    if (!req.params.email) {
      console.log("???????????? ???????????? ?????? ?????? ??????(getUserPlinicPointLog)");
      return res.status(400).send({
        'msg': '????????? ????????? ???????????? ?????? ???????????? ????????? ????????????'
      });
    }

    PointLog.findOne({
      email: req.params.email
    }, (err, data) => {
        if (err) {
          console.log("????????? ????????? ????????? ???????????? ??????(getUserPlinicPointLog) : " + req.params.email);
          res.status(400).json(err);
        }

        if (data) {
          res.status(200).json(data);
        } else {
          console.log("???????????? ???????????? ???????????? ??????222 : " + req.params.email);
          res.status(400).json();
        }
    })
  })

  app.get('/Point/getUserPlinicPoint/:email', async function(req, res, next) {
    if(!req.params.email) {
      return res.status(400).send({
        'msg': '????????? ????????? ???????????? ?????? ???????????? ????????? ????????????'
      });
    }
    var email = req.params.email
    var request10 = require('request');
    var url = 'http://plinicshop.com:50082/Point/getUserPoint?id=' + email
    await request10({
      url: url,
      method: 'GET'
    }, function (error, response, body) {
      if(error) {
        return res.status(400).send({
          'msg': '???????????? ????????? ?????? ????????? ?????? ??????'
        });
      }
        if (body) {
          res.status(200).json(0);
        // ?????? ????????? ?????? ?????? ????????? ????????? ???????????? 2021-04-06
        // res.send(JSON.parse(body));
      }
    })
  })

  app.get('/Point/getUserOrder/:email/:dateTime', async function (req, res, next) {
    if (!req.params.email) {
      return res.status(400).send({
        'msg': '????????? ????????? ???????????? ?????? ???????????? ????????? ????????????'
      });
    }
    // var email = req.params.email
    var dateTime = req.params.dateTime

    if (dateTime == 'All') {
      Orders.find({
        email : req.params.email
      }, (err, result) => {
          if (err) {
            console.log("????????? ?????? ?????? ?????? ?????? : " + req.params.email);
            res.status(400).json(err);
          }
    
          if (result) {
            res.status(200).json(result);
          } else {
            console.log("????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
            res.status(400).json(err);
          }
      })
      
    } else if (dateTime == 'Weekly') {
      var today = new Date();
      var preToday = new Date();
      var preToday = preToday.setDate(preToday.getDate() - 8);

      Orders.find({
        email: req.params.email,
        started_at: {
          $gte: preToday,
          $lte: today,
        }
      }, (err, result) => {
          if (err) {
            console.log("????????? ?????? ?????? ?????? ?????? : " + req.params.email);
            res.status(400).json(err);
          }
    
          if (result) {
            res.status(200).json(result);
          } else {
            console.log("????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
            res.status(400).json(err);
          }
      })

    } else if (dateTime == 'Monthy') {
      var today = new Date();
      var preToday = new Date();
      var preToday = preToday.setDate(preToday.getDate() - 32);
      Orders.find({
        email: req.params.email,
        started_at: {
          $gte: preToday,
          $lte: today,
        }
      }, (err, result) => {
          if (err) {
            console.log("????????? ?????? ?????? ?????? ?????? : " + req.params.email);
            res.status(400).json(err);
          }
    
          if (result) {
            res.status(200).json(result);
          } else {
            console.log("????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
            res.status(400).json(err);
          }
      })

    } else if (dateTime == 'ThreeMonthy') {
      var today = new Date();
      var preToday = new Date();
      var preToday = preToday.setDate(preToday.getDate() - 91);
      Orders.find({
        email: req.params.email,
        started_at: {
          $gte: preToday,
          $lte: today,
        }
      }, (err, result) => {
          if (err) {
            console.log("????????? ?????? ?????? ?????? ?????? : " + req.params.email);
            res.status(400).json(err);
          }
    
          if (result) {
            res.status(200).json(result);
          } else {
            console.log("????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
            res.status(400).json(err);
          }
      })

    }

  });


  app.get('/getweather/:date/:time', async function(req, res, next) {
    var date = req.params.date;
    var time = req.params.time;

    var request1 = require('request');
    // var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst' //??????????????????
    // var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService/getUltraSrtNcst' //???????????????
    var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService/getUltraSrtFcst' //???????????????
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + 'GS5nk4hqAxXBY%2BiVThUbynBs96y91ppEjtmg11%2BYNM1ySXziUlRbpqQgdpCld4%2BzhzKL9YvJVNGmXp0jI%2FgWow%3D%3D'; /* */
        queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
        queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /* */
        queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('JSON'); /* */
        queryParams += '&' + encodeURIComponent('base_date') + '=' + encodeURIComponent(date); /* */
        queryParams += '&' + encodeURIComponent('base_time') + '=' + encodeURIComponent(time); /* */
        queryParams += '&' + encodeURIComponent('nx') + '=' + encodeURIComponent('62'); /* */
        queryParams += '&' + encodeURIComponent('ny') + '=' + encodeURIComponent('126'); /* */
        // console.log(queryParams);
    await request1({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {
      // console.log('Status', response.statusCode);
      // console.log('Headers', JSON.stringify(response.headers));
      // console.log('Reponse received', body);
      res.send(body);
    })
  })

  app.get('/getmise', async function(req, res, next) {
    var date = req.params.date;
    var time = req.params.time;

    var request2 = require('request');
    var url = 'http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnMesureLIst'; /*URL*/
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '='+'GS5nk4hqAxXBY%2BiVThUbynBs96y91ppEjtmg11%2BYNM1ySXziUlRbpqQgdpCld4%2BzhzKL9YvJVNGmXp0jI%2FgWow%3D%3D'; /*Service Key*/
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /**/
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
    queryParams += '&' + encodeURIComponent('itemCode') + '=' + encodeURIComponent('PM10'); /**/
    queryParams += '&' + encodeURIComponent('dataGubun') + '=' + encodeURIComponent('HOUR'); /**/
    // queryParams += '&' + encodeURIComponent('dataTerm') + '=' + encodeURIComponent('DAILY'); /**/
    // queryParams += '&' + encodeURIComponent('ver') + '=' + encodeURIComponent('1.3'); /**/
    await request2({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {
      // console.log('Status', response.statusCode);
      // console.log('Headers', JSON.stringify(response.headers));
      // console.log('Reponse received', body);
      var xmlToJson = convert.xml2json(body, {compact: true, spaces: 4});
      // console.log("????????? ?????? ?????? : " + JSON.stringify(xmlToJson)); //2020-11-05 ????????? ?????? ?????? ????????? ?????? ?????? ?????? ??????
      res.send(xmlToJson);

    })
  })

  app.get('/getsun', async function(req, res, next) {
    var date = req.params.date;
    var time = req.params.time;

    var request3 = require('request');
    var url = 'http://apis.data.go.kr/1360000/LivingWthrIdxService/getUVIdx'; /*URL*/
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '='+'GS5nk4hqAxXBY%2BiVThUbynBs96y91ppEjtmg11%2BYNM1ySXziUlRbpqQgdpCld4%2BzhzKL9YvJVNGmXp0jI%2FgWow%3D%3D'; /*Service Key*/
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('100'); /**/
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
    queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('JSON'); /**/
    queryParams += '&' + encodeURIComponent('areaNo') + '=' + encodeURIComponent('1100000000'); /**/
    queryParams += '&' + encodeURIComponent('time') + '=' + encodeURIComponent('2020052110'); /**/
    // queryParams += '&' + encodeURIComponent('itemCode') + '=' + encodeURIComponent('PM10'); /**/
    // queryParams += '&' + encodeURIComponent('dataGubun') + '=' + encodeURIComponent('HOUR'); /**/
    // queryParams += '&' + encodeURIComponent('dataTerm') + '=' + encodeURIComponent('DAILY'); /**/
    // queryParams += '&' + encodeURIComponent('ver') + '=' + encodeURIComponent('1.3'); /**/

    await request3({
      url: url + queryParams,
      method: 'GET'
    }, function (error, response, body) {

      // console.log(body);
      // console.log('Status', response.statusCode);
      // console.log('Headers', JSON.stringify(response.headers));
      // console.log('Reponse received', body);
      if(!body) {
        return res.status(400).send({
          'msg': '????????? ?????? ??????'
        });
      } else{
        res.send(body);
      }
    })
  })

  //2020-12-15 ???????????? ????????????, ????????????, ????????? ?????? ??????
  app.get('/getOpenCurrentWeather/:lat/:lon', async function(req, res, next) {
    var resultData = {
      current : '',
      air : '',
      uv : '',
    }
    var lat = req.params.lat;
    var lon = req.params.lon;

    var request1 = require('request');
    var url1 = 'http://api.openweathermap.org/data/2.5/weather'; /*URL*/
    var queryParams1 = '?' + encodeURIComponent('appid') + '='+'5106b1b8096baed4eb5395318240e46d'; /*API Key*/
    queryParams1 += '&' + encodeURIComponent('lat') + '=' + encodeURIComponent(lat); /**/
    queryParams1 += '&' + encodeURIComponent('lon') + '=' + encodeURIComponent(lon); /**/
    queryParams1 += '&' + encodeURIComponent('units') + '=' + encodeURIComponent('metric'); /**/
    queryParams1 += '&' + encodeURIComponent('lang') + '=' + encodeURIComponent('kr'); /**/

    var request2 = require('request');
    var url2 = 'http://api.openweathermap.org/data/2.5/air_pollution'; /*URL*/
    var queryParams2 = '?' + encodeURIComponent('appid') + '='+'5106b1b8096baed4eb5395318240e46d'; /*API Key*/
    queryParams2 += '&' + encodeURIComponent('lat') + '=' + encodeURIComponent(lat); /**/
    queryParams2 += '&' + encodeURIComponent('lon') + '=' + encodeURIComponent(lon); /**/

    var request3 = require('request');
    var url3 = 'http://api.openweathermap.org/data/2.5/uvi'; /*URL*/
    var queryParams3 = '?' + encodeURIComponent('appid') + '='+'5106b1b8096baed4eb5395318240e46d'; /*API Key*/
    queryParams3 += '&' + encodeURIComponent('lat') + '=' + encodeURIComponent(lat); /**/
    queryParams3 += '&' + encodeURIComponent('lon') + '=' + encodeURIComponent(lon); /**/

    await request1({
      url: url1 + queryParams1,
      method: 'GET'
    }, function (error, response, body1) {

      if(!body1) {
        return res.status(400).send({
          'msg': 'OpenWeather ?????? ?????? ??????'
        });
      } else{
        resultData.current = JSON.parse(body1);
      }
    })

    await request2({
      url: url2 + queryParams2,
      method: 'GET'
    }, function (error, response, body2) {

      if(!body2) {
        return res.status(400).send({
          'msg': 'OpenWeather ?????? ?????? ??????'
        });
      } else{
        resultData.air = JSON.parse(body2);
      }
    })

    await request3({
      url: url3 + queryParams3,
      method: 'GET'
    }, function (error, response, body3) {

      if(!body3) {
        return res.status(400).send({
          'msg': 'OpenWeather ?????? ?????? ??????'
        });
      } else{
        resultData.uv = JSON.parse(body3);
        setTimeout(() => {
          return res.status(201).json(resultData);
        }, 500);
      }
    })
  })

  app.post("/registerTest", function(req, res, next){
    console.log(req.body);
    res.status(200).json("ok");
    
  });

  //????????? ????????? ?????? ?????? ?????? 2020-02-18
  app.get('/testskinqna/:email', function (req, res, next) {
    User.findOne({
      email: req.params.email
    },
    function(err, result) {
      if (result) {
        for(var i =0; i< result.userpoint.length; i++) {
          if (getFormattedDate(new Date(result.userpoint[i].updatedAt)) == getFormattedDate(new Date())) {
            if(result.userpoint[i].status=="skinqna") {
              return res.status(400).json({
                      'msg': '?????? ????????? ???????????? ???????????????!!'
              });
            }
          }
        }
        //???????????? ??? ????????? 1???/??? 50?????? ?????? ?????? 2020-05-25
        User.update({
          email : req.params.email
        }, {
          $push: {
            userpoint : {point: 50, updatedAt: new Date(), status: 'skinqna'}
          }, $inc: { //????????? ???????????? ?????? ???????????? ???????????? ??? ??????????????? ????????? ??? 20191028
            "totaluserpoint": 50
          }
        }, function(err, result2){
          if(err) {
            return res.status(400).json(err);
          } else {
            return res.status(201).json({
              'msg': '???????????? ?????? ???????????? ?????????????????????!!'
            });
          }
        });
      } else {
        // //??????????????? ????????? ?????? ??????
        // User.update({
        //   email : req.body.email
        // }, {
        //   $push: {
        //     userpoint : {point: 50, updatedAt: new Date(), status: 'skinqna'}
        //   }, $inc: { //????????? ???????????? ?????? ???????????? ???????????? ??? ??????????????? ????????? ??? 20191028
        //     "totaluserpoint": 50
        //   }
        // }, function(err, result2){
        //   if(err) {
        //     return res.status(400).json(err);
        //   } else {
        //     return res.status(201).json({
        //       'msg': '???????????? ?????? ???????????? ?????????????????????222!!'
        //     });
        //   }
        // });
      }
    });
  });

  app.post("/pwdSearch", function(req, res, next){

    AWS.config.update({region: "us-west-2"});

    var ses = new AWS.SES();

    let params = {
      Destination: {
          ToAddresses: ["cnghtjs@naver.com"],  // ?????? ?????? ????????? ??????
          CcAddresses: [],    // ??????
          BccAddresses: []    // ?????? ??????
      },
      Message: {
          Body: {
              Text: {
                    Data: "??????????????? ????????? ?????????. \n ???????????? ?????? ??????????????? " + makeRandomStr() + " ?????????. \n????????? ????????? ???????????? ???????????? ??????????????????.\n???????????????.",      // ?????? ??????
                  Charset: "utf-8"            // ????????? ??????
              }
          },
          Subject: {
              Data: "????????? ?????????????????? ?????????.",   // ?????? ??????
              Charset: "utf-8"              // ????????? ??????
          }
      },
      Source: "no-reply@g1p.co.kr",          // ?????? ?????? ??????
      ReplyToAddresses: ["no-reply@g1p.co.kr"] // ?????? ?????? ????????? ??????
    }


    ses.sendEmail(params, function(err, data){
        if(err) {
          console.log(err);
        }
        res.send(data)
    })
    AWS.config.update({region: "ap-northeast-2"});
  });

  app.get('/getProductList/:search/:page', function(req, res) {
    var page = Number(req.params.page);
    Product.find({
      $text : { $search : new RegExp(req.params.search, "i")}
      // product_name : new RegExp(req.params.product_name),
      // brand_name : new RegExp(req.params.product_name)
    },{ score: { $meta: "textScore" } },function(error, data){
      if(error) {
        return res.status(400).json(error);
      }
      if(data) {
        res.send(data);
      }
    }).sort( { score: { $meta: "textScore" } } ).skip((page-1)*20).limit(20);
  });

  app.get('/getProductFindOne/:product_num/', function(req, res) {
    // var page = Number(req.params.page);
    Product.findOne({
      product_num : req.params.product_num
      // $text : { $search : new RegExp(req.params.search)}
      // product_name : new RegExp(req.params.product_name),
      // brand_name : new RegExp(req.params.product_name)
    },function(error, data){
      if(error) {
        return res.status(400).json(err);
      }
      if(data) {
        res.status(201).json(data);
      }
    })
  });

  app.get('/getSkinAnaly/:email/' ,function(req, res) {
    SkinAnaly.findOne({
      email : req.params.email
    },function(error, data){
      if(error ) {
        return res.status(400).json(err)
      }
      if(data) {
        res.status(200).json(data);
      } else {
        res.status(200).json(data);
      }
    })
  })

  function average(array) { //?????? ?????? ??????
    return array.reduce((sum, current) => sum + current, 0) / array.length;
  }

  app.get('/userFindDate', function (req, res) {
    var today = new Date();
    var preToday = new Date();
    var preToday = preToday.setDate(preToday.getDate() - 8);
    User.find({
      created: {
        $gte: preToday,
        $lte: today,
      }
    }, function (err, result) {
        if (err) {
          res.status(400).json();
        }

        if (result) {
          res.status(200).json(result);
        }
    })
  })


  app.get('/getSkinAnalyAge/:age/:gender' ,function(req, res) {

    var avgCheekPoreSize = [];
    var avgCheekPoreCount = [];
    var avgForeHeadPoreSize = [];
    var avgForeHeadPoreCount = [];
    SkinAnaly.find({
      agerange : req.params.age,
      gender : req.params.gender,
    },function(err, docs){

      if(err) {
        return res.status(400).json({
          "msg" : err
        })
      }

      if(docs) {
        for(let i = 0; i < docs.length; i++) {
          for(let k = 0; k < docs[i].cheek.length; k++) {
            for(let t= 0; t < docs[i].cheek[k].pore.length; t++) {
              avgCheekPoreSize.push(docs[i].cheek[k].pore[0].average_pore);
              avgCheekPoreCount.push(docs[i].cheek[k].pore[0].pore_count);
            }
          }
        }
        // console.log(avgCheekPoreSize);
        // console.log(avgCheekPoreCount);
        // console.log(average(avgCheekPoreSize));
        // console.log(average(avgCheekPoreCount));

        for(let i = 0; i < docs.length; i++) {
          for(let k = 0; k < docs[i].forehead.length; k++) {
            for(let t= 0; t < docs[i].forehead[k].pore.length; t++) {
              avgForeHeadPoreSize.push(docs[i].forehead[k].pore[0].average_pore);
              avgForeHeadPoreCount.push(docs[i].forehead[k].pore[0].pore_count);
            }
          }
        }

        // console.log(avgForeHeadPoreSize);
        // console.log(avgForeHeadPoreCount);
        // console.log(average(avgForeHeadPoreSize));
        // console.log(average(avgForeHeadPoreCount));

        res.status(200).json({
          "avgCheekPoreSize" : average(avgCheekPoreSize),
          "avgCheekPoreCount" : average(avgCheekPoreCount),
          "avgForeHeadPoreSize" : average(avgForeHeadPoreSize),
          "avgForeHeadPoreCount" : average(avgForeHeadPoreCount),
          "allAvgData" : docs
        });
      } else {
        res.status(200).json({
          "avgCheekPoreSize" : 0,
          "avgCheekPoreCount" : 0,
          "avgForeHeadPoreSize" : 0,
          "avgForeHeadPoreCount" : 0,
        });
      }
    })
  })

  app.post("/categoryIndex", function(req, res, next){
    let category = Category(req.body);
    category.save((err, data) =>{
      if(err) {
        console.log(err);
        return res.status(400);
      }

      if(data) {
        return res.status(200).json({
          data
        })
      }
    })
  });

  //20200902
  // 1. Hoseon ????????? ????????? ?????? AWS??? ????????????
  // 2. ????????? ????????? ?????? fileStream??? ???????????? Cafe24?????? ?????? ????????????.
  // 3. ?????? ????????? API??? ????????? ???????????? ???????????? Diff??? ?????? ?????? ?????????.
  // 4. ?????? ?????? ?????? ?????? ?????? Mongodb??? ????????????.

  app.post('/skinAnalySecondCheekSave', s3skinupload.single('image'), async function(req, res, next) {
    //MongoDB Start
    SkinAnaly.findOne({
      email : req.body.email
    },function(err, data) {
      if(err) {
        res.status(400).json({
          'msg' : '?????? ?????? ?????? ?????? ??????'
        })
      }

      if(data) {
        //????????? ????????? ?????? ?????????
        //?????????????????? ???????????? ?????? ????????? ???????????? ????????????.
        //??????????????? ?????? ???????????? ????????? ?????? ????????? ?????? ??????.
        const fs2 = require("fs");
        const https = require("https");
        const file = fs2.createWriteStream(__dirname + '/../' + req.file.key);
        // const featApiUrl = 'http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/api/'; // ????????? ???????????? API
        const featApiUrl = 'http://ec2-52-79-142-125.ap-northeast-2.compute.amazonaws.com/api/'; // ?????????????????? ???????????? API 2020-12-07
        const awsS3Url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/';
        var request22 = require('request');
        https.get(awsS3Url + req.file.key , response => {
          var stream = response.pipe(file);
          stream.on("finish",  function() {
            var req22 = request22.post(featApiUrl, function (err, response, body) {
              if (err) {
                console.log('skinAnalySecondCheekSave Error! : ' + err);
              } else {
                console.log("1st : " + body);
                console.log("2nd :" + JSON.stringify(body));
                if(IsJsonString(body)) {
                  body = JSON.parse(body);
                  body.output.skin_analy.pore = JSON.parse(JSON.stringify(body.output.skin_analy.pore).replace(/um/g, ""));
                    SkinAnaly.findOneAndUpdate({
                      email: req.body.email
                    }, {
                      updated_at: new Date(),
                      $push: {
                        cheek: {
                          input: body.input,
                          diff: body.output.skin_analy.diff,
                          tone: body.output.skin_analy.tone,
                          pore: body.output.skin_analy.pore,
                          wrinkles: body.output.skin_analy.wrinkles,
                          email: req.body.email
                        },
                        munjin: {
                          sleep : req.body.sleep,
                          alcohol : req.body.alcohol,
                          fitness : req.body.fitness,
                        }
                      }
                    }, (err, post) => {
                      if (err) {
                        console.log(err);
                        return res.status(400).json({
                          'msg': '????????????'
                        })
                      }
                      if(post) {
                        return res.status(200).json({
                          'msg' : '????????? ?????? ??????'
                        })
                      }
                    })
                } else {
                  return res.status(400).json({
                    "msg" : "?????? ?????? ?????? (??? ?????? ??????)"
                  })
                }
              }
            });

            var form = req22.form();
            form.append('image', fs.readFileSync(__dirname + '/../' + req.file.key), {
              filename: req.file.key.replace('skin/', ''),
              contentType: 'image/jpg'
            });
            form.append('diff_image', fs.readFileSync(__dirname + '/../skin/' + data.firstcheek), {
              filename: data.firstcheek,
              contentType: 'image/jpg'
            });

          });
        });
      }
    })
    //MongoDB End

  })

  app.post('/skinAnalySecondForeheadSave', s3skinupload.single('image'), async function(req, res, next) {
    //MongoDB Start
    SkinAnaly.findOne({
      email : req.body.email
    },function(err, data) {
      if(err) {
        res.status(400).json({
          'msg' : '?????? ?????? ?????? ?????? ??????'
        })
      }

      if(data) {
        //????????? ????????? ?????? ?????????
        //?????????????????? ???????????? ?????? ????????? ???????????? ????????????.
        //??????????????? ?????? ???????????? ????????? ?????? ????????? ?????? ??????.
        const fs2 = require("fs");
        const https = require("https");
        const file = fs2.createWriteStream(__dirname + '/../' + req.file.key);
        // const featApiUrl = 'http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/api/'; //????????? ???????????? API
        const featApiUrl = 'http://ec2-52-79-142-125.ap-northeast-2.compute.amazonaws.com/api/'; // ?????????????????? ???????????? API 2020-12-07
        const awsS3Url = 'https://plinic.s3.ap-northeast-2.amazonaws.com/';
        var request22 = require('request');

        https.get(awsS3Url + req.file.key , response => {
          var stream = response.pipe(file);
          stream.on("finish",  function() {
            var req22 = request22.post(featApiUrl, function (err, response, body) {
              if (err) {
                console.log('skinAnalySecondForeheadSave Error! : ' + err);
              } else {
                // console.log("2st : " + body);
                if(IsJsonString(body)) {
                  body = JSON.parse(body);
                  body.output.skin_analy.pore = JSON.parse(JSON.stringify(body.output.skin_analy.pore).replace(/um/g, ""));
                  SkinAnaly.findOneAndUpdate({
                    email: req.body.email
                  }, {
                    updated_at: new Date(),
                    $push: {
                      forehead: {
                        input: body.input,
                        diff: body.output.skin_analy.diff,
                        tone: body.output.skin_analy.tone,
                        pore: body.output.skin_analy.pore,
                        wrinkles: body.output.skin_analy.wrinkles,
                        email: req.body.email
                      }
                    }
                  }, (err, post) => {
                    if (err) {
                      console.log(err);
                      return res.status(400).json({
                        'msg': '????????????'
                      })
                    }
                    if(post) {
                      return res.status(200).json({
                        'msg' : '????????? ?????? ??????'
                      })
                    }
                  })
                } else {
                  return res.status(400).json({
                    "msg" : "?????? ?????? ?????? ?????? (?????? ?????? ?????? ??????)"
                  })
                }
              }
            });
            var form = req22.form();
            form.append('image', fs.readFileSync(__dirname + '/../' + req.file.key), {
              filename: req.file.key.replace('skin/', ''),
              contentType: 'image/png'
            });
            form.append('diff_image', fs.readFileSync(__dirname + '/../skin/' +data.firstforhead), {
              filename: data.firstforhead,
              contentType: 'image/png'
            });

          });
        });
      }
    })
    //MongoDB End



  })

  app.get('/postTest2', async function(req, res, next) {
    // const url = 'http://ec2-3-34-189-215.ap-northeast-2.compute.amazonaws.com/api/'  //????????? ?????? API ?????? 2020-12-07
    const url = 'http://ec2-52-79-142-125.ap-northeast-2.compute.amazonaws.com/api/' //?????????????????? ?????? API ?????? 2020-12-07
    var request22 = require('request');
    var req = await request22.post(url, function (err, response, body) {
      if (err) {
        console.log('Error!');
      } else {
        return res.status(200).json({
          body
        })
      }
    });

    var form = req22.form();
    form.append('image', fs.readFileSync(__dirname + '/../' + req.file.key), {
      filename: req.file.key.replace('skin/', ''),
      contentType: 'image/jpg'
    });
    form.append('diff_image', fs.readFileSync(__dirname + '/../skin/' + data.firstcheek), {
      filename: data.firstcheek,
      contentType: 'image/jpg'
    });
  })


  app.get('/getAllMunjinData/:value', function(req, res) {

    if(!req.params.value) {
      return res.status(400).json({
        'msg' : '?????? ????????? ???????????? ???????????????.'
      })
    }

    SkinAnaly.find({}, '-__v').lean().exec((err, data) => {
      var result = [];
      if(data) {
        for(let i = 0; i < data.length; i++){
          for(let k = 0; k < data[i].munjin.length; k++) {
            result.push( Number(data[i].munjin[k].sleep) + Number(data[i].munjin[k].alcohol) + Number(data[i].munjin[k].fitness) );
          }
        }
        result = result.sort(function(a, b){ return a-b; });
        var rank = percentRank(result, Number(req.params.value));
        rank = Math.floor(100 - (rank * 100));
        return res.status(200).json({
          rank : rank
        })
      }
      if (err) {
        res.sendStatus(404);
      }
    });
  });

  //????????? ?????? ?????? ?????? 2020-11-12
  app.get('/getProductReview/:product_num', function (req, res, next) {
    ProductsReview.find({
      product_num: req.params.product_num
      },
      function (err, docs) {
        if (err) {
          res.sendStatus(400);
        } else {
          res.json(docs);
        }
      });
  });

  app.get('/getUserAddress/:email', function (req, res, next) {
    Address.findOne({
      email: req.params.email,
    }, function (err, docs) {
        if (err) {
          console.log("????????? ????????? ?????? ???????????? ?????? : " + req.params.email);
          return res.status(400).json(err);
        }

        if (docs) {
          return res.status(201).json(docs);
        }
    })
  })

  app.get('/getUserPointLog/:email', function (req, res, next) {
    // PointLog.findOne({
    //   email: req.params.email,
    // }, function (err, docs) {
    //   if (err) {
    //     console.log("????????? ????????? ?????? ?????? ?????? ?????? : " + req.params.email);
    //     return res.status(400).json(err);
    //   }

    //   if (docs) {
    //     return res.status(201).json(docs);
    //   } else {
    //     console.log("????????? ????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
    //     return res.status(400).json();
    //   }
    // });
    
    PointLog.aggregate([
      { $unwind: "$point" },
      { $match: { email: req.params.email } },
      { $sort: { 'point.createdAt': -1 } }
    ], function (err, docs) {
      if (err) {
        console.log("????????? ????????? ?????? ?????? ?????? ?????? : " + req.params.email);
        return res.status(400).json(err);
      }

      if (docs) {
        return res.status(201).json(docs);
      } else {
        console.log("????????? ????????? ?????? ?????? ?????? ??????2 : " + req.params.email);
        return res.status(400).json();
      }
    });
        
  });

  //????????? ?????? ?????? ?????? 2021-03-17 3?????? ?????? ??????
  app.get('/getProductReview2/:product_num/:page', function (req, res, next) {
    // console.log(req.params.page);
    // console.log(req.params.product_num);
    var page = Number(req.params.page);
    ProductsReview.find({
      product_num: req.params.product_num
      },
      function (err, docs) {
        if (err) {
          console.log("??????????????? 3?????? ???????????? ?????? : " + req.parmas.product_num);
          res.sendStatus(400);
        } else {
          if (docs) {
            res.json(docs);
          } else {
            console.log("??????????????? 3?????? ???????????? ??????2 : " + req.parmas.product_num);
            res.sendStatus(400);            
          }
        }
      }).sort({ "createdAt": -1 }).skip((page - 1) * 3).limit(3);
    //"createdAt" : -1 ?????????
    //"rating": -1 ?????? ?????? ???
    //"rating": 1 ?????? ?????? ???
  });

  //????????? ?????? ?????? ?????? 2021-03-17 3?????? ?????? ??????
  app.get('/getProductReview3/:product_num/:page/:sort', function (req, res, next) {
    // console.log(req.params.page);
    // console.log(req.params.product_num);

    var sort = {}; 

    if (req.params.sort == 'createdAt') {
      sort = { 'createdAt' : -1 }
    } else if (req.params.sort == 'highRating') {
      sort = { 'rating' : -1 }
    } else if (req.params.sort == 'lowRating') {
      sort = { 'rating' : 1 }
    }
    
    var page = Number(req.params.page);
    ProductsReview.find({
      product_num: req.params.product_num
      },
      function (err, docs) {
        if (err) {
          console.log("??????????????? 3?????? ???????????? ?????? : " + req.parmas.product_num);
          res.sendStatus(400);
        } else {
          if (docs) {
            res.json(docs);
          } else {
            console.log("??????????????? 3?????? ???????????? ??????2 : " + req.parmas.product_num);
            res.sendStatus(400);            
          }
        }
      }).sort(sort).skip((page - 1) * 3).limit(3);
    //"createdAt" : -1 ?????????
    //"rating": -1 ?????? ?????? ???
    //"rating": 1 ?????? ?????? ???
  });

  //??? ???????????? ????????? ???????????? ?????? ?????? ????????? ???????????? ?????? ???????????? ?????? ??????.
  app.get('/getProductReviewCount/:email/:product_num', function (req, res, next) {
    // console.log(req.params.email);
    // console.log(req.params.product_num);
    ProductsReview.countDocuments({
      email: req.params.email,
      product_num: req.params.product_num
    }, function (err, docs) {
        if (err) {
          console.log("???????????? ?????? ?????? ???????????? ??????1 : " + req.params.email + " : " + req.params.product_num);
          res.sendStatus(400).json();
        }

        if (docs) {
          res.json(docs);
        } else {
          // console.log("???????????? ?????? ?????? ???????????? ??????2 : " + req.params.email + " : " + req.params.product_num);
          res.json(0);
        }
    })
  });

  app.post("/callbacks/sign_in_with_apple", (request, response) => {
    const redirect = `intent://callback?${new URLSearchParams(
      request.body
    ).toString()}#Intent;package=${
      process.env.ANDROID_PACKAGE_IDENTIFIER
    };scheme=signinwithapple;end`;

    console.log(`Redirecting to ${redirect}`);

    response.redirect(307, redirect);
  });

  app.post("/sign_in_with_apple", async (request, response) => {
    console.log("sign_in_with_apple Login");
    const auth = new AppleAuth(
      {
        // use the bundle ID as client ID for native apps, else use the service ID for web-auth flows
        // https://forums.developer.apple.com/thread/118135
        client_id:
          request.query.useBundleId === "true"
            ? process.env.BUNDLE_ID
            : process.env.SERVICE_ID,
        team_id: process.env.TEAM_ID,
        redirect_uri:
          "https://admin.g1p.xyz/callbacks/sign_in_with_apple", // does not matter here, as this is already the callback that verifies the token after the redirection
        key_id: process.env.KEY_ID
      },
      process.env.KEY_CONTENTS.replace(/\|/g, "\n"),
      "text"
    );
    console.log("?????? ????????? ?????? ?????? :::");
    console.log(request.query);
  
    const accessToken = await auth.accessToken(request.query.code);
  
    const idToken = jwt.decode(accessToken.id_token);
  
    const userID = idToken.sub;
  
    console.log(idToken);
  
    // `userEmail` and `userName` will only be provided for the initial authorization with your app
    const userEmail = idToken.email;
    const userName = `${request.query.firstName} ${request.query.lastName}`;
  
    // ????????????????? TODO: Use the values provided create a new session for the user in your system
    const sessionID = `NEW SESSION ID for ${userID} / ${userEmail} / ${userName}`;
  
    console.log(`sessionID = ${sessionID}`);
  
    response.json({ sessionId: sessionID });
  });



  app.post("/setServerLog", function (req, res, next) {
    if (req.body) {
      console.log("::::::::::::::::::::::::::: ????????? ??? ?????? :::::::: LogType : " + req.body.logType + " \n: " + req.body.log + "\n: " + req.body.nickname + "\n: " + new Date() + "\n: Device : " + req.body.device);
      return res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });

  app.post('/callbacks/apple/sign_in_with_apple', async (request, response) => {
    const redirect = `applink://plinic2snslogin?${new url.URLSearchParams(request.body).toString()}`;

    console.log(`Redirecting to ${redirect}`);
    response.redirect(307, redirect);
  });

  app.get('/callbacks/kakao/sign_in', async (request, response) => {
    //Authentication Code ?????? ????????? api 
    const redirect = `webauthcallback://success?${new url.URLSearchParams(request.query).toString()}`;
    console.log(`Redirecting to ${redirect}`);
    response.redirect(307, redirect);
  })

  app.post('/callbacks/kakao/token', async (request, response) => {
    //?????? ?????? kakao AccessCode??? ????????? ????????? firebase ??? custom token ???????????? ?????? api
    kakao_auth.createFirebaseToken(request.body["accessToken"],(resulst)=>{
      response.send(resulst);
    });
  })

  app.get('/callbacks/naver/sign_in', async (request, response) => {
    //Authentication Code ?????? ????????? api 
    const redirect = `webauthcallback://success?${new url.URLSearchParams(request.query).toString()}`;
    console.log(`Redirecting to ${redirect}`);
    response.redirect(307, redirect);
  })

  app.post('/callbacks/naver/token', async (request, response) => {
    //?????? ?????? kakao AccessCode??? ????????? ????????? firebase ??? custom token ???????????? ?????? api
    naver_auth.createFirebaseToken(request.body["accessToken"],(resulst)=>{
      response.send(resulst);
    });
  })
  


  ///////////////////////////////////////////////////end api////////////////////////////////

  function getFormattedDate(date) {
    return date.getFullYear() + "-" + get2digits(date.getMonth() + 1) + "-" + get2digits(date.getDate());
  };

  function get2digits(num){
    return ("0" + num).slice(-2);
  }



  /*
  const uri = "mongodb+srv://plinic:1234@cluster0-hgfgd.mongodb.net/plinic?retryWrites=true";
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(err => {
    console.log("1");
    const collection = client.db("plinic").collection("devices");
    // perform actions on the collection object
    console.log(err);
    client.close();
  });
  */

  mongoose.connect(config.db, {
    useNewUrlParser: true,
    useCreateIndex: true
  });

  const connection = mongoose.connection;

  connection.once('open', () => {
    console.log('MongoDB database connection established successfully!');

  });

  connection.on('error', (err) => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    process.exit();
  });


  // Start the server
  app.listen(port);
  console.log('Plinic Server : http://localhost:' + port);
  return app;


  function countVisitors(req, res, next) {
    if (!req.cookies.count && req.cookies['connect.sid']) {
      res.cookie('count', "", {
        maxAge: 3600000,
        httpOnly: true
      });
      var now = new Date();
      var date = now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate();
      if (date != req.cookies.countDate) {
        res.cookie('countDate', date, {
          maxAge: 86400000,
          httpOnly: true
        });

        var Counter = require('./models/Counter');
        Counter.findOne({
          name: "vistors"
        }, function (err, counter) {
          if (err) return next();
          if (counter === null) {
            Counter.create({
              name: "vistors",
              totalCount: 1,
              todayCount: 1,
              date: date
            });
          } else {
            counter.totalCount++;
            if (counter.date == date) {
              counter.todayCount++;
            } else {
              counter.todayCount = 1;
              counter.date = date;
            }
            counter.save();
          }
        });
      }
    }
    return next();
  }


  function makeRandomStr(){
    var randomStr = "";
    var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for( let i = 0; i < 8; i++ ){
        randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return randomStr;
  }

  function IsJsonString(str) {
    try {
      var json = JSON.parse(str);
      return (typeof json === 'object');
    } catch (e) {
      return false;
    }
  }









}
