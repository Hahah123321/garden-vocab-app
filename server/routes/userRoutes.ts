import express from 'express'
import db from '../database/init'

const router = express.Router()

router.post('/login', (req, res) => {
  const { nickname } = req.body

  if (!nickname) {
    return res.status(400).json({ error: 'Nickname is required' })
  }

  try {
    let user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as any

    if (!user) {
      const result = db.prepare('INSERT INTO users (nickname) VALUES (?)').run(nickname)
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any
    } else {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' })
  }
})

router.get('/:id', (req, res) => {
  const { id } = req.params

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.get('/:id/stats', (req, res) => {
  const { id } = req.params

  try {
    const totalWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ?').get(id) as { count: number }
    const reviews = db.prepare('SELECT COUNT(*) as count FROM learning_records WHERE user_id = ? AND record_type = "review"').get(id) as { count: number }
    const achievements = db.prepare('SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?').get(id) as { count: number }
    const inventory = db.prepare('SELECT COUNT(*) as count FROM user_inventory WHERE user_id = ?').get(id) as { count: number }

    const stats = {
      totalWords: totalWords.count,
      reviews: reviews.count,
      achievements: achievements.count,
      inventory: inventory.count,
    }

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

router.put('/:id/points', (req, res) => {
  const { id } = req.params
  const { points, operation } = req.body

  if (typeof points !== 'number') {
    return res.status(400).json({ error: 'Invalid points value' })
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newPoints = operation === 'subtract' ? user.points - points : user.points + points

    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, id)

    res.json({ points: newPoints })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update points' })
  }
})

export default router