import { promises as fs } from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const AUDIO_MAP_PATH = path.join(__dirname, '..', 'data', 'audio_map.json');
const UPDATE_SQL_PATH = path.join(__dirname, '..', '..', 'database', 'update_audio_files.sql');

// Конфигурация базы данных
const dbConfig = {
    user: 'app_user',
    password: 'app_password',
    database: 'language_app',
    host: 'localhost',
    port: 5432
};

async function updateAudioInDatabase() {
    const client = new pg.Client(dbConfig);

    try {
        // Читаем файл с аудио маппингом
        const audioMapData = JSON.parse(await fs.readFile(AUDIO_MAP_PATH, 'utf8'));
        console.log(`\nЗагружено ${audioMapData.audioFiles.length} аудио файлов из ${AUDIO_MAP_PATH}`);

        // Подключаемся к базе данных
        await client.connect();
        console.log('Подключено к базе данных');

        // Создаем временную таблицу для импорта
        await client.query(`
            CREATE TEMP TABLE audio_mapping (
                text TEXT,
                filename TEXT
            );
        `);

        // Вставляем данные во временную таблицу
        const values = audioMapData.audioFiles.map(file => [file.text, file.filename]);
        const placeholders = values.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
        const flatValues = values.flat();

        await client.query(`
            INSERT INTO audio_mapping (text, filename)
            VALUES ${placeholders};
        `, flatValues);

        // Обновляем основную таблицу
        const result = await client.query(`
            UPDATE phrases p
            SET audio = am.filename
            FROM audio_mapping am
            WHERE p.text = am.text
            RETURNING p.id;
        `);

        console.log(`\nОбновлено ${result.rowCount} записей в таблице phrases`);

        // Проверяем записи, для которых не нашлось аудио
        const missingAudio = await client.query(`
            SELECT text 
            FROM phrases 
            WHERE audio IS NULL;
        `);

        if (missingAudio.rows.length > 0) {
            console.log('\nСледующие фразы не имеют аудио файлов:');
            missingAudio.rows.forEach(row => console.log(`- "${row.text}"`));
        }

    } catch (error) {
        console.error('Произошла ошибка:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\nСоединение с базой данных закрыто');
    }
}

// Запускаем обновление
updateAudioInDatabase();
