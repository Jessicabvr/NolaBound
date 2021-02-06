
require('dotenv').config()
  //this loads all the environment variables and sets them inside of process.env

const methodOverride = require('method-override')
const express = require('express');
// const db = require('./db/database.js')
const {User, Favorites, Markers} = require('./db/database.js')
const app = express();
app.set('view engine', 'ejs')
const path = require('path');
const axios = require('axios');
const bodyParser= require('body-parser');
//changed extended to false to work with form data;allows data to be in req body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..','client','dist')))
app.use(bodyParser.json())
const bcrypt =  require('bcrypt')
const passport = require('passport');
const cloudinary = require('cloudinary')
const flash = require('express-flash')
const session = require('express-session')
const cors = require('cors');
const formData = require('express-form-data')
const initializePassport = require('../passport.config')
cloudinary.config({
cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})
app.use(cors())
app.use(flash())
app.use(formData.parse())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,//should we resave if nothing changes
  saveUninitialized: false // do we want to save empty value
}))
app.use(methodOverride('_method'))
// app.set('view engine', 'ejs')
app.use(passport.initialize())
//stores variables to be persisted across the session
app.use(passport.session())
const checkAuthenticated = (req, res, next) => {
  //this function checks if the user is logged in
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login')
}
const notAuthenticated = (req, res, next) => {
  //this function checks if the user is not logged in
  //not working
  //if the user is logged in
  if(req.isAuthenticated()){
    //redirect to the home page
   return res.redirect('/');
  }
  //if they are not authenticated keep going
  next();
}
initializePassport(passport,
   email => User.findOne({where: {}}),
  //return db query  find user => user.email === email
  id => User.findOne(user => user.id === id)
);

//login route to display login page
// app.get('/login',  (req, res) => {
//   res.render('/login')
// })
//registration route
// app.get('/register', (req, res) => {
//   res.render('Login.jsx')
// })
//signup route to submit registration

app.get('/markers', (req, res) => {

  Markers.findAll({})
    .then((data) => {
      res.send(data);
    })
    .catch((err) =>{
      console.log(err);
    });
});
app.post('/markers', (req, res) => {
  //console.log('APP POST REQ BODY', req.body);


    req.body.map((marker) => {
//console.log('THIS IS MARKER', marker)
      const {latitude,
        longitude,
        description} = marker;


        const newMarker = new Markers({
          latitude,
          longitude,
          description
        });

        newMarker.save()
          .then((data) => {
            console.log('MARKERS ADDED');

          })
          .catch((err) => {

          });



    })
  });


  app.post('/create', (req, res) => {
    const values = Object.values(req.files)
  const promises = values.map(image => cloudinary.uploader.upload(image.path))
  console.log('VALUES', values[0].path)

  const {latitude,
      longitude,
      description} = req.body;


      Promise
      .all(promises)
      .then(res =>  {
        console.log(res)
        const newMarker = new Markers({
          latitude,
          imageUrl: res[0].url,
          longitude,
          description
        })
        newMarker.save()
        .then((data) => {
          console.log('MARKERS ADDED');

        })
        .catch((err) => {

        });
    })
    .catch(err => console.error('Error creating marker', err))
})

    //   // req.body.map((marker) => {

    //   //   const {latitude,
    //   //     longitude,
    //   //     imageUrl,
    //   //     description} = marker;

      // .then((data) => {
      //   console.log('MARKERS ADDED', data);
      //   res.redirect('/')
      // })
      // .catch((err) => {
      //   console.error('error line 144', err)
      // });
  // const newMarker = new Markers({
  //   latitude,
  //   longitude,
  //   imageUrl,
  //   description
  // });

  // newMarker.save()
  //   .then((data) => {
  //     console.log(data);

  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });


app.post('/register', (req, res) => {
  //console.log('APP POST REQ', req);
  const {username, email, password} = req.body;
  //const password = await bcrypt.hash(req.body.password, 10)

  const newUser = new User({
    username,
    password,
    email
  })
  newUser.save()
    .then((data) => {
      console.log('THIS IS DATA:', data);
      res.redirect('/')

    })
    .catch((err) => {
      console.log(err);
    });
});

app.post('/api/favorites', (req, res) => {
  //console.log('APP POST REQ', req.body);
  const {latitude, longitude, description, imageUrl} = req.body;


  const newFavorite = new Favorites({
    latitude,
    longitude,
    imageUrl,
    description
  })
  newFavorite.save()
    .then((data) => {
      console.log('THIS IS DATA:', data);
      res.redirect('/')

    })
    .catch((err) => {
      console.log(err);
    });
});

//app.post('/login', notAuthenticated, passport.authenticate('local', {

//   successRedirect: '/',
//   failureRedirect: '/',
//   failureFlash: true
// })


// )

app.post('/login', (req, res, next) => {
  //console.log(Users);

  const {email, password} = req.body;
  console.log('login req.body', req.body)
  return User.findOne({where: {email: req.body.email}}).then((data) => {
    //console.log('THIS IS DATA', data);
    if (data) {
      console.log('this is login server data', data)

      if(password === data.password){
        console.log('LOGIN CORRECT')
        res.redirect('/')
      } else {
        console.log('INCORRECT PASSWORD')
        res.redirect('/');
      }

      //  bcrypt.compare(password, data.password)
      // .then((correct) => console.log('login successful'))
      // .catch((err) => console.log('WRONG PASSWORD', err))

    } else {
      console.log('DOES NOT WORK')
      res.status(401).send('USER NOT FOUND');


    }
  });
});
app.post('/comments', (req, res, next) => {
  //console.log(Users);

  //const { comments} = req.body;
  console.log('comment req.body', req.body)
  return Markers.findOne({where: {description: req.body.description}}).then((data) => {
    //console.log('THIS IS DATA', data);
    if (data) {
      console.log('this is comment server data', data)

      data.update({
        comments: req.body.comments
      })
      .then((data) => { res.redirect('/')})
      .catch((err) => {console.log(err)
      })

      //  bcrypt.compare(password, data.password)
      // .then((correct) => console.log('login successful'))
      // .catch((err) => console.log('WRONG PASSWORD', err))

    } else {

      res.redirect('/')


    }
  });
});





//logout route
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})







app.listen(3000, function() {
  console.log('listening on 3000')
})
