from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import defaultdict
import random

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
nlp = spacy.load("en_core_web_sm")
analyzer = SentimentIntensityAnalyzer()

# --- CATEGORIZED TEMPLATE POOL ---
# Generated with LLMs online and validated by a human (me :) )
TEMPLATES = {
    "reframing": [
        "I've noticed '{topic}' has appeared a few times. Is there another way to look at this situation?",
        "It seems '{topic}' is a recurring theme. What's one thing about this that might be within your control?",
        "You've mentioned '{topic}' several times. If you were advising a friend on this, what would you suggest?"
    ],
    "emotional_exploration": [
        "The topic of '{topic}' seems to carry a heavy weight. What specific emotion comes to mind when you think about it?",
        "Thank you for sharing about '{topic}'. Let's sit with that for a moment. What does this feeling physically feel like in your body?",
        "It sounds like there's a lot happening with '{topic}'. Can you describe the primary feeling in just one word?"
    ],
    "action_oriented": [
        "You've written about '{topic}' consistently. What is one small, tangible step you could take to address this?",
        "It seems like '{topic}' is a persistent challenge. What would the 'easiest' next step look like, no matter how small?",
        "I hear the frustration around '{topic}'. If you had a magic wand, what's the first tiny change you would make?"
    ]
}



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
            category = random.choice(list(TEMPLATES.keys()))
            template = random.choice(TEMPLATES[category])
            suggestion_text = template.format(topic=topic.title())

            return jsonify({
                "suggestion": {
                    "type": f"{category}_prompt", # The type is now dynamic
                    "text": suggestion_text
                }
            })

    return jsonify({"suggestion": None})

if __name__ == '__main__':
    app.run(debug=True, port=5001)