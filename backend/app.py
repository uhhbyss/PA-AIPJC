from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import defaultdict
import random
import os

# --- NEW: Imports for Google AI ---
import google.generativeai as genai
from dotenv import load_dotenv

# --- INITIALIZATION ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
nlp = spacy.load("en_core_web_sm")
analyzer = SentimentIntensityAnalyzer()

google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    genai.configure(api_key=google_api_key)

TEMPLATES = {
    "reframing": [
        "I've noticed '{topic}' has appeared a few times. Is there another way to look at this situation?",
        "It seems '{topic}' is a recurring theme. What's one thing about this that might be within your control?",
        "You've mentioned '{topic}' several times. If you were advising a friend on this, what would you suggest?"
    ],
    "emotional_exploration": [
        "The topic of '{topic}' seems to carry a heavy weight. What specific emotion comes to mind when you think about it?",
        "Let's sit with that for a moment. What does this feeling physically feel like in your body?",
        "It sounds like there's a lot happening with '{topic}'. Can you describe the primary feeling in just one word?"
    ],
    "action_oriented": [
        "You've written about '{topic}' consistently. What is one small, tangible step you could take to address this?",
        "It seems like '{topic}' is a persistent challenge. What would the 'easiest' next step look like, no matter how small?",
        "I hear the frustration around '{topic}'. If you had a magic wand, what's the first tiny change you would make?"
    ]
}


# --- PII Redaction Helper ---
def extract_features(text):
    doc = nlp(text)
    redacted_text = text
    pii_entities = ["PERSON", "GPE", "LOC", "ORG", "DATE", "TIME"]
    for ent in reversed(doc.ents):
        if ent.label_ in pii_entities:
            redacted_text = redacted_text[:ent.start_char] + f"[{ent.label_}]" + redacted_text[ent.end_char:]
    keywords = [token.lemma_ for token in doc if not token.is_stop and token.pos_ in ["NOUN", "ADJ"]]
    return {"redacted_text": redacted_text, "keywords": list(set(keywords))[:5]}


# --- Helper to call the Google Gemini LLM ---
def get_cloud_suggestion(topic, combined_features):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        prompt = (
            f"You are an empathetic, insightful journaling companion. You never give clinical advice. "
            f"A user is journaling about a recurring negative topic: '{topic}'.\n\n"
            f"Here is a summary of their recent writing on this topic (all personal information has been redacted):\n"
            f"\"{combined_features}\"\n\n"
            f"Based on this, write one gentle, relatively short, open-ended question that encourages deeper reflection. "
            f"The question should be insightful, non-judgmental, and feel like it comes from a wise, caring friend. "
            # f"Your focus should be to guide the user to connect commonalities and themes in their behavior / mindset on their own, with the ultimate goal of resolving these recurring topics"
            f"Do not be generic. Make it relevant to the provided summary. Only return the question itself."
        )

        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Google AI: {e}")
        return None


# --- API ENDPOINT ---
@app.route('/api/analyze', methods=['POST'])
def analyze_entries():
    data = request.get_json()
    entries = data.get('entries', [])
    use_cloud_ai = data.get('useCloudAI', False)
    
    topic_sentiments_scores = defaultdict(list)
    topic_texts = defaultdict(list)
    for entry in entries:
        text = entry.get('content', '')
        sentiment_score = analyzer.polarity_scores(text)['compound']
        doc = nlp(text)
        topics_found = []
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) > 1 or chunk.root.pos_ not in ['PRON']:
                topics_found.append(chunk.root.text.lower())
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'GPE']:
                topics_found.append(ent.text.lower())
        for topic in set(topics_found):
            topic_sentiments_scores[topic].append(sentiment_score)
            topic_texts[topic].append(text)

    for topic, scores in topic_sentiments_scores.items():
        if len(scores) >= 3 and (sum(scores) / len(scores)) < -0.25:
            
            if use_cloud_ai and google_api_key:
                combined_text = " ".join(topic_texts[topic])
                features = extract_features(combined_text)
                suggestion_text = get_cloud_suggestion(topic, features["redacted_text"])
                
                if not suggestion_text:
                    use_cloud_ai = False
                else:
                    return jsonify({"suggestion": {"type": "cloud_prompt_gemini", "text": suggestion_text}})

            # Fallback to Local AI
            category = random.choice(list(TEMPLATES.keys()))
            template = random.choice(TEMPLATES[category])
            suggestion_text = template.format(topic=topic.title())
            return jsonify({"suggestion": {"type": f"{category}_local_prompt", "text": suggestion_text}})

    return jsonify({"suggestion": None})

if __name__ == '__main__':
    app.run(debug=True, port=5001)