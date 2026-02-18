
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

export const extractTransactions = async (
  base64Images: string[], 
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const allTransactions: Transaction[] = [];

  for (let i = 0; i < base64Images.length; i++) {
    const base64Data = base64Images[i];
    if (onProgress) onProgress(i + 1, base64Images.length);

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    };

    const prompt = `
      Extract ALL transactions from this bank statement page.
      Rules:
      1. Format the date as YYYY-MM-DD.
      2. If the original date format is different, convert it.
      3. Amount: positive for deposits, negative for expenses/withdrawals.
      4. Auto-detect categories: groceries, dining, transport, salary, bills, etc.
      5. Add brief notes for context.
      6. Skip all headers, footers, and non-transaction text.
      7. Return exactly an array of transaction objects.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              propertyOrdering: ["date", "description", "amount", "category", "notes"],
            }
          }
        },
      });

      const resultText = response.text?.trim();
      if (resultText) {
        const parsed: Transaction[] = JSON.parse(resultText);
        allTransactions.push(...parsed);
      }
    } catch (error) {
      console.error(`Error on page ${i + 1}:`, error);
      // We continue to next page even if one fails to salvage the rest of the batch
    }
  }

  return allTransactions;
};
