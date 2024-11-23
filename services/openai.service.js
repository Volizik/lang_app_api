import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Настройка путей для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Генерирует разговорные фразы используя ChatGPT
 * @param {number} count - количество фраз для генерации
 * @returns {Promise<Array<{text: string, audio: string}>>}
 */
export async function generatePhrasesWithGPT(count) {
  try {
    const prompt = `Act as a native English speaker having a casual conversation. Generate ${count} natural phrases that you would actually say in everyday life. Include:
- Casual greetings and responses
- Common questions and answers
- Reactions to situations
- Everyday requests and offers
- Small talk phrases
- Common expressions and idioms

The phrases should sound completely natural, as if you're talking to a friend. Don't include any explanations or translations, just the phrases themselves.

Return the response as a JSON array of objects, where each object has a 'text' field containing just the phrase.

Example format:
{
  "phrases": [
    { "text": "Hey, what's been up with you lately?" },
    { "text": "I'm running a bit behind, give me five minutes" }
  ]
}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "You are a native English speaker having natural, casual conversations. Your responses should sound authentic and conversational, exactly how people talk in real life."
        },
        { 
          "role": "user", 
          "content": prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    // Парсим JSON ответ
    const response = JSON.parse(completion.choices[0].message.content);
    
    // Преобразуем ответ в нужный формат
    return response.phrases.map(phrase => ({
      text: phrase.text,
      audio: 'https://muz-tv.ru/storage/files/chart-tracks/1606734791.mp3'
    }));
  } catch (error) {
    console.error('Error generating phrases with GPT:', error);
    throw error;
  }
}
