import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

export const generateStudentSummary = async (student: Student): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const studentData = Object.entries(student).map(([k, v]) => `${k}: ${v}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Resuma brevemente a situação deste munícipe para uso administrativo: \n${studentData}`,
    });

    return response.text || "Sem resumo.";
  } catch {
    return "Erro ao gerar resumo pela IA.";
  }
};