import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import phrasesRoutes from './routes/phrasesRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Разрешаем запросы с любого источника
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static audio files
app.use('/audio', express.static('audio'));

// Routes
app.use('/api/phrases', phrasesRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});