import io from 'socket.io-client';

export const socket = io('http://localhost:3001');

export const subscribeToUserUpdate = (cb) => {
  socket.on('user update', (data) => {
    cb(data)
  });
}

export const subscribeToTimer = (cb) => {
  socket.on('time', (data) => {
    cb(data);
  });
}

export const subscribeToGeneric = (event, cb) => {
  socket.on(event, cb);
}


