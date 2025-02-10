# WouldYouRatherAI

## Note: this project is currently offline! Feel free to view the website page, but the database and backend are not currently hosted.

![Home Screen Screenshot](/screenshots/home_screen.png?raw=true)

A would-you-rather game that uses Generative AI to generate questions, and stores responses in a PostgreSQL database.

Link to Website: https://zacharyjschultz.github.io/WouldYouRatherAI/

Author: [Zachary Schultz](https://www.linkedin.com/in/~zachary/) | zjs32@pitt.edu

## Credits

Favicon provided by Flaticon - https://www.flaticon.com/free-icons/letter-w

## Description

This application uses Google's Gemini to generate questions, Vercel to host the backend server, GitHub Pages to host the frontend website, and Supabase to host the PostgreSQL database used to store previously used questions and responses.

The application switches between generating new questions and re-using old questions, depending on how many questions are currently stored in the database: if there are no questions, the application will always generate a new question. If there are few questions to choose from, then it's more likely to generate a new question. Likewise, to prevent the (free-hosted) database from overflowing with too many responses, as the number of responses increases, the chance of a new question being generated decreases. Once there are > 400 questions in the DB, it will cease to generate new questions (to avoid going over the free storage limit).

The website keeps track of a player's score, which represents the number of times the player agreed with the majority answer (for questions that had previous responses). Since the DB sometimes generates new questions -- and some previously generated questions might not have a response -- the score doesn't count questions without any previous responses.

## How to Use:

Simply click the link above and you're good to go! 

After clicking play on the Home Screen, the game will provide 'Would You Rather' questions for you to answer. Simply click the question that suits your preference! Or if you'd like, try to guess where the majority opinion resides! The score at the top-left tells you exactly that: how many times your choice aligned with the prevailing opinion (for newly generated questions, or questions without any previous response data, they will not contribute to your score or total question count).

Note: If you have any questions, or if the website isn't working, feel free to reach out and e-mail me! I believe the database might shut down after a certain amount of inactivity, so I'd be happy to restart it for anyone interested!

## Screenshots:

![Generated Question Screenshot](/screenshots/generated_question.png?raw=true)

![Generated Question Hover Animation Screenshot](/screenshots/generated_question_hover.png?raw=true)

![Results Screenshot](/screenshots/responses.png?raw=true)

