const Locations = require('./locations');
const _ = require('underscore');

class Room {
  constructor(code, io, players=[], started=false) {
    this.code = code;
    this.io = io;
    this.players = players;
    this.started = started;

    this.startTime = 0;
    this.currentTime = 0;
    this.location = {};
    this.loop;

    Room.rooms.push(this);
  }

  addPlayer(player) {
    if (this.players.find(p => p.id === player.id)) return 1;
    player.role = {};
    this.players.push(player);
  }

  removePlayer(playerId) {
    this.players = this.players.filter(player => player.id !== playerId);
  }

  findPlayer(playerId) {
    return this.players.find(player => player.id === playerId);
  }

  getPlayers() {
    return this.players;
  }
  
  getState(playerId) {
    const player = this.findPlayer(playerId);

    return {
      code: this.code,
      started: this.started,
      time: this.currentTime,
      players: this.players.map(player => ({ name: player.name })),
      role: player.role
    }
  }

  startGame(initialTime) {
    this.startTime = this.currentTime = initialTime;
    this.location = Locations.pickLocation();
    const defaultRole = this.location.roles[this.location.roles.length-1];
    this.started = true;
    const playerArray = _.shuffle(this.players);
    let roles = _.shuffle(this.location.roles);
    playerArray.forEach((player, i) => {
      if (i === 0) {
        const role = { role: 'spy', location: '?' }
        player.role = role;
        return this.io.to(player.socketId).emit('role', role)
      }
      console.log(roles.length)
      const role = i-1 >= roles.length ? defaultRole : roles[i-1];
      const data = { role: role, location: this.location.name }
      this.io.to(player.socketId).emit('role', data);
    });
    this.io.to(this.code).emit('timer', { time: this.startTime });
    this.loop = setInterval(this.tick.bind(this), 1000);
  }

  endGame() {
    this.currentTime = 0;
    this.location = '';
    this.started = false;
    clearInterval(this.loop);
    this.io.to(this.code).emit('end')
  }

  tick() {
    if (this.currentTime === 0) {
      return clearInterval(this.loop);
    }
    if (this.paused) return;
    this.currentTime--;
    this.io.to(this.code).emit('timer', { time: this.currentTime });
  }
}

Room.rooms = [];


Room.findRoom = code => Room.rooms.find(room => room.code === code);

Room.closeRoom = code => Room.rooms = Room.rooms.filter(r => r.code !== code);

module.exports = Room;