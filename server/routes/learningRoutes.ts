import express from 'express'
import db from '../database/init'

const router = express.Router()

function calculateNextReview(masteryLevel: number): Date {
  const intervals = [1, 2, 4, 7, 15, 30]
  const days = intervals[Math.min(masteryLevel, intervals.length - 1)]
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + days)
  return nextReview
}

router.post('/learn', (req, res) => {
  const { userId, wordId, result, timeSpent } = req.body

  if (!userId || !wordId || !result) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const existingWord = db.prepare('SELECT * FROM user_words WHERE user_id = ? AND word_id = ?').get(userId, wordId) as any

    if (existingWord) {
      const masteryLevel = result === 'correct' ? existingWord.mastery_level + 1 : Math.max(0, existingWord.mastery_level - 1)
      const nextReview = calculateNextReview(masteryLevel)

      db.prepare(`
        UPDATE user_words
        SET mastery_level = ?, review_count = review_count + 1, next_review = ?
        WHERE user_id = ? AND word_id = ?
      `).run(masteryLevel, nextReview.toISOString(), userId, wordId)
    } else {
      const nextReview = calculateNextReview(0)

      db.prepare(`
        INSERT INTO user_words (user_id, word_id, mastery_level, next_review)
        VALUES (?, ?, 0, ?)
      `).run(userId, wordId, nextReview.toISOString())

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
      db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(userId)
    }

    db.prepare(`
      INSERT INTO learning_records (user_id, word_id, record_type, result, time_spent)
      VALUES (?, ?, 'learn', ?, ?)
    `).run(userId, wordId, result, timeSpent || 0)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to record learning' })
  }
})

router.post('/review', (req, res) => {
  const { userId, wordId, result, timeSpent } = req.body

  if (!userId || !wordId || !result) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const existingWord = db.prepare('SELECT * FROM user_words WHERE user_id = ? AND word_id = ?').get(userId, wordId) as any

    if (!existingWord) {
      return res.status(404).json({ error: 'Word not found for this user' })
    }

    const masteryLevel = result === 'correct' ? existingWord.mastery_level + 1 : Math.max(0, existingWord.mastery_level - 1)
    const nextReview = calculateNextReview(masteryLevel)

    db.prepare(`
      UPDATE user_words
      SET mastery_level = ?, review_count = review_count + 1, next_review = ?
      WHERE user_id = ? AND word_id = ?
    `).run(masteryLevel, nextReview.toISOString(), userId, wordId)

    db.prepare(`
      INSERT INTO learning_records (user_id, word_id, record_type, result, time_spent)
      VALUES (?, ?, 'review', ?, ?)
    `).run(userId, wordId, result, timeSpent || 0)

    const pointsEarned = result === 'correct' ? 5 : 2
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsEarned, userId)

    res.json({ success: true, pointsEarned, masteryLevel, nextReview })
  } catch (error) {
    res.status(500).json({ error: 'Failed to record review' })
  }
})

router.get('/history/:userId', (req, res) => {
  const { userId } = req.params
  const { limit = 50 } = req.query

  try {
    const records = db.prepare(`
      SELECT lr.*, w.word, w.meaning
      FROM learning_records lr
      JOIN words w ON lr.word_id = w.id
      WHERE lr.user_id = ?
      ORDER BY lr.created_at DESC
      LIMIT ?
    `).all(userId, parseInt(limit as string))

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning history' })
  }
})

router.get('/listening/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const materials = db.prepare('SELECT * FROM listening_materials ORDER BY RANDOM() LIMIT 5').all()

    res.json(materials)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listening materials' })
  }
})

router.post('/practice', (req, res) => {
  const { userId, sessionType, totalQuestions, correctAnswers, timeSpent } = req.body

  if (!userId || !sessionType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const result = db.prepare(`
      INSERT INTO practice_sessions (user_id, session_type, total_questions, correct_answers, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, sessionType, totalQuestions || 0, correctAnswers || 0, timeSpent || 0)

    const pointsEarned = Math.floor((correctAnswers / totalQuestions) * 20)
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsEarned, userId)

    res.json({ success: true, pointsEarned })
  } catch (error) {
    res.status(500).json({ error: 'Failed to record practice session' })
  }
})

export default router