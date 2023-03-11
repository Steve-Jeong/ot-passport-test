const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const userData = {
  users: [
    {
      email: 'egoing777@gmail.com',
      password: '111111',
      name: 'egoing'
    },
    {
      email: 'jst0930@gmail.com',
      password: 'x',
      name: 'Steve Jeong'
    }
  ]
}


const app = express()

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:false}))
app.use(session({
  secret: 'keyboard cat',
  resave:false,
  saveUninitialized:true
}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(
  {
    usernameField:'email',
    passwordField:'password'
  },
  (email, password, done)=>{
    console.log('email : ', email)
    console.log('password : ', password)
    const user = userData.users.find(user => user.email === email)

    if (user == null) {
      console.log('user does not exist');
      return done(null, false, { message: 'No user with that email' })
    }

    if (user.password === password) {
      return done(null, user)
    } else {
      console.log('user password incorrect');
      return done(null, false, { message: 'Password incorrect' })
    }
  }
))

app
  .get('/', (req, res) => {
    res.render('home.ejs', {user: req.user})
  })
  .get('/login', (req, res) => {
    console.log('get /login : req.user : ', req.user)
    console.log('/login req.session : ', req.session);
    const message = req.flash('error')[0]
    res.render('login.ejs', {message})
  })
  .post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect:'/login',
    failureFlash:true
  }))






const PORT = 3031
app.listen(PORT, console.log('server is listening on port', PORT))

