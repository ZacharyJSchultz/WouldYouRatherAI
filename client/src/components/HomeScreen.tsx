import '../App.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  // Used to handle loading. So no unstyled content flashes on the screen, loading isn't set to true until the page is fully loaded
  useEffect(() => {
    // Tried to do lots of cool loading stuff with a variable from App.tsx, but although it sort of worked, it ended up glitching out a bit.
    // Thus, I went with the tried-and-true solution of just adding a delay after every render, which accomplishes the same thing but it consistently works.

    /* If it's the first time loading, use the listener (doesn't work on back button, however). If it's second time loading, can just set to false
    /if(firstTime) {
      window.addEventListener('load', handleLoad);

      setFirstTime(false);

      // Clean up listener after loading
      return () => window.removeEventListener('load', handleLoad);
    }
    else
      setIsLoading(false);*/

    setTimeout(() => setIsLoading(false), 100);
  }); 

  return (
    <>
      {
        !isLoading && 
        <div className="container">
          <h1 className="title-text row">Would You Rather</h1>
          <Link className="row" to="/would-you-rather">     {/* Could also use useNavigate() instead, but Link works just as well */}
            <button className="button play-button">Play!</button>
          </Link>
        </div>
      }
    </>
  )
}

export default HomeScreen
