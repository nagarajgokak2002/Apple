import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function estimateDevicePrice(deviceType: string, condition: string, batteryHealth: number) {
  const ai = getAi();
  const prompt = `Act as an expert Apple resale price estimator for the Indian market. 
  Estimate the current market price in Indian Rupees (INR - ₹) for:
  Device: ${deviceType}
  Condition: ${condition}
  Battery Health: ${batteryHealth}%
  
  Provide a JSON response with:
  - estimatedPrice: number (current market value in INR)
  - reasoning: string (brief explanation)
  - breakdown: { screen: number, body: number, functionality: number } (deductions)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedPrice: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              screen: { type: Type.NUMBER },
              body: { type: Type.NUMBER },
              functionality: { type: Type.NUMBER }
            }
          }
        },
        required: ["estimatedPrice", "reasoning"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function diagnoseRepair(deviceType: string, problem: string) {
  const ai = getAi();
  const prompt = `Act as an expert Apple Certified Technician for the Indian market.
  Diagnose the following issue and provide costs in Indian Rupees (INR - ₹):
  Device: ${deviceType}
  Reported Problem: ${problem}
  
  Provide a JSON response with:
  - estimatedRepairCost: number (in INR)
  - repairComplexity: string (Low, Medium, High)
  - partsRequired: string[]
  - estimatedTime: string
  - technicalExplanation: string
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedRepairCost: { type: Type.NUMBER },
          repairComplexity: { type: Type.STRING },
          partsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedTime: { type: Type.STRING },
          technicalExplanation: { type: Type.STRING }
        },
        required: ["estimatedRepairCost", "estimatedTime"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
