
import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

export const generateStudentSummary = async (student: Student): Promise<string> => {
  try {
    // A chave API deve estar configurada nas Environment Variables da Vercel como API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const studentData = Object.entries(student)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente administrativo escolar. Resuma os dados deste munícipe de forma profissional e concisa (máximo 3 frases): \n${studentData}`,
    });

    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Erro na Gemini API:", error);
    return "Erro ao processar análise com IA. Verifique se a API_KEY está configurada.";
  }
};
