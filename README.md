SW-MiniProject
Website link: https://miniproject.azurewebsites.net/

#### Mini Project summary

Our miniproject website has several functionalities, as listed as follows:
- Implements Twitter login
- Uses Google NLP API to analyze the sentiment of a Twitter user's followers, allowing our user to tell how negative or positive their followers are
- Uses OpenAI API to provide the user with reply suggestions to replies made on their posts

#### Installation:
Simple clone this repo

#### Dependencies
This web app is built using Node.js. So Node.js and NPM MUST be installed.
Being an app which uses the Twitter API, it will require a twitter API key, secret, and bearer token to be stored in 3 different environment variables.
These variables MUST be named as follows:
- TWITTER_API_KEY
- TWITTER_API_SECRET
- TWITTER_BEARER_TOEKN

After cloning the repo, run the following command:
	npm install

#### Running
To run the application, run:
	npm start

	
