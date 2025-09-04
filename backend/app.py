from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import defaultdict
import random

# library from Hugging Face
from transformers import pipeline

# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
nlp = spacy.load("en_core_web_sm")
analyzer = SentimentIntensityAnalyzer()

try:
    generator = pipeline("text-generation", model="distilgpt2")
except Exception as e:
    print(f"Error initializing text-generation pipeline: {e}")
    generator = None

# --- The Curated Knowledge Base (need improvement !!!) ---
# This is our library of safe, pre-approved content foundations
KNOWLEDGE_BASE = {
    "sleep": {
        "empathetic_statement": "Struggling with sleep can be incredibly draining and can affect everything else in your day.",
        "questions": [
            "What's on your mind when you're trying to fall asleep?",
            "Is there a connection between how your days feel and how your nights go?",
            "What does a truly restful night feel like to you?"
        ]
    },
    "anxiety": {
        "empathetic_statement": "Anxiety can feel like a heavy weight, and it's brave of you to write about it.",
        "questions": [
            "Where do you physically feel that anxiety in your body?",
            "What is one small thing that might bring a moment of calm right now?",
            "When you feel anxious, what's a thought that often comes up?"
        ]
    },
    "job": {
        "empathetic_statement": "It sounds like your job is taking up a lot of your energy right now, which can be really tough.",
        "questions": [
            "What is one aspect of your job that you wish you could change?",
            "Outside of the challenges, is there anything about your job that still feels meaningful?",
            "What would a 'good day' at your job look like?"
        ]
    },
    "mistake": {
        "empathetic_statement": "It's completely human to feel this way after making a mistake, and it's okay to feel disappointed.",
        "questions": [
            "Beyond the outcome, what is one thing you can learn from this experience?",
            "How can you offer yourself the same compassion you might offer a friend in this situation?",
            "What's one step you could take to move forward from this?"
        ]
    }
}

# --- The Fallback Template Pool ---
# If a topic isn't in our knowledge base, we'll use this for safety
FALLBACK_TEMPLATES = {
    "reframing": [
        "I've noticed '{topic}' has appeared a few times. Is there another way to look at this situation?",
        "It seems '{topic}' is a recurring theme. What's one thing about this that might be within your control?"
    ],
    "emotional_exploration": [
        "The topic of '{topic}' seems to carry a heavy weight. What specific emotion comes to mind when you think about it?",
        "Thank you for sharing about '{topic}'. Let's sit with that for a moment. What does this feeling physically feel like in your body?"
    ]
}


def generate_dynamic_response(topic, statement, question):
    if not generator:
        return "Error: Text generation model is not available."
        
    prompt = (
        f"You are an empathetic journaling companion. Your goal is to be gentle and curious, not to give advice. "
        f"A user is struggling with the topic of '{topic}'. "
        f"Combine the following statement and question into a single, supportive paragraph:\n\n"
        f"Statement: \"{statement}\"\n"
        f"Question: \"{question}\""
    )

    print(prompt)
    
    try:
        generated_outputs = generator(
            prompt, 
            # short-form response limiter.
            max_new_tokens=75, 
            # make sure we're not repeating ourselves
            no_repeat_ngram_size=2,
            truncation=True, 
            num_return_sequences=1
        )
        
        response_text = generated_outputs[0]['generated_text'].replace(prompt, "").strip()
        
        if len(response_text) < 20:
             return f"{statement} {question}" 
        return response_text

    except Exception as e:
        print(f"Error during text generation: {e}")
        return f"{statement} {question}"


# --- API ENDPOINT (Updated Logic) ---
@app.route('/api/analyze', methods=['POST'])
def analyze_entries():
    data = request.get_json()
    entries = data.get('entries', [])
    topic_sentiments = defaultdict(list)
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
            topic_sentiments[topic].append(sentiment_score)
    
    # --- APPLY THE RULES-BASED SYSTEM ---
    for topic, scores in topic_sentiments.items():
        if len(scores) >= 3 and (sum(scores) / len(scores)) < -0.25:
            
            suggestion_text = ""
            suggestion_type = ""

            if topic in KNOWLEDGE_BASE:
                statement = KNOWLEDGE_BASE[topic]["empathetic_statement"]
                question = random.choice(KNOWLEDGE_BASE[topic]["questions"])
                
                # Call our new generative function
                suggestion_text = generate_dynamic_response(topic, statement, question)
                suggestion_type = "generative_prompt"

            # Otherwise, use the fallback system for topics not in the knowledge base
            else:
                category = random.choice(list(FALLBACK_TEMPLATES.keys()))
                template = random.choice(FALLBACK_TEMPLATES[category])
                suggestion_text = template.format(topic=topic.title())
                suggestion_type = f"{category}_fallback_prompt"

            return jsonify({
                "suggestion": {
                    "type": suggestion_type,
                    "text": suggestion_text
                }
            })

    return jsonify({"suggestion": None})

if __name__ == '__main__':
    app.run(debug=True, port=5001)