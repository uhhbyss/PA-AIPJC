from flask import Flask

# Initialize the Flask application
app = Flask(__name__)

# Define a simple route to make sure the server is running
@app.route('/')
def index():
    return "Backend server is running!"

# This allows you to run the app directly from the command line
if __name__ == '__main__':
    app.run(debug=True)