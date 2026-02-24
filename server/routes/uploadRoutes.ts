import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import Tesseract from 'tesseract.js'
import db from '../database/init.js'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件!'))
    }
  }
})

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const imagePath = req.file.path
    const imageUrl = `/uploads/${req.file.filename}`

    try {
      const result = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: m => console.log(m)
        }
      )

      const text = result.data.text
      const words = text
        .split(/\s+/)
        .map(word => word.replace(/[^a-zA-Z]/g, ''))
        .filter(word => word.length > 2)
        .filter((word, index, self) => self.indexOf(word) === index)

      res.json({
        success: true,
        imageUrl,
        text,
        words,
        confidence: result.data.confidence
      })
    } catch (ocrError) {
      console.error('OCR识别失败:', ocrError)
      res.json({
        success: true,
        imageUrl,
        text: '',
        words: [],
        confidence: 0,
        ocrError: 'OCR识别失败，请尝试更清晰的图片'
      })
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    res.status(500).json({ error: '图片上传失败' })
  }
})

router.post('/import', async (req, res) => {
  const { words } = req.body

  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: '无效的单词数据' })
  }

  try {
    const insertedWords: any[] = []

    for (const wordData of words) {
      if (!wordData.word || !wordData.meaning) {
        continue
      }

      const existingWord = db.prepare('SELECT * FROM words WHERE word = ?').get(wordData.word) as any

      if (!existingWord) {
        const result = db.prepare(`
          INSERT INTO words (word, phonetic, meaning, example, example_translation, context_description, difficulty, category, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          wordData.word,
          wordData.phonetic || '',
          wordData.meaning,
          wordData.example || '',
          wordData.example_translation || '',
          wordData.context_description || '',
          wordData.difficulty || 'medium',
          wordData.category || 'general',
          wordData.image_url || ''
        )

        const insertedWord = db.prepare('SELECT * FROM words WHERE id = ?').get(result.lastInsertRowid) as any
        insertedWords.push(insertedWord)
      }
    }

    res.json({
      success: true,
      count: insertedWords.length,
      words: insertedWords
    })
  } catch (error) {
    console.error('单词导入失败:', error)
    res.status(500).json({ error: '单词导入失败' })
  }
})

router.post('/word/:wordId/image', upload.single('image'), async (req, res) => {
  const { wordId } = req.params

  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' })
  }

  try {
    const word = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as any

    if (!word) {
      return res.status(404).json({ error: '单词不存在' })
    }

    const imageUrl = `/uploads/${req.file.filename}`

    db.prepare('UPDATE words SET image_url = ? WHERE id = ?').run(imageUrl, wordId)

    const updatedWord = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as any

    res.json({
      success: true,
      word: updatedWord
    })
  } catch (error) {
    console.error('图片上传失败:', error)
    res.status(500).json({ error: '图片上传失败' })
  }
})

router.get('/reminders/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const now = new Date().toISOString()

    const reviewWords = db.prepare(`
      SELECT w.*, uw.mastery_level, uw.review_count, uw.next_review
      FROM words w
      JOIN user_words uw ON w.id = uw.word_id
      WHERE uw.user_id = ? AND uw.next_review <= ?
      ORDER BY uw.next_review ASC
      LIMIT 10
    `).all(userId, now)

    const overdueCount = reviewWords.length

    res.json({
      success: true,
      overdueCount,
      words: reviewWords
    })
  } catch (error) {
    console.error('获取复习提醒失败:', error)
    res.status(500).json({ error: '获取复习提醒失败' })
  }
})

router.post('/weekly-goal/check', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' })
  }

  try {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const goal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any

    if (!goal) {
      return res.status(404).json({ error: '本周目标不存在' })
    }

    const weekWords = db.prepare(`
      SELECT COUNT(*) as count FROM user_words
      WHERE user_id = ? AND learned_at >= ?
    `).get(userId, weekStart.toISOString()) as { count: number }

    const learnedWords = weekWords.count
    const isCompleted = learnedWords >= goal.target_words ? 1 : 0

    db.prepare(`
      UPDATE weekly_goals
      SET learned_words = ?, is_completed = ?
      WHERE user_id = ? AND week_start >= ?
    `).run(learnedWords, isCompleted, userId, weekStart.toISOString())

    let penaltyItems: any[] = []

    if (!isCompleted) {
      const inventoryItems = db.prepare(`
        SELECT * FROM user_inventory
        WHERE user_id = ? AND is_equipped = 0
        ORDER BY purchased_at ASC
        LIMIT 2
      `).all(userId) as any[]

      for (const item of inventoryItems) {
        if (item.item_type === 'character') {
          db.prepare('DELETE FROM user_inventory WHERE id = ?').run(item.id)
        } else if (item.item_type === 'garden') {
          db.prepare('DELETE FROM user_inventory WHERE id = ?').run(item.id)
          db.prepare('UPDATE user_garden SET is_active = 0 WHERE user_id = ? AND garden_item_id = ?').run(userId, item.item_id)
        }
        penaltyItems.push(item)
      }
    }

    const updatedGoal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any

    res.json({
      success: true,
      goal: updatedGoal,
      isCompleted: isCompleted === 1,
      penaltyApplied: !isCompleted && penaltyItems.length > 0,
      penaltyItems
    })
  } catch (error) {
    console.error('周目标检查失败:', error)
    res.status(500).json({ error: '周目标检查失败' })
  }
})

export default router