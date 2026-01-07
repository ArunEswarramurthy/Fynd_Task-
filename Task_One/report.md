# Task 1 Report: Rating Prediction via Prompting


## 1. Overall Approach
To solve the problem of classifying Yelp reviews into 1-5 star ratings, I developed a Python-based pipeline that interfaces with the Qubrid AI API (using the `openai/gpt-oss-120b` model). The approach focused on modularity and reproducibility. 

I implemented three distinct prompting strategies to evaluate how different contexts affect model performance:
1.  **Zero-shot:** Baseline performance without examples.
2.  **Few-shot:** Providing context through examples to guide the model's output format and reasoning style.
3.  **Chain-of-Thought (CoT):** Encouraging the model to reason before deciding, which is known to improve performance on complex tasks.

The solution was structured as a Jupyter Notebook to allow for interactive execution and visualization, with a fallback Python script for batch processing.

## 2. Design and Architecture Decisions
*   **Data Handling:** Used `pandas` for efficient CSV parsing and stratified sampling (ensuring representation across all star ratings, though for the final run random sampling was used for simplicity if class distribution was unknown).
*   **API Integration:** Implemented a robust `call_api` function with retry logic to handle potential network instability or rate limits (HTTP 429). I also handled API response inconsistencies (e.g., fallback to top-level `content` key).
*   **JSON Parsing:** To ensure the model output was usable, I enforced a Strict JSON response format in the prompts and implemented a resilient parser that strips markdown code blocks (```json) before decoding.
*   **Rate Limiting:** Added artificial delays (`time.sleep`) between requests to respect API tier limits.

## 3. Prompt Iterations and Improvements
During development, I iterated on the prompts to maximize JSON validity and accuracy.

### Strategy 1: Zero-shot
*   **Concept:** Direct instruction.
*   **Iteration:** Initially, the model might include conversational filler ("Here is the JSON...").
*   **Refinement:** Added "Do not output any markdown formatting or extra text, just the specific JSON." to strictly separate data from conversation.

### Strategy 2: Few-shot
*   **Concept:** Learning by example.
*   **Selection:** I selected 3 examples representing distinct sentiments:
    *   *Negative (1 Star):* "The food was terrible..."
    *   *Neutral (3 Star):* "It was okay..."
    *   *Positive (5 Star):* "Absolutely amazing..."
*   **Impact:** This helped stabilize the output for ambiguous reviews by providing a reference anchor.

### Strategy 3: Chain-of-Thought (CoT)
*   **Concept:** reasoned deduction.
*   **Instruction:** "First, think step-by-step about the sentiment expressed... Then, determine the final rating."
*   **Hypothesis:** Explicit reasoning helps the model catch nuance (e.g., good food but bad service) before assigning a final score.

## 4. Evaluation Methodology
I evaluated the models on a dataset of **200 reviews** sampled from `yelp.csv`.
*   **Metrics:**
    *   **Accuracy:** Percentage of reviews where `predicted_stars == actual_stars`.
    *   **JSON Validity Rate:** Percentage of responses that could be successfully parsed into JSON.
*   **Process:** The script iterates through the sample, queries the API for all 3 strategies per review, and aggregates the results.

## 5. Results
*(Note: Please insert your final metrics from the Google Colab run below. The following are expected trends based on initial testing.)*

| Strategy | Accuracy | JSON Validity Rate | Observations |
| :--- | :--- | :--- | :--- |
| **Zero-shot** | *TBD%* | *TBD%* | Generally good, but may struggle with sarcasm. |
| **Few-shot** | *TBD%* | *TBD%* | Expected to have higher stability and validity. |
| **CoT** | *TBD%* | *TBD%* | Likely the most accurate for long/complex reviews. |

## 6. Trade-offs and Limitations
*   **Latency:** Chain-of-Thought requires generating more tokens (reasoning text), which increases cost and latency compared to Zero-shot.
*   **API Dependency:** The system relies entirely on external API availability. Rate limits can slow down batch processing of large datasets.
*   **Sample Size:** Evaluating on only 200 reviews gives a signal but may not be statistically significant for production deployment decisions.
