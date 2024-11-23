import asyncHandler from 'express-async-handler';
import db from '../config/db.js';

// @desc    Get all phrases
// @route   GET /api/phrases
// @access  Public
export const getPhrases = asyncHandler(async (req, res) => {
    const { language, limit = 20, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM phrases';
    const params = [];
    
    if (language) {
        query += ' WHERE language = $1';
        params.push(language);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const { rows } = await db.query(query, params);
    res.json(rows);
});

// @desc    Get random phrases
// @route   GET /api/phrases/random
// @access  Public
export const getRandomPhrases = asyncHandler(async (req, res) => {
    const { language, limit = 10 } = req.query;
    
    let query = 'SELECT * FROM phrases';
    const params = [];
    
    if (language) {
        query += ' WHERE language = $1';
        params.push(language);
    }
    
    query += ' ORDER BY RANDOM() LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    const { rows } = await db.query(query, params);
    
    if (rows.length === 0) {
        res.status(404);
        throw new Error('No phrases found');
    }
    
    res.json(rows);
});

// @desc    Get phrase by ID
// @route   GET /api/phrases/:id
// @access  Public
export const getPhraseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM phrases WHERE id = $1', [id]);
    
    if (rows.length === 0) {
        res.status(404);
        throw new Error('Phrase not found');
    }
    
    res.json(rows[0]);
});

// @desc    Create new phrase
// @route   POST /api/phrases
// @access  Public
export const createPhrase = asyncHandler(async (req, res) => {
    const { text, language, audio } = req.body;
    
    if (!text || !language) {
        res.status(400);
        throw new Error('Please provide text and language');
    }
    
    const { rows } = await db.query(
        'INSERT INTO phrases (text, language, audio) VALUES ($1, $2, $3) RETURNING *',
        [text, language, audio]
    );
    
    res.status(201).json(rows[0]);
});

// @desc    Update phrase
// @route   PUT /api/phrases/:id
// @access  Public
export const updatePhrase = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text, language, audio } = req.body;
    
    // Check if phrase exists
    const existingPhrase = await db.query('SELECT * FROM phrases WHERE id = $1', [id]);
    if (existingPhrase.rows.length === 0) {
        res.status(404);
        throw new Error('Phrase not found');
    }
    
    const { rows } = await db.query(
        'UPDATE phrases SET text = COALESCE($1, text), language = COALESCE($2, language), audio = COALESCE($3, audio), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [text, language, audio, id]
    );
    
    res.json(rows[0]);
});

// @desc    Delete phrase
// @route   DELETE /api/phrases/:id
// @access  Public
export const deletePhrase = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM phrases WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
        res.status(404);
        throw new Error('Phrase not found');
    }
    
    res.json({ message: 'Phrase removed' });
});
