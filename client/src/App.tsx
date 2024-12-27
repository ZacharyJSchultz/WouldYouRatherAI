import { useState, useEffect } from 'react';
import './App.css';
import HomeScreen from './components/HomeScreen';
import WouldYouRather from './components/WouldYouRather';
import { Location, useLocation } from 'react-router-dom';

function App() {
  const loc: Location = useLocation();
  const [connected, setConnected] = useState(false);

  // As of now, DB needs to be hosted on localhost..
  useEffect(() => {
    fetch('http://localhost:8000/message')
    .then((res) => res.json())
    .then((conStatus) => console.log(conStatus.ok))
  }, [])

  var currScreen: JSX.Element;

  if(loc.pathname.endsWith('would-you-rather')) {
    currScreen = <WouldYouRather />
  }
  else {
    currScreen = <HomeScreen con={connected}/>
  }

  return (
    <>
    {currScreen}
    </>
  )
}

export default App
