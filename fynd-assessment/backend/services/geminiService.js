import dotenv from 'dotenv';
dotenv.config();

const QUBID_API_KEY = process.env.QUBID_API_KEY;
const QUBID_API_URL = 'https://platform.qubrid.com/api/v1/qubridai/chat/completions';

/**
 * Helper to call Qubid AI API
 */
async function callQubidAI(prompt, retryCount = 0) {
    if (!QUBID_API_KEY) {
        throw new Error('QUBID_API_KEY is not set');
    }

    const MAX_RETRIES = 2;

    try {
        const response = await fetch(QUBID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${QUBID_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b', // Correct model from Qubid documentation
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                stream: false, // Using non-streaming for better reliability
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.8,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle rate limiting
            if (response.status === 429 && retryCount < MAX_RETRIES) {
                const delay = 1000 * Math.pow(2, retryCount);
                console.log(`⚠️ Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return callQubidAI(prompt, retryCount + 1);
            }

            throw new Error(`Qubid API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        // Qubid AI specific response parsing
        // Based on testing, Qubid returns { content: "..." } at top level
        let content = data.content;

        // Fallback checks just in case format varies (standard OpenAI format)
        if (!content && data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        }

        if (!content) {
            console.error('Unexpected response format:', JSON.stringify(data, null, 2));
            throw new Error('No content received from Qubid AI');
        }

        return content.trim();
    } catch (error) {
        console.error('Qubid AI Call Failed:', error.message);

        if (retryCount < MAX_RETRIES) {
            const delay = 1000 * Math.pow(2, retryCount);
            console.log(`🔄 Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callQubidAI(prompt, retryCount + 1);
        }

        throw error;
    }
}

/**
 * Generate a friendly user-facing response based on rating and review
 */
export async function generateUserResponse(rating, reviewText) {
    const prompt = `You are a customer service representative for a company. 
    Write a short, warm, and professional response to a customer review.
    
    Rating: ${rating}/5 stars
    Review: "${reviewText || 'No specific comments provided.'}"
    
    Guidelines:
    - Maximum 2-3 sentences.
    - Be empathetic and appreciative.
    - If rating is low (1-3), apologize and offer support.
    - If rating is high (4-5), thank them enthusiastically.
    - Do not include placeholders like "[Your Name]".
    - Return ONLY the response text.`;

    try {
        return await callQubidAI(prompt);
    } catch (error) {
        console.warn('⚠️ AI failed. Using static fallback response.');
        return getFallbackUserResponse(rating);
    }
}

/**
 * Generate a concise 1-sentence summary for the admin dashboard
 */
export async function generateAdminSummary(rating, reviewText) {
    if (!reviewText || reviewText.length < 10) {
        return "No significant review text to summarize.";
    }

    const prompt = `As an expert analyst, summarize this review in one powerful sentence. Focus directly on the **root cause** of the rating (why they are happy or unhappy) so the admin knows exactly what to fix or celebrate.
    
    Rating: ${rating}/5
    Review: "${reviewText}"
    
    Return only the summary.`;

    try {
        return await callQubidAI(prompt);
    } catch (error) {
        console.warn('⚠️ AI failed. Using static fallback summary.');
        return getFallbackAdminSummary(rating, reviewText);
    }
}

/**
 * Generate detailed improvement suggestions and fixes based on the review
 * This provides actionable insights on what to improve and how to fix issues
 */
export async function generateRecommendedActions(rating, reviewText) {
    if (rating === 5 && (!reviewText || reviewText.length < 10)) {
        return "✅ Celebrate this win with the team!\n💡 Ask customer for testimonial or case study.";
    }

    const prompt = `You are a business improvement consultant analyzing customer feedback. Based on this review, provide:

1. **What to Improve**: Identify 1-2 specific areas that need improvement
2. **How to Fix**: Provide actionable solutions for each issue

Rating: ${rating}/5
Review: "${reviewText || 'No specific feedback provided'}"

Format your response as:
🔍 WHAT TO IMPROVE:
- [Specific issue 1]
- [Specific issue 2 if applicable]

🛠️ HOW TO FIX:
- [Actionable solution 1]
- [Actionable solution 2 if applicable]

Keep each point concise (max 10 words). Focus on practical, implementable actions.`;

    try {
        return await callQubidAI(prompt);
    } catch (error) {
        console.warn('⚠️ AI failed. Using static fallback actions.');
        return getFallbackRecommendedActions(rating, reviewText);
    }
}

// --- FALLBACK FUNCTIONS (Used when AI fails) ---

function getFallbackUserResponse(rating) {
    if (rating >= 4) return "Thank you so much for your positive feedback! We're glad to hear you had a great experience.";
    if (rating === 3) return "Thank you for your feedback. We appreciate your input and will use it to improve our services.";
    return "We apologize that your experience did not meet expectations. We are committed to doing better in the future.";
}

function getFallbackAdminSummary(rating, reviewText) {
    const sentiment = rating >= 4 ? "Positive" : rating === 3 ? "Neutral" : "Negative";
    const snippet = reviewText ? reviewText.substring(0, 50) + (reviewText.length > 50 ? "..." : "") : "No comments";
    return `${sentiment} review: ${snippet}`;
}

function getFallbackRecommendedActions(rating, reviewText) {
    if (rating >= 4) {
        return `🔍 WHAT TO IMPROVE:
- Continue current excellent service
- Identify what made this experience great

🛠️ HOW TO FIX:
- Document successful practices
- Share with team for replication`;
    }

    if (rating === 3) {
        return `🔍 WHAT TO IMPROVE:
- Identify specific pain points
- Understand mixed feedback root cause

🛠️ HOW TO FIX:
- Follow up with customer for details
- Implement targeted improvements`;
    }

    // Low ratings (1-2)
    const hasText = reviewText && reviewText.length > 10;
    return `🔍 WHAT TO IMPROVE:
- Address customer dissatisfaction immediately
${hasText ? '- Fix issues mentioned in review' : '- Investigate service quality gaps'}

🛠️ HOW TO FIX:
- Contact customer for service recovery
- Implement corrective action plan`;
}
