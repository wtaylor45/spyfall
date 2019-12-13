import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { Game } from './Game';
import { socket } from './socket';

const App = () => {
  const [info, setInfo] = useState({ name: '', roomCode: '', started: false });
  const [showRoom, setShowRoom] = useState(false);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => mainRef.current.focus(), [mainRef]);

  const requestGame = useCallback(
    (type, isHost, socketId, showErr = true) => {
      fetch(`/${type}`, {
        method: 'POST',
        body: JSON.stringify({
          room: info.roomCode, player: {
            id: localStorage.getItem('playerId'),
            isHost: isHost,
            name: info.name,
            socketId: socketId
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        },
      })
        .then(body => body.json())
        .then(response => {
          setDisabled(false);
          const msg = response.msg ? response.msg : '';
          if (response.status === 'failed') return errorHandler(msg, showErr);
          socket.emit('joined', { room: response.code, name: info.name })
          setInfo(i => ({ name: i.name, roomCode: response.code }));
          setShowRoom(response.status === 'success');
        })
        .catch((err) => {
          setDisabled(false);
          errorHandler(err, false)
        });
    },
    [setShowRoom, setInfo, info]
  );

  useEffect(() => {
    socket.on('connect', () => {
      const id = localStorage.getItem('playerId');
      if (id) requestGame('join', false, socket.id, false);
    })
  }, [requestGame]);

  const clickHandler = event => {
    event.preventDefault();
    setDisabled(true);
    if (info.name === '') {
      setDisabled(false);
      return setError('A name is required. Come up with something clever.');
    }
    setError('');
    const value = event.target.value;
    const host = value === 'create';
    requestGame(value, host, socket.id, true);
  }

  const errorHandler = (err, displayErr = true) => {
    if(displayErr) setError(err);
  }

  const formHandler = (event) => {
    let newInfo = info;
    newInfo[event.target.name] = event.target.value;
    setInfo(newInfo);
  }

  const onLeave = (room) => {
    setShowRoom(false);
    setInfo({ name: '', roomCode: '', started: false })
    socket.emit('leave', { room: room });
  };

  return (
    <div className="App">
      <h1 className="title">Spyfall</h1>
      {!showRoom &&
        <fieldset disabled={disabled}>
          <form className="start-form" onChange={formHandler}>
            <input
              className="input"
              type="text"
              name="name"
              placeholder="Enter a nickname"
              ref={mainRef}
              maxLength="12"
              autoComplete="off"
            />
            <input
              className="input"
              type="text"
              name="roomCode"
              placeholder="Enter a room code"
              maxLength="4"
              autoComplete="off"  
            />
            {error && (<strong className="error">{error}</strong>)}
            <div className="row" onClick={clickHandler}>
              <button className="button" value="join" disabled={disabled}>Join Game</button>
              <button className="button" value="create" disabled={disabled}>Create Game</button>
            </div>
          </form>
        </fieldset>
      }
      {showRoom && <Game code={info.roomCode} id={localStorage.getItem('playerId')} started={info.started} onLeave={onLeave}></Game>}
    </div>
  )
}

export default App;