import '../App.css';
import { Link } from 'react-router-dom';

function HomeScreen() {

  return (
    <>
      <h1 className="title-text">Would You Rather</h1>
      <Link to="/would-you-rather">     {/* Could also use useNavigate() instead, but Link works just as well */}
        <button className="button play-button">Play!</button>
      </Link>
    </>
  )
}

export default HomeScreen
