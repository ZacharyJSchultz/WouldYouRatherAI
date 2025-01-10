import { useEffect, useState, useRef } from 'react';

type questionInfo = {
  firstoption: string,
  secondoption: string,
  firstoptioncount: number,
  secondoptioncount: number
}

function WouldYouRather() {
   // Only need re-rendering after loading or error, so useRef used instead
  const currQ = useRef<questionInfo>({
    firstoption: "", 
    secondoption: "",
    firstoptioncount: 0, 
    secondoptioncount: 0
  });
  const questions = useRef<questionInfo[]>([]);
  const score = useRef(0);
  const numQs = useRef(0);    // Used for showing users total Qs they've guessed correctly
  const [count, setCount] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isError, setIsError] = useState(false);
  const [displayResults, setDisplayResults] = useState(false);

  /* 
    Steps:
      1. Get count of entries in DB.
      2. Choose whether to generate new or use old question (favor generation if low question number, favor re-use if high question number)
    If generating new message:
      3. Connect to Gemini to generate message (using google gemini npm api)
        Prompt (not exact): Generate a would you rather question with two different options, in the format: 'Would you rather ___, or ____'' 
                that is different from all of the questions listed below: [list of prev questions gotten from query]
      4. Display question, then add question to DB with user response after user chooses an option
    If not generating new message:
      3. Randomly select question. Note: Should keep track of already asked questions when selecting, so no repeats
      4. Display question, then add 1 to whatever option user chooses. Then send this back to DB
  */

  const delay = async () => await new Promise(r => setTimeout(r, 2500));

  const calculatePercent = (buttonNum: Number) => {
    let totalResponses = currQ.current.firstoptioncount + currQ.current.secondoptioncount;

    if(buttonNum === 0)   // Return first option count
      return (currQ.current.firstoptioncount * 100.0 / totalResponses).toFixed(2);
    else    // Return second option count
      return (currQ.current.secondoptioncount * 100.0 / totalResponses).toFixed(2);
  }

  // ButtonNum represents what button user clicked. 0 = first option, 1 = second option
  const handleClick = async (buttonNum: Number) => {
    // If the question has no previous answers, skip incrementing score & question count
    if(currQ.current.firstoptioncount !== 0 || currQ.current.secondoptioncount !== 0) {
      // If user selected more popular option, increment score
      if((currQ.current.firstoptioncount >= currQ.current.secondoptioncount && buttonNum === 0) || 
        (currQ.current.secondoptioncount >= currQ.current.firstoptioncount && buttonNum === 1))
        score.current += 1;

      // Increment count of total questions user has answered
      numQs.current+=1;
    }

    if(buttonNum === 0)
      currQ.current.firstoptioncount += 1;
    else
      currQ.current.secondoptioncount += 1;

    await fetch("http://localhost:8080/update-question-count", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(currQ.current),
    })
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Update count response not okay");
      else
        console.log("Count successfully updated!");
    });

    setDisplayResults(true);
  }

  const generateNewQuestion = () => {
    console.log("GENERATE NEW");
    fetch("http://localhost:8080/generate-question")
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Generate question response not okay");

      return res.json();
    })
    .then((data) => {
      currQ.current = {
        firstoption: data.response.firstoption,
        secondoption: data.response.secondoption,
        firstoptioncount: data.response.firstoptioncount,
        secondoptioncount: data.response.secondoptioncount
      };
    })
    .catch((e) => {
      console.error("Error generating new question:", e);
      setIsError(true);
    })
    .finally(() => {setIsGenerating(count === -1)});  // If count is -1, then isGenerating should remain true, because there's an error somewhere
  }

  const useOldQuestion = () => {
    console.log("USE OLD");
    if(questions === undefined || questions.current.length === 0) {
      generateNewQuestion();
      return
    }

    let questionNumber = Math.floor(Math.random() * questions.current.length)
    console.log(questions.current[questionNumber]);
    currQ.current = questions.current[questionNumber];

    // Remove question from array (because we're using it, and don't want to repeat it anytime soon)
    questions.current.splice(questionNumber, 1)

    setIsGenerating(count === -1);
  }

  // Used to handle loading. So no unstyled content flashes on the screen, loading isn't set to true until the page is fully loaded
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 300);   // See HomeScreen.tsx for more detailed explanation on why timeout is used -- it just works best
  }, []);

  // Get questions & question count from DB. Runs once at page load
  useEffect(() => {
    console.log("Fetching questions & question count...")

    fetch('http://localhost:8080/get-questions')
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Get questions response not ok");

      return res.json()
    })
    .then((data) => {
      questions.current = data.response;
      setCount(data.count);
    })
    .catch((e) => {
      console.error("Error getting questions:", e);
      setIsError(true);
    })
  }, []);

  /* Random / Question selection logic. Ratios for generating new vs using old should look something like this:
   *    If count < 10, 70/30 generate new to use old
   *    If count >= 10, 50/50
   *    If count >= 30, 40/60
   *    If count >= 50, 30/70
   * Basically, as the count increases, the chance a new question is generated should drastically decrease
   */
  useEffect(() => {
    /* Could have done this with a bunch of nested if/else statements, but instead I use a really cool 
     * piecewise function to accomplish the same thing but cleaner and faster. The function is as follows:
     *    0 <= count < 10    => 1 - 0.03 * count
     *    10 <= count < 50   => .8 - 0.01 * count
     *    50 <= count < 200  => 0.3
     *    count >= 400:      => 0 (always use old question, to prevent DB overflow)
     *    
     * As examples:
     *    If count = 0, rand = 1
     *    If count = 5, rand = .85
     *    If count = 10, rand = .7
     *    If count = 30, rand = .5
     *    If count = 40, rand = .4
     * 
     * This is close enough to the above (which was decided pretty arbitrarily anyways) that I rolled with it.
     */
    const getNewQuestion = async () => {
      console.log("Choosing / generating question to display...")

      if(displayResults) {    // If displayResults is true, that means we are coming from a previous run. So we should wait to give time for players to view results
        await delay();
        console.log("No longer displaying results...");
        setIsGenerating(true);
        setDisplayResults(false);
      }

      if(count === -1) {
        console.log("Count =/= -1, returning...")
        return;
      }
      else if(count >= 400) {
        useOldQuestion();
      }
      else {
        let b = count < 10 ? 1 : .8;
        let m = count < 10 ? 0.03 : 0.01

        let threshold = Math.max(0.3, b - m * count);
        let rand = Math.random();

        if(rand <= threshold)
          generateNewQuestion();
        else
          useOldQuestion();
      }
    }

    getNewQuestion();
  }, [count, displayResults]);

  return (
    <>
      {
        !isLoading && 
        <>
          <p className="score-text">
            <span style={{fontSize:"5vmin"}}>{score.current}/{numQs.current}</span>
            <span> agreed with majority!</span>
          </p>
          <p className="score-text score-disclaimer">(not counting newly generated questions)</p>
          <h1 className="game-text game-title-text">Would You Rather</h1>
          <p className="game-text game-author-text">Developed by <a href="https://www.linkedin.com/in/~zachary/" style={{textDecoration: "underline"}} target="_blank">Zach Schultz</a></p>
          <a href="https://github.com/ZacharyJSchultz/WouldYouRatherAI" className="game-text game-source-text" target="_blank">GitHub</a>
        </>
      }
      {
        displayResults && 
        <>
          <div className="container results">
            <h1 className="row">{calculatePercent(0)}%</h1>
            <h2 className="row">{currQ.current.firstoptioncount} responses!</h2>
            <h1 className="row" style={{marginTop: "40vh"}}>{calculatePercent(1)}%</h1>
            <h2 className="row">{currQ.current.secondoptioncount} responses!</h2>
          </div>
        </>
      }
      {
        isError ? <h1 className="container game-title-text">Error! Please refresh to try again!</h1> : (!isGenerating && !displayResults) &&
        <div className="container">
          <button className="button game-button row" onClick={() => handleClick(0)}>{currQ.current.firstoption}</button>
          <button className="button game-button row" onClick={() => handleClick(1)} style={{marginTop: "40vh"}}>{currQ.current.secondoption}</button>
        </div>
      }
    </>
  )
}

export default WouldYouRather
