from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import defaultdict

# --- INITIALIZATION ---

# Initialize Flask app and CORS
app = Flask(__name__)
# Allow requests from our frontend development server
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# This is a small model, rather than an LLM that's hosted online
# good for privacy concerns
nlp = spacy.load("en_core_web_sm")

analyzer = SentimentIntensityAnalyzer()



# --- API ENDPOINT ---

@app.route('/api/analyze', methods=['POST'])
def analyze_entries():
    """
    Analyzes a list of journal entries to find recurring negative themes.
    """
    # 1. PARSE THE REQUEST
    data = request.get_json()
    if not data or 'entries' not in data:
        return jsonify({"error": "Invalid request body. 'entries' key is required."}), 400

    entries = data['entries']
    if not isinstance(entries, list):
        return jsonify({"error": "'entries' must be a list."}), 400

    # 2. AGGREGATE DATA FROM ENTRIES
    # stors lists of sentiment scores for each entity
    entity_sentiments = defaultdict(list)


    print("\n--- PROCESSING ENTRIES ---") # debug
    for entry in entries:
        text = entry.get('content', '')
        
        # Get overall sentiment for the entry
        sentiment_score = analyzer.polarity_scores(text)['compound']
        
        # Use spaCy to find named entities -> people, places, organizations
        doc = nlp(text)
        
        # debug
        found_entities = [(ent.text, ent.label_) for ent in doc.ents if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT', 'WORK_OF_ART']]
        print(f"Entry: \"{text[:40]}...\" | Found Entities: {found_entities}") 

        for ent in doc.ents:
            # We care about common nouns/topics specifically -> defined here
            if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT', 'WORK_OF_ART']:
                # Store the sentiment score for each occurrence of an entity
                entity_sentiments[ent.text.lower()].append(sentiment_score)
    print(f"\n--- AGGREGATED SENTIMENTS ---\n{dict(entity_sentiments)}\n") # debug
    # 3. APPLY THE RULES-BASED SYSTEM
    
    # RULE 1: Find a "Thought Loop" / recurring topic with consistently negative sentiment
    for entity, scores in entity_sentiments.items():
        # Condition 1: The topic must appear frequently (3ish times for right now)
        # Condition 2: The average sentiment must be really negative based on its score above
        if len(scores) >= 3 and (sum(scores) / len(scores)) < -0.3:
            
            # PATTERN DETECTED 
            # Use a "hard coded" template to generate a "empathetic" non-judgmental prompt
            # NEED TO WORK ON THIS! -> 
            suggestion_text = (
                f"I've noticed that '{entity.title()}' has come up a few times recently "
                f"in a challenging context. Perhaps we could explore that a bit more. "
                f"What is one specific part of this situation that feels most difficult right now?"
            )
            
            return jsonify({
                "suggestion": {
                    "type": "thought_loop_detected",
                    "text": suggestion_text
                }
            })

    # 4. RETURN NO SUGGESTION IF NO PATTERNS ARE FOUND
    return jsonify({"suggestion": None})


if __name__ == '__main__':
    # port 5001 -> need a unique port that doesn't mess with anything else running
    app.run(debug=True, port=5001)