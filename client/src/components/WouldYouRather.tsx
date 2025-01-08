import { useEffect, useState, useRef } from 'react';

type questionInfo = {
  firstOption: String,
  secondOption: String,
  firstOptionCount: Number,
  secondOptionCount: Number
}

function WouldYouRather() {
   // Only need re-rendering after loading or error, so useRef used instead
  const currQ = useRef<questionInfo>({
    firstOption: "", 
    secondOption: "",
    firstOptionCount: 0, 
    secondOptionCount: 0
  });
  const questions = useRef<questionInfo[]>([]);
  const [count, setCount] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isError, setIsError] = useState(false);
  const [displayResults, setDisplayResults] = useState(false);

  /* 
    Steps:
      1. Get count of entries in DB.
      2. If count < 10, 70/30 generate new to use old
         If count >= 10, 50/50
         If count >= 30, 40/60
         If count >= 50, 30/70
    If generating new message:
      3. Connect to OpenAI to generate message (use openai npm api. Look into this, I think I need a key)
        Prompt: Generate me a would you rather question with two different options, in the format: 'Would you rather ___, or ____'' 
                that is different from all of the questions listed below: [list of prev questions gotten from query]
      4. Display question, then add question to DB with user response after user chooses an option
    If not generating new message:
      3. Randomly select question (how to do this? See if postgres has a way, or if not maybe assign an arbitrary id/count to each question and select random # of it)
         Note: Should keep track of already asked questions when selecting, so no repeats
      4. Display question, then add 1 to whatever option user chooses


    For displaying question:
      - 'Would You Rather:' at the top
      - left side is a cool button with one option, right side is cool button with other option (buttons should be same?). Hovering should do cool shit
      - When a button is clicked, results are displayed (% and count). After 3 seconds, new question automatically displayed 
        (i.e., process runs in a loop. Would probably have to put in a useEffect?)
      - Maybe have a 'score' top right that shows how many times you agreed with majority? Only if the question already has an answer though
        E.g., 'You agreed with #/# questions (that had previous responses)'
  
  */

  const handleClick = (buttonNum: Number) => {
    console.log("UPDATE COUNT");
    fetch("http://localhost:8080/update-question-count", {
      method: "PATCH",
      body: JSON.stringify(buttonNum === 0 ? "firstoptioncount" : "secondoptioncount")
    })
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Update count response not okay");
      else
        console.log("Count successfully updated!");
    });

    setDisplayResults(true);

    // TODO: Actually display results (adding 1 to whatever selection user chooses on client side), then generate new question
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
      console.log(data)
      currQ.current = {
        firstOption: data.response.firstOption,
        secondOption: data.response.secondOption,
        firstOptionCount: data.response.firstOptionCount,
        secondOptionCount: data.response.secondOptionCount
      };
    })
    .catch((e) => {
      console.error("Error generating new question:", e);
      setIsError(true);
    })
    .finally(() => {console.log(count); setIsGenerating(count === -1)});  // If count is -1, then isGenerating should remain true, because there's an error somewhere
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

    setIsGenerating(count === -1);
  }

  // Used to handle loading. So no unstyled content flashes on the screen, loading isn't set to true until the page is fully loaded
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 200);   // See HomeScreen.tsx for more detailed explanation on why timeout is used -- it just works best
  });

  // Get questions & question count from DB
  useEffect(() => {
    if(displayResults)    // If displayResults is true, that means we are coming from a previous run. So we should wait to give time for players to view results
      async () => await new Promise(r => setTimeout(r, 3000));
    
    setIsGenerating(true);
    setIsError(false);
    setDisplayResults(false);
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
  }, [displayResults]);

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
     *    0 <= count < 10:    => 1 - 0.03 * count
     *    10 <= count < 50    => .8 - 0.01 * count
     *    count >= 50:        => 0.3
     * As examples:
     *    If count = 0, rand = 1
     *    If count = 5, rand = .85
     *    If count = 10, rand = .7
     *    If count = 30, rand = .5
     *    If count = 40, rand = .4
     * 
     * This is close enough to the above (which was decided pretty arbitrarily anyways) that I rolled with it.
     */

    let b = count < 10 ? 1 : .8;
    let m = count < 10 ? 0.03 : 0.01

    let threshold = Math.max(0.3, b - m * count);
    let rand = Math.random();

    if(rand <= threshold)
      generateNewQuestion();
    else
      useOldQuestion();
  }, [count]);

  return (
    <>
      {
        !isLoading && 
        <>
          <h1 className="game-text game-title-text">Would You Rather</h1>
          <p className="game-text game-author-text">Developed by <a href="https://www.linkedin.com/in/~zachary/" style={{textDecoration: "underline"}} target="_blank">Zach Schultz</a></p>
          <a href="https://github.com/ZacharyJSchultz/WouldYouRatherAI" className="game-text game-source-text" target="_blank">GitHub</a>
        </>
      }
      {
        isError ? <p className="container">Error!</p> : !isGenerating &&
        <div className="container">
          <button className="button game-button row" onClick={() => handleClick(0)}>{currQ.current.firstOption}</button>
          <button className="button game-button row" onClick={() => handleClick(1)} style={{marginTop: "40vh"}}>{currQ.current.secondOption}</button>
        </div>
      }
    </>
  )
}

export default WouldYouRather
