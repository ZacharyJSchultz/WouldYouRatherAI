# WouldYouRatherAI

![Home Screen Screenshot](/screenshots/home_screen.png?raw=true)

A would-you-rather game that uses Generative AI to generate questions, and stores responses in a PostgreSQL database.

Link to Website:  ___

Author: [Zachary Schultz](https://www.linkedin.com/in/~zachary/) | zjs32@pitt.edu

## Description

This application uses Google's Gemini to generate questions, ___ to host the backend server, and Supabase to host the PostgreSQL database used to store previously used questions and responses.

The application switches between generating new questions and re-using old questions, depending on how many questions are currently stored in the database: if there are no questions, the application will always generate a new question. If there are few questions to choose from, then it's more likely to generate a new question. Likewise, to prevent the (free-hosted) database from overflowing with too many responses, as the number of responses increases, the chance of a new question being generated decreases. Once there are > 400 questions in the DB, it will cease to generate new questions (to avoid going over the free storage limit).

The website keeps track of a player's score, which represents the number of times the player agreed with the majority answer (for questions that had previous responses). Since the DB sometimes generates new questions -- and some previously generated questions might not have a response -- the score doesn't count questions without any previous responses.

## How to Use:

Simply click the link above and you're good to go!

Note: If you have any questions, or if the website isn't working, feel free to reach out and e-mail me! I believe the site might shut down after a certain amount of inactivity, so I'd be happy to restart it for anyone interested!

## Screenshots:

![Generated Question Screenshot](/screenshots/generated_question.png?raw=true)

![Generated Question Hover Animation Screenshot](/screenshots/generated_question_hover.png?raw=true)

![Results Screenshot](/screenshots/responses.png?raw=true)

