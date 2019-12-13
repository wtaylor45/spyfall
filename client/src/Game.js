import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToUserUpdate, subscribeToGeneric } from './socket';
import './Game.css';

export const Game = (props) => {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [started, setStarted] = useState(props.started || false);
  const [time, setTime] = useState(0);
  const [role, setRole] = useState({ role: '', location: '' });
  const [showRole, setShowRole] = useState(false);

  const getUsers = useCallback(
    (data) => {
      if (data.code !== props.code) return;
      fetch(`/game/users/?c=${props.code}`)
        .then(res => res.json())
        .then(body => {
          if (!body || body.status === 'failed') return;
          setUsers(body.data)
        })
      },
      [props.code]
    );

  useEffect(() => {
    let isSubscribed = true;
    subscribeToGeneric('timer', (data) => setTime(data.time));
    subscribeToGeneric('started', () => setStarted(true));
    subscribeToGeneric('end', () => setStarted(false));
    subscribeToGeneric('role', data => {
      setRole({ location: data.location, role: data.role });
    });
    subscribeToUserUpdate(getUsers);
    fetch('/game/locations')
      .then(body => {
        if (isSubscribed) return body.json();
      })
      .then(response => setLocations(response.locations.map(loc => loc.name)))
      .catch(err => console.error(err));
  
    return () => isSubscribed = false;
  }, [getUsers]);

  useEffect(() => {
    let isSubscribed = true;
    if (!props.code) return;
    fetch(`/game/update/?c=${props.code}&p=${props.id}`)
      .then(res => {
        if (isSubscribed) return res.json()
      })
      .then(response => {
        if (!response || response.status === 'failed') return;
        console.log(response)
        const data = response.data;
        setStarted(data.started);
        setTime(data.time);
        setUsers(data.players);
        setRole(data.role || {});
      });
    return () => isSubscribed = false;
  }, [props.code, props.id]);

  const leaveGame = (e) => {
    fetch(`/leave/?c=${props.code}&p=${props.id}`);
    if(props.onLeave) props.onLeave(props.code);
  }

  const startGame = () => {
    fetch(`/game/start/?c=${props.code}`);
  }

  const endGame = () => {
    setStarted(false);
    fetch(`/game/end/?c=${props.code}`);
  }

  const convertTime = (time) => {
    if (time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    let seconds = time % 60 || '00';
    if (seconds.toString().length === 1) seconds = '0' + seconds;
    return minutes + ':' + seconds;
  };

  const toggleShowRole = () => {
    setShowRole(!showRole);
  }

  const confidential = {
    color: 'red',
    textDecoration: 'underline'
  }

  return (
    <div className="game">
      <h3 className="code">{props.code}</h3>
      <button
        className="show-role"
        onClick={toggleShowRole}
        disabled={!started}
      >
        {showRole ? 'Hide' : 'Show'} role
      </button>
      {started && showRole && (
        <div className="role-info">
          <div style={confidential}>Confidential</div>
          <div>Location: {role.location}</div>
          <div>Role: {role.role}</div>
        </div>
      )}
      <h4 className="list-label">Players</h4>
      <ul className="list">
        {users.map((user, i) => (<li key={i}>{user.name}</li>))}
      </ul>
      <h4 className="list-label">Locations</h4>
      <ul className="list long">
        {locations.map((loc, i) => (<li key={i}>{loc}</li>))}
      </ul>
      {!started &&
        <>
          <button className="start" onClick={startGame}>Start Game</button>
          <button className="leave" onClick={leaveGame}>Leave Room</button>
        </>
      }
      {started && (
        <div className="game-info">
          <div className="timer">{convertTime(time)}</div>
          <button className="end-game" onClick={endGame} >End Game</button>
        </div>
      )}
    </div>
  )
};
