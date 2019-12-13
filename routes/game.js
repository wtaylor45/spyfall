var express = require('express');
var router = express.Router();
var Room = require('../server/room');
const Locations = require('../server/locations');

module.exports = (io) => {
  router.get('/update', function (req, res) {
    const code = req.query.c;
    const pId = req.query.p;
    console.log('hi,', pId)
    if (!code) return res.send({ status: 'failed', msg: 'No room code provided.' });
    
    const room = Room.findRoom(code);
    if (!room) return res.send({ status: 'failed', msg: 'No room found.' });
    console.log(room.getState(pId))
    res.send({ status: 'success', data: room.getState(pId) });
  });

  router.get('/users', function (req, res) {
    const code = req.query.c;

    if (code.length < 1) {
      res.send({ status: 'failed', msg: 'No room code provided.' });
      return console.error('No room code provided.');
    }

    const room = Room.findRoom(code);
    console.log('Sending users for', req.query.c);
    res.send({ status: 'success', data: room.getPlayers() });
  });

  router.get('/locations', (req, res) => {
    res.send({ locations: Locations.locations });
  });

  router.get('/start', (req, res) => {
    const code = req.query.c;
    if (!code) return req.send({ status: 'failed', msg: 'No room code provided' });
    const room = Room.findRoom(code);

    if (!room.started) room.startGame(360);
    
    io.to(code).emit('started');
    res.send({ status: 'success' });
  });

  router.get('/end', (req, res) => {
    const code = req.query.c;
    if (!code) return req.send({ status: 'failed', msg: 'No room code provided' });
    const room = Room.findRoom(code);

    if (room.started) room.endGame();

    res.send({ status: 'success' })
  });

  return router;
}
