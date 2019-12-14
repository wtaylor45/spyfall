var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var uuidv1 = require('uuidv1');

var app = express();
var http = require('http').createServer(app)
var io = require('socket.io')(http);

var indexRouter = require('./routes/index')(io);
var gameRouter = require('./routes/game')(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/game', gameRouter);

// catch 404 and forward to error handler
app.use(express.static(path.join(__dirname, 'client/build')));

io.on('connection', function (socket) {
  socket.emit('connected', uuidv1());

  socket.on('joined', (body) => {
    socket.join(body.room);
    socket.broadcast.to(body.room).emit('user update', { code: body.room, time: Date.now() })
  });

  socket.on('leave', (body) => {
    socket.broadcast.to(body.room).emit('user update', { code: body.room, time: Date.now() });
    socket.leave(body.room);
  });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:3001');
});

module.exports = app;
