import express from 'express'
import db from '../database/init.js'

const router = express.Router()

router.get('/character-items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM character_items ORDER BY price ASC').all()

    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character items' })
  }
})

router.get('/garden-items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM garden_items ORDER BY price ASC').all()

    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch garden items' })
  }
})

router.get('/inventory/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const characterItems = db.prepare(`
      SELECT ci.*, ui.is_equipped
      FROM character_items ci
      JOIN user_inventory ui ON ci.id = ui.item_id
      WHERE ui.user_id = ? AND ui.item_type = 'character'
    `).all(userId)

    const gardenItems = db.prepare(`
      SELECT gi.*, ui.is_equipped
      FROM garden_items gi
      JOIN user_inventory ui ON gi.id = ui.item_id
      WHERE ui.user_id = ? AND ui.item_type = 'garden'
    `).all(userId)

    res.json({ characterItems, gardenItems })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

router.get('/garden/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const gardenItems = db.prepare(`
      SELECT gi.*, ug.position_x, ug.position_y
      FROM garden_items gi
      JOIN user_garden ug ON gi.id = ug.garden_item_id
      WHERE ug.user_id = ? AND ug.is_active = 1
    `).all(userId)

    res.json(gardenItems)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch garden' })
  }
})

router.post('/purchase', (req, res) => {
  const { userId, itemId, itemType } = req.body

  if (!userId || !itemId || !itemType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    let item: any
    let tableName: string

    if (itemType === 'character') {
      item = db.prepare('SELECT * FROM character_items WHERE id = ?').get(itemId) as any
      tableName = 'character_items'
    } else if (itemType === 'garden') {
      item = db.prepare('SELECT * FROM garden_items WHERE id = ?').get(itemId) as any
      tableName = 'garden_items'
    } else {
      return res.status(400).json({ error: 'Invalid item type' })
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (user.points < item.price) {
      return res.status(400).json({ error: 'Not enough points' })
    }

    const existingItem = db.prepare('SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ? AND item_type = ?').get(userId, itemId, itemType) as any

    if (existingItem) {
      return res.status(400).json({ error: 'Item already owned' })
    }

    db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(item.price, userId)

    db.prepare(`
      INSERT INTO user_inventory (user_id, item_id, item_type)
      VALUES (?, ?, ?)
    `).run(userId, itemId, itemType)

    res.json({ success: true, points: user.points - item.price })
  } catch (error) {
    res.status(500).json({ error: 'Failed to purchase item' })
  }
})

router.post('/equip', (req, res) => {
  const { userId, itemId, itemType } = req.body

  if (!userId || !itemId || !itemType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    db.prepare(`
      UPDATE user_inventory
      SET is_equipped = 0
      WHERE user_id = ? AND item_type = ?
    `).run(userId, itemType)

    db.prepare(`
      UPDATE user_inventory
      SET is_equipped = 1
      WHERE user_id = ? AND item_id = ? AND item_type = ?
    `).run(userId, itemId, itemType)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to equip item' })
  }
})

router.post('/garden/place', (req, res) => {
  const { userId, gardenItemId, positionX, positionY } = req.body

  if (!userId || !gardenItemId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const existingPlacement = db.prepare('SELECT * FROM user_garden WHERE user_id = ? AND garden_item_id = ?').get(userId, gardenItemId) as any

    if (existingPlacement) {
      db.prepare(`
        UPDATE user_garden
        SET position_x = ?, position_y = ?, is_active = 1
        WHERE user_id = ? AND garden_item_id = ?
      `).run(positionX || 0, positionY || 0, userId, gardenItemId)
    } else {
      db.prepare(`
        INSERT INTO user_garden (user_id, garden_item_id, position_x, position_y)
        VALUES (?, ?, ?, ?)
      `).run(userId, gardenItemId, positionX || 0, positionY || 0)
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to place garden item' })
  }
})

router.delete('/garden/:userId/:gardenItemId', (req, res) => {
  const { userId, gardenItemId } = req.params

  try {
    db.prepare(`
      UPDATE user_garden
      SET is_active = 0
      WHERE user_id = ? AND garden_item_id = ?
    `).run(userId, gardenItemId)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove garden item' })
  }
})

router.get('/achievements', (req, res) => {
  try {
    const achievements = db.prepare('SELECT * FROM achievements ORDER BY reward_points DESC').all()

    res.json(achievements)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch achievements' })
  }
})

router.get('/achievements/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const userAchievements = db.prepare(`
      SELECT a.*, ua.unlocked_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `).all(userId)

    res.json(userAchievements)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user achievements' })
  }
})

router.post('/achievements/check', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    const totalWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ?').get(userId) as { count: number }
    const reviews = db.prepare('SELECT COUNT(*) as count FROM learning_records WHERE user_id = ? AND record_type = "review"').get(userId) as { count: number }

    const achievements = db.prepare('SELECT * FROM achievements').all() as any[]

    const newAchievements: any[] = []

    for (const achievement of achievements) {
      const existing = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievement.id) as any

      if (existing) continue

      let unlocked = false

      switch (achievement.condition_type) {
        case 'words_learned':
          unlocked = totalWords.count >= achievement.condition_value
          break
        case 'review_count':
          unlocked = reviews.count >= achievement.condition_value
          break
        case 'consecutive_days':
          const lastLogin = new Date(user.last_login)
          const today = new Date()
          const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          unlocked = daysDiff >= achievement.condition_value
          break
        case 'weekly_goal':
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          weekStart.setHours(0, 0, 0, 0)

          const weeklyGoal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any
          unlocked = weeklyGoal && weeklyGoal.is_completed === 1
          break
      }

      if (unlocked) {
        db.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, achievement.id)
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(achievement.reward_points, userId)
        newAchievements.push(achievement)
      }
    }

    res.json({ newAchievements, points: user.points })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check achievements' })
  }
})

router.get('/weekly-goals/:userId', (req, res) => {
  const { userId } = req.params

  try {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    let goal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any

    if (!goal) {
      const result = db.prepare(`
        INSERT INTO weekly_goals (user_id, week_start, target_words, learned_words)
        VALUES (?, ?, 30, 0)
      `).run(userId, weekStart.toISOString())

      goal = db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(result.lastInsertRowid) as any
    }

    res.json(goal)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly goal' })
  }
})

router.post('/weekly-goals/update', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const goal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any

    if (!goal) {
      return res.status(404).json({ error: 'Weekly goal not found' })
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

    res.json({ success: true, learnedWords, isCompleted })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update weekly goal' })
  }
})

router.post('/penalty', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const goal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start >= ?').get(userId, weekStart.toISOString()) as any

    if (!goal || goal.is_completed === 1) {
      return res.json({ success: true, penalty: false })
    }

    const inventoryItems = db.prepare(`
      SELECT * FROM user_inventory
      WHERE user_id = ? AND is_equipped = 0
      ORDER BY purchased_at ASC
      LIMIT 2
    `).all(userId) as any[]

    const removedItems: any[] = []

    for (const item of inventoryItems) {
      if (item.item_type === 'character') {
        db.prepare('DELETE FROM user_inventory WHERE id = ?').run(item.id)
      } else if (item.item_type === 'garden') {
        db.prepare('DELETE FROM user_inventory WHERE id = ?').run(item.id)
        db.prepare('UPDATE user_garden SET is_active = 0 WHERE user_id = ? AND garden_item_id = ?').run(userId, item.item_id)
      }
      removedItems.push(item)
    }

    res.json({ success: true, penalty: true, removedItems })
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply penalty' })
  }
})

export default router