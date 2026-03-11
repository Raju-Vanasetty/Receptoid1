import { GoogleGenAI, Type } from "@google/genai";
import { Receipt } from "../types";

// NOTE: in a real production app, this key should be behind a backend proxy.
// For this demo, it relies on process.env.API_KEY being injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeReceiptImage(base64Image: string): Promise<Partial<Receipt>> {
  try {
    const modelId = "gemini-2.5-flash"; // Efficient for extraction tasks

    const prompt = `
      Analyze this receipt image. Extract the following information in strict JSON format:
      1. Merchant Name (vendor/store name). Title case.
      2. Date of purchase (YYYY-MM-DD format). If year is missing, assume current year.
      3. Total Amount (number). Return ONLY the numeric value (e.g., 25.50), do not include currency symbols.
      4. Category (choose strictly one from: 'Food & Dining', 'Transportation', 'Business', 'Utilities', 'Shopping', 'Others').
      5. Items (array of objects with 'description' and 'amount'). ensure amount is a number.
      
      If any field is illegible, make a reasonable guess based on context. 
      For the total amount, look for "Total", "Grand Total", or the largest monetary value at the bottom.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["merchantName", "totalAmount", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Failed to parse the receipt data. The image might be unclear.");
    }

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Propagate the specific error message for the UI to handle
    if (error.message) {
        throw error;
    }
    throw new Error("Failed to process receipt with AI. Please try again.");
  }
}

export async function getBudgetAdvice(
  totalSpent: number, 
  budget: number, 
  categoryBreakdown: Record<string, number>
): Promise<string[]> {
  try {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      I have a monthly budget of ₹${budget}, but I have spent ₹${totalSpent} this month.
      Here is my spending breakdown by category:
      ${JSON.stringify(categoryBreakdown, null, 2)}
      
      Please provide 3 distinct, actionable, and specific tips to help me reduce my costs immediately and stay within budget next time. 
      Analyze the category with the highest spend specifically.
      Keep each tip concise (under 20 words). 
      Return the response as a simple JSON array of strings. Example: ["Tip 1", "Tip 2", "Tip 3"]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return ["Review your recurring subscriptions.", "Cook more meals at home.", "Look for cheaper transportation alternatives."];

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Budget Advice Error:", error);
    return ["Track your daily expenses closely.", "Identify needs vs wants.", "Set strict limits for discretionary spending."];
  }
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};