from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import defaultdict

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
nlp = spacy.load("en_core_web_sm")
analyzer = SentimentIntensityAnalyzer()

# --- API ENDPOINT ---
@app.route('/api/analyze', methods=['POST'])
def analyze_entries():
    data = request.get_json()
    if not data or 'entries' not in data:
        return jsonify({"error": "Invalid request body. 'entries' key is required."}), 400

    entries = data['entries']
    if not isinstance(entries, list):
        return jsonify({"error": "'entries' must be a list."}), 400

    topic_sentiments = defaultdict(list)

    print("\n--- PROCESSING ENTRIES ---") # debug

    for entry in entries:
        text = entry.get('content', '')
        sentiment_score = analyzer.polarity_scores(text)['compound']
        doc = nlp(text)

        topics_found = []
        # Extract noun phrases
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) > 1 or chunk.root.pos_ not in ['PRON']:
                topics_found.append(chunk.root.text.lower())
        
        # Extract named entities
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'GPE']:
                topics_found.append(ent.text.lower())
        
        unique_topics = list(set(topics_found))

        print(f"Entry: \"{text[:45]}...\"") # debug
        print(f"  -> Noun Chunks Roots Found: {[chunk.root.text.lower() for chunk in doc.noun_chunks if len(chunk.text.split()) > 1 or chunk.root.pos_ not in ['PRON']]}") # debug
        print(f"  -> Entities Found: {[ent.text.lower() for ent in doc.ents if ent.label_ in ['PERSON', 'ORG', 'GPE']]}") # debug
        print(f"  -> Final Unique Topics for this Entry: {unique_topics}\n") # debug
        
        for topic in unique_topics:
            topic_sentiments[topic].append(sentiment_score)

    print(f"--- AGGREGATED TOPIC SENTIMENTS ---\n{dict(topic_sentiments)}\n") # debug

    # --- APPLY THE RULES-BASED SYSTEM ---
    for topic, scores in topic_sentiments.items():
        # IMPORTANT -> THRESHOLD DICTATES SENTIMENT SENSITIVITY AND IS CURRENTLY HARDCODED
        if len(scores) >= 3 and (sum(scores) / len(scores)) < -0.25:
            suggestion_text = (
                f"I've noticed the topic of '{topic.title()}' has come up a few times recently "
                f"in a challenging context. Perhaps we could explore that a bit more. "
                f"What is one specific part of this that feels most difficult right now?"
            )
            return jsonify({
                "suggestion": {
                    "type": "thought_loop_detected",
                    "text": suggestion_text
                }
            })

    return jsonify({"suggestion": None})

if __name__ == '__main__':
    app.run(debug=True, port=5001)