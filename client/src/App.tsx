import './App.css';
import HomeScreen from './components/HomeScreen';
import WouldYouRather from './components/WouldYouRather';
import { Location, useLocation } from 'react-router-dom';

function App() {
  const loc: Location = useLocation();

  var currScreen: JSX.Element;

  if(loc.pathname.endsWith('would-you-rather')) {
    currScreen = <WouldYouRather />
  }
  else {
    currScreen = <HomeScreen />
  }

  return (
    <>
    {currScreen}
    </>
  )
}

export default App
