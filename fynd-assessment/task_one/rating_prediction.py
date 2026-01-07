
import os
import json
import requests
import pandas as pd
import time
from typing import List, Dict, Any
from sklearn.metrics import accuracy_score, classification_report

# Configuration
API_KEY = "k_b77bff20013e.3KoZgR-_aVbzchPJeWRhLcl5klaSbDKaMfackYjEjEv64QAoLPO9cw"
API_URL = "https://platform.qubrid.com/api/v1/qubridai/chat/completions"
MODEL = "openai/gpt-oss-120b"

# Mock Dataset (used if yelp.csv is not found)
MOCK_DATA = [
    {"text": "The food was amazing and the service was excellent!", "stars": 5},
    {"text": "Terrible experience. The waiter was rude and the food was cold.", "stars": 1},
    {"text": "It was okay, nothing special but not bad either.", "stars": 3},
    {"text": "Pretty good, but a bit on the pricey side.", "stars": 4},
    {"text": "I wouldn't recommend this place. Dirty and slow.", "stars": 2}
]

def get_data(filepath="yelp.csv", sample_size=50):
    if os.path.exists(filepath):
        print(f"Loading data from {filepath}...")
        df = pd.read_csv(filepath)
        # Ensure columns exist
        if 'text' not in df.columns or 'stars' not in df.columns:
             pass
        return df.sample(n=min(len(df), sample_size), random_state=42).to_dict('records')
    else:
        print(f"Dataset not found at {filepath}. Using MOCK data for demonstration.")
        return MOCK_DATA

def call_llm(prompt: str, model: str = MODEL) -> str:
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0, # Deterministic for evaluation
        "max_tokens": 512,
        "stream": False
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        # Check for standard OpenAI format
        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
            
        # Check for direct content format (Qubrid specific?)
        if 'content' in result:
            return result['content']
            
        print(f"DEBUG: Unknown response format: {json.dumps(result)}")
        return "{}"
        
    except Exception as e:
        print(f"API Error: {e}")
        return "{}"

def parse_response(response_text: str) -> Dict[str, Any]:
    # Attempt to extract JSON
    try:
        # Simple cleanup if the model wraps code in markdown items
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_text)
        return data
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw_text": response_text}

# --- Prompts ---

def prompt_zero_shot(review_text: str) -> str:
    return f"""
    You are a sentiment analysis expert. Classify the following Yelp review into a 1-5 star rating.
    
    Review: "{review_text}"
    
    Return the result strictly in this JSON format:
    {{
        "predicted_stars": <int>,
        "explanation": "<string>"
    }}
    """

def prompt_few_shot(review_text: str) -> str:
    return f"""
    Classify the Yelp review into 1-5 stars. Return JSON.

    Example 1:
    Review: "Absolutely delicious! Best pizza in town."
    Output: {{ "predicted_stars": 5, "explanation": "Positive sentiment, high praise." }}

    Example 2:
    Review: "Horrible service, never coming back."
    Output: {{ "predicted_stars": 1, "explanation": "Negative sentiment, strong dissatisfaction." }}

    Example 3:
    Review: "It was decent, but the music was too loud."
    Output: {{ "predicted_stars": 3, "explanation": "Mixed feelings, average experience." }}

    Task:
    Review: "{review_text}"
    Output:
    """

def prompt_cot(review_text: str) -> str:
    return f"""
    Analyze the following Yelp review to determine the star rating (1-5).
    Think step-by-step:
    1. Identify positive points.
    2. Identify negative points.
    3. Weigh them to determine the final score.
    
    Review: "{review_text}"
    
    Return the result strictly in this JSON format:
    {{
        "predicted_stars": <int>,
        "explanation": "<step-by-step reasoning>"
    }}
    """

# --- Evaluation Loop ---

def evaluate_strategy(strategy_name: str, prompt_func, data: List[Dict]):
    print(f"\n--- Evaluating {strategy_name} ---")
    results = []
    valid_json_count = 0
    
    for item in data:
        text = item['text']
        actual_stars = item['stars']
        
        prompt = prompt_func(text)
        response_text = call_llm(prompt)
        parsed = parse_response(response_text)
        
        predicted_stars = parsed.get('predicted_stars', -1)
        
        # Check validity
        if predicted_stars != -1 and isinstance(predicted_stars, int):
            valid_json_count += 1
        
        results.append({
            "text": text,
            "actual_stars": actual_stars,
            "predicted_stars": predicted_stars,
            "raw_response": response_text,
            "strategy": strategy_name
        })
        print(f".", end="", flush=True) # Progress indicator
    
    print("\nDone.")
    return results, valid_json_count

def main():
    # Ensure correct directory context
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # CORRECT PATH to dataset
    input_path = r"d:\Intern\Task_ONE\yelp.csv" 
    output_path = os.path.join(script_dir, "results_raw.csv")

    data = get_data(input_path) 
    if len(data) == 5 and data == MOCK_DATA:
         pass # Should print error if not found

    all_results = []
    
    # 1. Zero-shot
    res_zs, valid_zs = evaluate_strategy("Zero-shot", prompt_zero_shot, data)
    all_results.extend(res_zs)
    
    # 2. Few-shot
    res_fs, valid_fs = evaluate_strategy("Few-shot", prompt_few_shot, data)
    all_results.extend(res_fs)

    # 3. Chain-of-Thought
    res_cot, valid_cot = evaluate_strategy("CoT", prompt_cot, data)
    all_results.extend(res_cot)
    
    # Analyze
    df_res = pd.DataFrame(all_results)
    
    # Ensure output directory exists (again, for safety)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    df_res.to_csv(output_path, index=False)
    print(f"Results saved to {output_path}")
    
    print("\n=== Summary ===")
    for strategy in ['Zero-shot', 'Few-shot', 'CoT']:
        subset = df_res[df_res['strategy'] == strategy]
        # Filter out invalid predictions for accuracy calc
        valid_subset = subset[subset['predicted_stars'] != -1]
        
        if len(valid_subset) > 0:
            acc = accuracy_score(valid_subset['actual_stars'], valid_subset['predicted_stars'])
        else:
            acc = 0.0
            
        validity_rate = len(valid_subset) / len(subset) * 100
        
        print(f"{strategy}: Accuracy={acc:.2f}, JSON Validity={validity_rate:.1f}%")

if __name__ == "__main__":
    main()
