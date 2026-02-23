import express from 'express'
import db from '../database/init'

const router = express.Router()

router.get('/', (req, res) => {
  const { difficulty, category, limit = 20 } = req.query

  try {
    let query = 'SELECT * FROM words'
    const params: any[] = []

    const conditions: string[] = []

    if (difficulty) {
      conditions.push('difficulty = ?')
      params.push(difficulty)
    }

    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY RANDOM() LIMIT ?'
    params.push(parseInt(limit as string))

    const words = db.prepare(query).all(...params)

    res.json(words)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch words' })
  }
})

router.get('/:id', (req, res) => {
  const { id } = req.params

  try {
    const word = db.prepare('SELECT * FROM words WHERE id = ?').get(id) as any

    if (!word) {
      return res.status(404).json({ error: 'Word not found' })
    }

    res.json(word)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch word' })
  }
})

router.get('/user/:userId/learned', (req, res) => {
  const { userId } = req.params

  try {
    const words = db.prepare(`
      SELECT w.*, uw.mastery_level, uw.review_count, uw.next_review
      FROM words w
      JOIN user_words uw ON w.id = uw.word_id
      WHERE uw.user_id = ?
      ORDER BY uw.learned_at DESC
    `).all(userId)

    res.json(words)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learned words' })
  }
})

router.get('/user/:userId/review', (req, res) => {
  const { userId } = req.params

  try {
    const now = new Date().toISOString()

    const words = db.prepare(`
      SELECT w.*, uw.mastery_level, uw.review_count, uw.next_review
      FROM words w
      JOIN user_words uw ON w.id = uw.word_id
      WHERE uw.user_id = ? AND uw.next_review <= ?
      ORDER BY uw.next_review ASC
      LIMIT 20
    `).all(userId, now)

    res.json(words)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review words' })
  }
})

router.get('/user/:userId/new', (req, res) => {
  const { userId } = req.params
  const { limit = 5 } = req.query

  try {
    const words = db.prepare(`
      SELECT w.* FROM words w
      WHERE w.id NOT IN (SELECT word_id FROM user_words WHERE user_id = ?)
      ORDER BY RANDOM()
      LIMIT ?
    `).all(userId, parseInt(limit as string))

    res.json(words)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch new words' })
  }
})

export default router