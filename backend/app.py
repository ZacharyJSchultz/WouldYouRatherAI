from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai
import os, sys, json


# TODO: Host on vercel

load_dotenv()

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'     # Allow Content-Type CORS requests
cors = CORS(app)                                # Allow all CORS requests (any route, from anywhere)

# If I wanted to only allow requests from a specific origin, or only of a specific route (route is basically end of URL), can use below:
# cors = CORS(app, resources={r"{insert}": {"origins":"{insert}"}}, replacing the {insert}s with what you want to allow. 
# i.e., if you wanted to only allow requests starting with /api from localhost at ports 3000 & 5173:
# cors = CORS(app, resources={r"/api": {"origins": ["http://localhost:3000", "http://localhost:5173"]}}



# Specifies that any connection with route /get-count will cause this function to run (only allowing GET requests)
@app.route('/get-questions', methods=['GET'])
#@cross_origin(origin="*", headers=['Content-Type', 'Authorization'])
def getQuestions():
    try:
        resp = client.table('questions').select('*', count='exact', head=False).execute()
        code = 500 if resp is None else 200

        # Store questions for generate questions prompt
        global questions
        questions = resp.data

        return {'code': code, 'count': resp.count, 'response': resp.data}
    except:
        print("Error returning questions!")
        return {'code': 500, 'count': -1, 'response': None}
    
# This function will use OpenAI's API to generate a new question, returning the question and updating the DB
@app.route('/generate-question', methods=['GET'])
def generateQuestion():
    try:
        genString = ""
        if(len(questions) != 0):
            questionsStr = map(lambda q: "Would you rather " + q.firstOption + " or " + q.secondOption, questions)
            genString = " The question must be different from these previous questions: " + questionsStr

        resp = model.generate_content("Please generate a Would You Rather question in the following format: ___ or ___." + genString)

        code = 500 if (resp is None or resp.candidates is None or len(resp.candidates) == 0) else 200
        return {'code': code, 'response': resp.candidates[0].content}
    except:
        return {'code': 500, 'response': None}

# This function is for updating the responses to the questions, depending on what the user selects
@app.route('/update-question-count', methods=['GET'])
def updateQuestionCount():
    pass

if(__name__ == '__main__'):
    client: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_API_KEY"))

    # Set up gemini
    genai.configure(api_key=os.getenv["GEMINI_API_KEY"])
    model = genai.GenerativeModel('gemini-1.5-flash')

    # If client connection fails, throw error and exit
    if client is None:
        raise Exception("Error! Failed to connect to database!")
        sys.exit(1)
    
    print("Running on port 8080...")
    app.run(port=8080)



