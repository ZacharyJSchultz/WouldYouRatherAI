import { useEffect, useState } from 'react';

type questionInfo = {
  question: String,
  firstOptionCount: Number,
  secondOptionCount: Number
}

function WouldYouRather() {
  const [questions, setQuestions] = useState<questionInfo[]>();
  const [currQ, setCurrQ] = useState<questionInfo>({
    question: "", 
    firstOptionCount: 0, 
    secondOptionCount: 0
  });
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    // TODO
  }
  const useOldQuestion = () => {
    if(questions === undefined || questions.length === 0) {
      generateNewQuestion();
      return
    }

    let questionNumber = Math.floor(Math.random() * questions.length)
    setCurrQ(questions[questionNumber]);
  }

  // Get questions & question count from DB
  useEffect(() => {
    fetch('http://localhost:8080/get-questions')
    .then((res) => {
      if(!res.ok)
        throw new Error("Error: Response not ok");

      return res.json()
    })
    .then((data) => {
      setQuestions(data.response)
      setCount(data.count)
    })
    .catch((e) => console.error("Error getting questions:", e))
  });

  let rand = Math.random();

  // 70% generate new, 30% use old
  if(count < 10) {
    if(rand <= .7)
      generateNewQuestion();
    else
      useOldQuestion();
  }
  // 50/50
  else if(count < 30) {
    if(rand <= .5)
      generateNewQuestion();
    else
      useOldQuestion();
  }
  // 40/60
  else if(count < 50) {
    if(rand <= .4)
      generateNewQuestion();
    else
      useOldQuestion();
  }
  // 30/70
  else {
    if(rand <= .3)
      generateNewQuestion();
    else
      useOldQuestion();
  }

  return (
    <>
      <h1 className="game-title-text">Would You Rather</h1>
      <div>
        <button className="button game-button">{currQ.question}</button>
        {/* <p>Count: {count}</p> */}
        <button className="button game-button" style={{marginTop: "40vh"}}>{currQ.question}</button>
      </div>
    </>
  )
}

export default WouldYouRather
