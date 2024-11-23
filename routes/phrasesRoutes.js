import express from 'express';
import {
    getPhrases,
    getPhraseById,
    createPhrase,
    updatePhrase,
    deletePhrase,
    getRandomPhrases
} from '../controllers/phrasesController.js';

const router = express.Router();

router.route('/')
    .get(getPhrases)
    .post(createPhrase);

router.route('/random')
    .get(getRandomPhrases);

router.route('/:id')
    .get(getPhraseById)
    .put(updatePhrase)
    .delete(deletePhrase);

export default router;
