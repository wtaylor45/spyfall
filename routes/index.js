var express = require('express');
var router = express.Router();
var Room = require('../server/room');
const path = require('path');

module.exports = function (io) {

  let players = [];

  const createPlayer = (id, name, isHost, room, socketId) => {
    let isNew = true;
    let player = players.find(p => p.id === id) || {};
    if (player) isNew = false;
    player.id = player.id || id;
    player.name = name;
    player.isHost = isHost;
    player.room = room;
    player.socketId = socketId;
    if (isNew) players.push(player);
    return player;
  }

  router.use(express.static(path.join(__dirname, '../client', 'build')));

  router.get('/', function (req, res) {
    res.sendFile('index.html');
  });

  router.post('/create', function (req, res) {
    const code = Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(1, 4);
    const creator = createPlayer(req.body.player.id, req.body.player.name, req.body.player.isHost, code, req.body.player.socketId);
    const room = new Room(code, io, [creator], false);
    players.push(creator);
    res.send({ status: 'success', code: code });
  });

  router.post('/join', function (req, res) {
    console.log('Attempting to join', req.body.room)
    if (!req.body.room && req.body.player.id.length > 0) {
      const player = players.find(player => player.id === req.body.player.id);
      if (!player) return res.send({ status: 'failed', msg: 'You were not previously in a room.' });
      const room = Room.rooms.find(room => room.code === player.room);
      if (!room) {
        player.room = '';
        return res.send({ status: 'failed', msg: 'The room you were previously in has closed.' });
      }

      return res.send({ status: 'success', code: room.code });
    }

    let player = createPlayer(
      req.body.player.id,
      req.body.player.name,
      req.body.player.isHost,
      req.body.room,
      req.body.player.socketId
    );
    const room = Room.findRoom(req.body.room);
    if (!room) {
      player.room = '';
      return res.send({ status: 'failed', msg: 'The room code provided is invalid.' });
    }
    if (room.getPlayers().length >= 12) {
      return res.send({ status: 'failed', msg: 'The room is full.' });
    }
    room.addPlayer(player);
    return res.send({ status: 'success', code: player.room });
  });

  router.get('/leave', (req, res) => {
    const code = req.query.c;
    const player = req.query.p;
    if (!code) return res.send({ status: 'failed', msg: 'No room code provided' });

    const room = Room.findRoom(code);
    room.removePlayer(player);
    players = players.filter(p => player.id !== p.id);
    console.log('Removed player', player, 'from room', code);
    if (room.getPlayers().length === 0) Room.closeRoom(code);
    res.send({ status: 'success' });
  });

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.render('index', { title: 'Spyfall' });
  });
  
  return router;
}

