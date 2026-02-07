import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

export const generateStudentSummary = async (student: Student): Promise<string> => {
  try {
    // A API_KEY deve ser configurada no painel da Vercel: Settings > Environment Variables
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      return "Aviso: A chave de IA não foi configurada na Vercel. Por favor, adicione a variável API_KEY nas configurações do projeto.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const studentData = Object.entries(student)
      .filter(([_, v]) => v && v.toString().trim() !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente escolar do CEU Caminho do Mar. Analise os dados deste munícipe e crie um resumo acolhedor de até 3 frases: \n${studentData}`,
    });

    return response.text || "Análise concluída.";
  } catch (error) {
    console.error("Erro na Gemini API:", error);
    return "Não foi possível gerar a análise agora. Verifique a conexão ou a chave de API.";
  }
};