import express from 'express'
import session from 'express-session'
import flash from 'connect-flash'
import passport from 'passport'
import 'dotenv/config.js'
import { lowdb } from './lowdb.js'

export {passport}
import './auth.js'

const app = express()


app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

app
  .get('/', (req, res) => {
    res.render('home.ejs', { user: req.user })
  })
  .get('/login', checkNotLoggedIn, (req, res) => {
    console.log('get /login : req.user : ', req.user)
    console.log('/login req.session : ', req.session);
    const message = req.flash('error')[0]
    res.render('login.ejs', { message })
  })
  .post('/login', checkNotLoggedIn, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  .get('/mypage', checkLoggedIn, (req, res) => {
    res.render('myPage.ejs', { user: req.user })
  })
  .get('/logout', checkLoggedIn, (req, res) => {
    req.logout(function (err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  })
  .get('/register', checkNotLoggedIn, (req, res) => {
    res.render('register.ejs')
  })
  .post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = {
      id: await nanoid(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      provider:LoginProvider.Local
    }
    lowdb.data.users.push(user)
    await lowdb.write()
    res.redirect('/login')
  })
  .get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }))
  .get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/facebook',
    passport.authenticate('facebook', { scope: 'email' }))
  .get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/kakao',
    passport.authenticate('kakao'))
  .get('/auth/kakao/callback',
    passport.authenticate('kakao', { failureRedirect: '/auth/kakao' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })
  .get('/auth/naver',
    passport.authenticate('naver'))
  .get('/auth/naver/callback',
    passport.authenticate('naver', { failureRedirect: '/auth/naver' }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    })

function checkLoggedIn(req, res, next) {
  if (req.user === undefined) return res.redirect('/login');
  return next()
}

function checkNotLoggedIn(req, res, next) {
  if (req.user === undefined) return next();
  return res.redirect('/');
}


const PORT = 3031
app.listen(PORT, console.log(`server is listening on port http://localhost:${PORT}`))

