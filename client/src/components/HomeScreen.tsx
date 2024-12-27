import '../App.css';
import { Link } from 'react-router-dom';

function HomeScreen({ con } : {con: boolean}) {

  return (
    <>
      <h1 className="title-text">Would You Rather</h1>
      <Link to="/would-you-rather">     {/* Could also use useNavigate() instead, but Link works just as well */}
        <button className="play-button">Play!</button>
      </Link>
      <p style={{marginTop: "20px"}}>{con ? "Connected to server!" : "Not connected to server! Refresh to try again!"}</p>
    </>
  )
}

export default HomeScreen
