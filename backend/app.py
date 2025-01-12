from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai
import os, sys, json



load_dotenv()

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'     # Allow Content-Type CORS requests
cors = CORS(app)                                # Allow all CORS requests (any route, from anywhere)

# If I wanted to only allow requests from a specific origin, or only of a specific route (route is basically end of URL), can use below:
# cors = CORS(app, resources={r"{insert}": {"origins":"{insert}"}}, replacing the {insert}s with what you want to allow. 
# i.e., if you wanted to only allow requests starting with /api from localhost at ports 3000 & 5173:
# cors = CORS(app, resources={r"/api": {"origins": ["http://localhost:3000", "http://localhost:5173"]}}

client: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_API_KEY"))

# Set up gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# If client connection fails, throw error and exit
if client is None:
    raise Exception("Error! Failed to connect to database!")
    sys.exit(1)

print("Flask is up and running!")



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
    except Exception as e:
        print("Error returning questions: ", e)
        return {'code': 500, 'count': -1, 'response': None}
    
# This function will use OpenAI's API to generate a new question, returning the question and updating the DB
@app.route('/generate-question', methods=['GET'])
def generateQuestion():
    # If there is an error, then the while loop will run again and question generation will be attempted up to three times
    count = 0
    while count <= 2:
        try:
            print("Attempting question generation...")
            prevStrs = ""
            if(len(questions) != 0):
                prevStrs = " The choices must be different from the choices in these previous questions: " + "".join(map(lambda q: "\nWould you rather " + q['firstoption'] + " or " + q['secondoption'], questions))

            print("Prompt: Please generate a Would You Rather question in this exact format: '~[choice1], ~[choice2]' Only use two tildas, one before the first choice and one before the second!" + prevStrs + "\n")
            resp = model.generate_content("Please generate a Would You Rather question in this exact format: '~[choice1], ~[choice2]' Only use two tildas, one before the first choice and one before the second!" + prevStrs)

            # Send back 500 if server error, else 200 for success
            code = 500 if (resp is None or resp.candidates is None or len(resp.candidates) == 0) else 200

            # Generate response as substring of generated text (from after the word 'rather' to the end of the text at \n)
            respToSend = None
            if resp is not None:
                text = resp.candidates[0].content.parts[0].text
                print(text)
                tildaIndex = text.rindex('~')
                respToSend = {
                    'firstoption': text[1: tildaIndex-2],                       # First option bounds
                    'secondoption': text[tildaIndex+1:len(text)-1].rstrip(),    # Second option bounds (removing period and newline at end of generation)
                    'firstoptioncount': 0,
                    'secondoptioncount': 0
                }
                # Add new Q to Supabase
                client.table('questions').insert(respToSend).execute()

            return {'code': code, 'response': respToSend}
        except Exception as e:
            print("Error generating question: ", e)

            # If 3 generation attempts have happened and all failed, return None. Else, try again
            if count >= 2:
                return {'code': 500, 'response': None}
            else:
                count += 1

# This function is for updating the responses to the questions, depending on what the user selects
@app.route('/update-question-count', methods=['PATCH'])
def updateQuestionCount():
    try:
        data = request.json
        client.table('questions').update({'firstoptioncount': data['firstoptioncount'], 'secondoptioncount': data['secondoptioncount']}).eq('firstoption', data['firstoption']).eq('secondoption', data['secondoption']).execute()
        return {'code': 200}
    except Exception as e:
        print("Error updating question count: ", e)
        return {'code': 500}



if(__name__ == '__main__'):    
    print("Running on port 8080...")
    app.run(port=8080)



