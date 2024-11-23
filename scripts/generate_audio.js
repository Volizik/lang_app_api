import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const TTS_SERVER_URL = 'http://localhost:5002';
const AUDIO_OUTPUT_DIR = path.join(__dirname, '..', 'audio');
const PHRASES_JSON_PATH = path.join(__dirname, '..', 'data', 'phrases.json');
const AUDIO_MAP_PATH = path.join(__dirname, '..', 'data', 'audio_map.json');
const BATCH_SIZE = 10; // Количество фраз для обработки за раз
const DELAY = 1000; // Задержка между запросами в миллисекундах

/**
 * Создает директорию для аудио файлов, если она не существует
 */
async function ensureAudioDir() {
    try {
        await fs.mkdir(AUDIO_OUTPUT_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Генерирует аудио файл для заданного текста
 */
async function generateAudio(text, outputPath) {
    try {
        const response = await axios({
            method: 'get',
            url: `${TTS_SERVER_URL}/api/tts`,
            params: { text },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        await fs.writeFile(outputPath, response.data);
        console.log(`✓ Создан аудио файл: ${outputPath}`);
        return true;
    } catch (error) {
        console.log(`✗ Ошибка при генерации аудио для: '${text}'`);
        console.log(`  Ошибка: ${error.message}`);
        return false;
    }
}

/**
 * Ждет указанное количество миллисекунд
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Загружает или создает карту аудио файлов
 */
async function loadOrCreateAudioMap() {
    try {
        const data = await fs.readFile(AUDIO_MAP_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { audioFiles: [] };
        }
        throw error;
    }
}

/**
 * Обрабатывает все фразы из JSON файла
 */
async function processPhrases() {
    try {
        // Загружаем фразы из JSON
        const data = JSON.parse(await fs.readFile(PHRASES_JSON_PATH, 'utf8'));
        const phrases = data.phrases;

        console.log(`\nНайдено ${phrases.length} фраз для обработки`);
        console.log(`Аудио файлы будут сохранены в: ${AUDIO_OUTPUT_DIR}\n`);

        // Создаем директорию для аудио файлов
        await ensureAudioDir();

        // Загружаем или создаем карту аудио файлов
        const audioMap = await loadOrCreateAudioMap();

        // Обрабатываем фразы батчами
        let totalSuccess = 0;
        let totalFailed = 0;

        for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
            const batch = phrases.slice(i, i + BATCH_SIZE);
            console.log(`\nОбработка фраз ${i + 1}-${Math.min(i + BATCH_SIZE, phrases.length)} из ${phrases.length}`);

            for (const phrase of batch) {
                const text = phrase.text;
                // Генерируем уникальное имя файла на основе UUID
                const filename = `${uuidv4()}.wav`;
                const outputPath = path.join(AUDIO_OUTPUT_DIR, filename);

                if (await generateAudio(text, outputPath)) {
                    totalSuccess++;
                    // Добавляем информацию в карту аудио файлов
                    audioMap.audioFiles.push({
                        filename,
                        text,
                        language: 'en',
                        createdAt: new Date().toISOString()
                    });
                } else {
                    totalFailed++;
                }

                await sleep(DELAY);
            }

            // Периодически сохраняем карту аудио файлов
            await fs.writeFile(AUDIO_MAP_PATH, JSON.stringify(audioMap, null, 4));
        }

        console.log(`\nГотово!`);
        console.log(`Успешно создано: ${totalSuccess} аудио файлов`);
        console.log(`Ошибок: ${totalFailed}`);
        console.log(`\nКарта аудио файлов сохранена в: ${AUDIO_MAP_PATH}`);
    } catch (error) {
        console.error('Произошла ошибка:', error);
        process.exit(1);
    }
}

// Запускаем обработку фраз
processPhrases();
