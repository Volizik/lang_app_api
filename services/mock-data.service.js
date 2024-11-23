import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Получает указанное количество случайных фраз из JSON файла
 * @param {number} count - количество фраз для получения
 * @returns {Promise<Array<{text: string}>>}
 */
export async function getRandomPhrases(count = 1) {
  try {
    // Читаем JSON файл
    const phrasesData = await fs.readFile(
      path.join(__dirname, '../data/phrases.json'),
      'utf-8'
    );
    const { phrases } = JSON.parse(phrasesData);

    // Перемешиваем массив и берем нужное количество элементов
    const shuffled = [...phrases].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, phrases.length));
  } catch (error) {
    console.error('Error reading mock data:', error);
    throw new Error('Failed to get mock phrases');
  }
}