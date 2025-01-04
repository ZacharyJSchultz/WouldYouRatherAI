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

  const generateNewQuestion = () => {
    fetch("http://localhost:8080/generate-question")
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Generate question response not okay");

      return res.json();
    })
    .then((data) => {
      currQ.current = {
        firstOption: data.firstOption,
        secondOption: data.secondOption,
        firstOptionCount: data.firstOptionCount,
        secondOptionCount: data.secondOptionCount
      };
    })
    .catch((e) => console.error("Error generating new question:", e))
    .finally(() => setIsGenerating(false));
  }
  const useOldQuestion = () => {
    if(questions === undefined || questions.current.length === 0) {
      generateNewQuestion();
      return
    }

    let questionNumber = Math.floor(Math.random() * questions.current.length)
    console.log(questions.current[questionNumber]);
    currQ.current = questions.current[questionNumber];

    setIsGenerating(false);
  }

  // Used to handle loading. So no unstyled content flashes on the screen, loading isn't set to true until the page is fully loaded
  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);    // Unhide content after loading
    };

    window.addEventListener('load', handleLoad);

    // Clean up listener after loading
    return () => window.removeEventListener('load', handleLoad);
  }, []);  

  // Get questions & question count from DB
  useEffect(() => {
    setIsGenerating(true);
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
    .catch((e) => console.error("Error getting questions:", e));
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
          <p className="game-text game-author-text">Developed by <a href="https://www.linkedin.com/in/~zachary/" style={{textDecoration: "underline"}}>Zach Schultz</a></p>
          <a href="https://github.com/ZacharyJSchultz/WouldYouRatherAI" className="game-text game-source-text">GitHub</a>
        </>
      }
      {
        count === -1 ? <p>Error!</p> : !isGenerating &&
        <div>
          <button className="button game-button">{currQ.current.firstOption}</button>
          <button className="button game-button" style={{marginTop: "40vh"}}>{currQ.current.secondOption}</button>
        </div>
      }
    </>
  )
}

export default WouldYouRather
