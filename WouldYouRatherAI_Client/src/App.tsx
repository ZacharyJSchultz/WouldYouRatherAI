import React, { useState } from 'react'
import './App.css'

function App() {
  const [connected, setConnected] = useState(false);

  return (
    <>
      <h1 className="title-text">Would You Rather</h1>
      <button className="play-button">Play!</button>
      <p style={{marginTop: "20px"}}>{connected ? "Connected to server!" : "Not connected to server! Refresh to try again!"}</p>
    </>
  )
}

export default App
