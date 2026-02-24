import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = process.env.RAILWAY ? '/app/data' : (process.env.RENDER ? '/opt/render/project/data' : path.join(__dirname, '../../data'))
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'garden.db')
const db = new Database(dbPath)

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT UNIQUE NOT NULL,
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      phonetic TEXT,
      meaning TEXT NOT NULL,
      example TEXT,
      example_translation TEXT,
      context_description TEXT,
      difficulty TEXT DEFAULT 'medium',
      category TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      learned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mastery_level INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      next_review DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (word_id) REFERENCES words(id),
      UNIQUE(user_id, word_id)
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      record_type TEXT NOT NULL,
      result TEXT NOT NULL,
      time_spent INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (word_id) REFERENCES words(id)
    );

    CREATE TABLE IF NOT EXISTS character_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS garden_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      is_equipped INTEGER DEFAULT 0,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, item_id, item_type)
    );

    CREATE TABLE IF NOT EXISTS user_garden (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      garden_item_id INTEGER NOT NULL,
      position_x INTEGER,
      position_y INTEGER,
      is_active INTEGER DEFAULT 1,
      placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (garden_item_id) REFERENCES garden_items(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start DATETIME NOT NULL,
      target_words INTEGER DEFAULT 30,
      learned_words INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      condition_type TEXT NOT NULL,
      condition_value INTEGER,
      reward_points INTEGER DEFAULT 0,
      icon_url TEXT
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id),
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS listening_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      translation TEXT,
      difficulty TEXT DEFAULT 'easy',
      duration INTEGER,
      related_words TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_type TEXT NOT NULL,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      time_spent INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  insertInitialData()
}

function insertInitialData() {
  const characterCount = db.prepare('SELECT COUNT(*) as count FROM character_items').get() as { count: number }
  if (characterCount.count === 0) {
    const characterItems = [
      { name: '粉色连衣裙', type: 'clothing', description: '可爱的粉色连衣裙', price: 100, is_default: 1 },
      { name: '蓝色帽子', type: 'accessory', description: '漂亮的蓝色帽子', price: 80, is_default: 0 },
      { name: '彩虹围巾', type: 'accessory', description: '美丽的彩虹围巾', price: 120, is_default: 0 },
      { name: '花朵发卡', type: 'accessory', description: '可爱的花朵发卡', price: 60, is_default: 0 },
      { name: '小熊背包', type: 'accessory', description: '可爱的小熊背包', price: 150, is_default: 0 },
      { name: '蝴蝶结', type: 'accessory', description: '漂亮的蝴蝶结', price: 70, is_default: 0 },
      { name: '星星发饰', type: 'accessory', description: '闪亮的星星发饰', price: 90, is_default: 0 },
      { name: '月亮项链', type: 'accessory', description: '神秘的月亮项链', price: 110, is_default: 0 },
    ]

    const insertCharacter = db.prepare(`
      INSERT INTO character_items (name, type, description, price, is_default)
      VALUES (?, ?, ?, ?, ?)
    `)

    characterItems.forEach(item => {
      insertCharacter.run(item.name, item.type, item.description, item.price, item.is_default)
    })
  }

  const gardenCount = db.prepare('SELECT COUNT(*) as count FROM garden_items').get() as { count: number }
  if (gardenCount.count === 0) {
    const gardenItems = [
      { name: '向日葵', type: 'flower', description: '明亮的向日葵', price: 50 },
      { name: '玫瑰', type: 'flower', description: '美丽的玫瑰', price: 60 },
      { name: '郁金香', type: 'flower', description: '优雅的郁金香', price: 55 },
      { name: '小树', type: 'plant', description: '可爱的小树', price: 80 },
      { name: '灌木', type: 'plant', description: '茂盛的灌木', price: 40 },
      { name: '喷泉', type: 'decoration', description: '漂亮的喷泉', price: 200 },
      { name: '小桥', type: 'decoration', description: '可爱的小桥', price: 150 },
      { name: '长椅', type: 'furniture', description: '舒适的长椅', price: 100 },
      { name: '路灯', type: 'decoration', description: '温暖的路灯', price: 90 },
      { name: '小鸟屋', type: 'decoration', description: '可爱的小鸟屋', price: 120 },
    ]

    const insertGarden = db.prepare(`
      INSERT INTO garden_items (name, type, description, price)
      VALUES (?, ?, ?, ?)
    `)

    gardenItems.forEach(item => {
      insertGarden.run(item.name, item.type, item.description, item.price)
    })
  }

  const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number }
  if (achievementCount.count === 0) {
    const achievements = [
      { name: '初学者', description: '学习第一个单词', condition_type: 'words_learned', condition_value: 1, reward_points: 50 },
      { name: '勤奋学生', description: '学习10个单词', condition_type: 'words_learned', condition_value: 10, reward_points: 100 },
      { name: '单词达人', description: '学习50个单词', condition_type: 'words_learned', condition_value: 50, reward_points: 300 },
      { name: '单词大师', description: '学习100个单词', condition_type: 'words_learned', condition_value: 100, reward_points: 500 },
      { name: '坚持一周', description: '连续学习7天', condition_type: 'consecutive_days', condition_value: 7, reward_points: 200 },
      { name: '坚持一月', description: '连续学习30天', condition_type: 'consecutive_days', condition_value: 30, reward_points: 500 },
      { name: '完美周', description: '一周内完成学习目标', condition_type: 'weekly_goal', condition_value: 1, reward_points: 150 },
      { name: '复习专家', description: '复习100次', condition_type: 'review_count', condition_value: 100, reward_points: 200 },
    ]

    const insertAchievement = db.prepare(`
      INSERT INTO achievements (name, description, condition_type, condition_value, reward_points)
      VALUES (?, ?, ?, ?, ?)
    `)

    achievements.forEach(achievement => {
      insertAchievement.run(achievement.name, achievement.description, achievement.condition_type, achievement.condition_value, achievement.reward_points)
    })
  }

  const wordCount = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number }
  if (wordCount.count === 0) {
    const words = [
      { word: 'garden', phonetic: '/ˈɡɑːrdn/', meaning: '花园', example: 'The garden is full of beautiful flowers.', example_translation: '花园里开满了美丽的花。', context_description: '花园宝宝们喜欢在花园里玩耍，这里有各种各样的花朵和植物。', difficulty: 'easy', category: 'nature' },
      { word: 'flower', phonetic: '/ˈflaʊər/', meaning: '花', example: 'I love to pick flowers in the garden.', example_translation: '我喜欢在花园里摘花。', context_description: '花园里有很多漂亮的花朵，有红色的、黄色的、紫色的。', difficulty: 'easy', category: 'nature' },
      { word: 'sun', phonetic: '/sʌn/', meaning: '太阳', example: 'The sun shines brightly in the sky.', example_translation: '太阳在天空中明亮地照耀着。', context_description: '太阳公公每天都会从东边升起，给花园带来温暖和光明。', difficulty: 'easy', category: 'nature' },
      { word: 'moon', phonetic: '/muːn/', meaning: '月亮', example: 'The moon is bright tonight.', example_translation: '今晚的月亮很亮。', context_description: '月亮姐姐会在晚上出来，用柔和的光芒照着花园。', difficulty: 'easy', category: 'nature' },
      { word: 'star', phonetic: '/stɑːr/', meaning: '星星', example: 'I can see many stars in the night sky.', example_translation: '我能在夜空中看到很多星星。', context_description: '夜晚的天空中有很多闪亮的星星，像小眼睛一样眨呀眨。', difficulty: 'easy', category: 'nature' },
      { word: 'rainbow', phonetic: '/ˈreɪnboʊ/', meaning: '彩虹', example: 'Look at the beautiful rainbow!', example_translation: '看那美丽的彩虹！', context_description: '雨后会出现美丽的彩虹，有红、橙、黄、绿、青、蓝、紫七种颜色。', difficulty: 'easy', category: 'nature' },
      { word: 'butterfly', phonetic: '/ˈbʌtərflaɪ/', meaning: '蝴蝶', example: 'The butterfly is flying in the garden.', example_translation: '蝴蝶在花园里飞舞。', context_description: '蝴蝶有漂亮的翅膀，它们在花丛中飞来飞去，非常美丽。', difficulty: 'medium', category: 'animal' },
      { word: 'bird', phonetic: '/bɜːrd/', meaning: '鸟', example: 'The bird is singing a beautiful song.', example_translation: '鸟儿在唱着动听的歌。', context_description: '小鸟在树上唱歌，它们的歌声非常好听。', difficulty: 'easy', category: 'animal' },
      { word: 'tree', phonetic: '/triː/', meaning: '树', example: 'The tree is very tall.', example_translation: '这棵树很高。', context_description: '花园里有很多树，它们给花园提供阴凉。', difficulty: 'easy', category: 'nature' },
      { word: 'grass', phonetic: '/ɡræs/', meaning: '草', example: 'The grass is green and soft.', example_translation: '草是绿色的，很柔软。', context_description: '花园的地上铺满了绿色的草，踩上去很舒服。', difficulty: 'easy', category: 'nature' },
      { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的', example: 'I am very happy today.', example_translation: '我今天很开心。', context_description: '花园宝宝们每天都过得很快乐，他们一起玩耍、唱歌。', difficulty: 'easy', category: 'emotion' },
      { word: 'love', phonetic: '/lʌv/', meaning: '爱', example: 'I love my family.', example_translation: '我爱我的家人。', context_description: '花园宝宝们互相爱护，他们之间充满了爱。', difficulty: 'easy', category: 'emotion' },
      { word: 'friend', phonetic: '/frend/', meaning: '朋友', example: 'She is my best friend.', example_translation: '她是我最好的朋友。', context_description: '花园宝宝们都是好朋友，他们一起分享快乐。', difficulty: 'easy', category: 'relationship' },
      { word: 'play', phonetic: '/pleɪ/', meaning: '玩', example: 'Let\'s play together!', example_translation: '让我们一起玩吧！', context_description: '花园宝宝们最喜欢在花园里玩耍，他们玩各种有趣的游戏。', difficulty: 'easy', category: 'action' },
      { word: 'sing', phonetic: '/sɪŋ/', meaning: '唱歌', example: 'Can you sing a song for me?', example_translation: '你能为我唱首歌吗？', context_description: '花园宝宝们喜欢唱歌，他们的歌声非常动听。', difficulty: 'easy', category: 'action' },
      { word: 'dance', phonetic: '/dæns/', meaning: '跳舞', example: 'They are dancing in the garden.', example_translation: '他们在花园里跳舞。', context_description: '花园宝宝们喜欢跳舞，他们的舞姿非常优美。', difficulty: 'medium', category: 'action' },
      { word: 'dream', phonetic: '/driːm/', meaning: '梦想', example: 'I have a beautiful dream.', example_translation: '我有一个美丽的梦想。', context_description: '每个花园宝宝都有自己的梦想，他们努力实现自己的梦想。', difficulty: 'medium', category: 'emotion' },
      { word: 'magic', phonetic: '/ˈmædʒɪk/', meaning: '魔法', example: 'The fairy has magic powers.', example_translation: '仙女有魔法力量。', context_description: '花园里有一些神奇的魔法，让一切都变得有趣。', difficulty: 'medium', category: 'fantasy' },
      { word: 'adventure', phonetic: '/ədˈventʃər/', meaning: '冒险', example: 'Let\'s go on an adventure!', example_translation: '让我们去冒险吧！', context_description: '花园宝宝们喜欢冒险，他们探索花园的每一个角落。', difficulty: 'medium', category: 'action' },
      { word: 'wonderful', phonetic: '/ˈwʌndərfl/', meaning: '精彩的', example: 'What a wonderful day!', example_translation: '多么美好的一天啊！', context_description: '花园里的每一天都是精彩的，充满了惊喜和快乐。', difficulty: 'medium', category: 'emotion' },
    ]

    const insertWord = db.prepare(`
      INSERT INTO words (word, phonetic, meaning, example, example_translation, context_description, difficulty, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    words.forEach(word => {
      insertWord.run(word.word, word.phonetic, word.meaning, word.example, word.example_translation, word.context_description, word.difficulty, word.category)
    })
  }

  const listeningCount = db.prepare('SELECT COUNT(*) as count FROM listening_materials').get() as { count: number }
  if (listeningCount.count === 0) {
    const listeningMaterials = [
      { title: '花园里的早晨', content: 'Good morning! The sun is shining in the garden. The flowers are blooming and the birds are singing. It is a beautiful day. The garden babies are happy to play outside.', translation: '早上好！太阳在花园里照耀着。花儿正在盛开，鸟儿在歌唱。这是美好的一天。花园宝宝们很高兴在外面玩耍。', difficulty: 'easy', related_words: 'garden,sun,flower,bird,happy' },
      { title: '彩虹的传说', content: 'After the rain, a rainbow appears in the sky. It has seven colors: red, orange, yellow, green, blue, indigo and violet. The rainbow is very beautiful. The garden babies love to look at the rainbow.', translation: '雨后，天空中出现了彩虹。它有七种颜色：红、橙、黄、绿、蓝、靛、紫。彩虹非常美丽。花园宝宝们喜欢看彩虹。', difficulty: 'easy', related_words: 'rainbow,beautiful,love' },
      { title: '蝴蝶的舞蹈', content: 'Look at the butterfly! It has colorful wings. It is flying from flower to flower. The butterfly is dancing in the garden. It is so graceful and beautiful.', translation: '看那只蝴蝶！它有彩色的翅膀。它从一朵花飞到另一朵花。蝴蝶在花园里跳舞。它如此优雅和美丽。', difficulty: 'easy', related_words: 'butterfly,flower,garden,beautiful' },
      { title: '夜晚的星星', content: 'The night is dark but the stars are bright. There are many stars in the sky. They are like little diamonds. The moon is also shining. The garden babies are sleeping peacefully under the stars.', translation: '夜晚是黑暗的，但星星是明亮的。天空中有很多星星。它们像小钻石一样。月亮也在照耀。花园宝宝们在星星下安详地睡着。', difficulty: 'easy', related_words: 'star,moon,night' },
      { title: '友谊之歌', content: 'Friends are important. They help each other and play together. The garden babies are good friends. They share their toys and food. They laugh and sing together. Friendship makes everyone happy.', translation: '朋友很重要。他们互相帮助，一起玩耍。花园宝宝们是好朋友。他们分享玩具和食物。他们一起笑，一起唱歌。友谊让每个人都快乐。', difficulty: 'easy', related_words: 'friend,happy,play' },
    ]

    const insertListening = db.prepare(`
      INSERT INTO listening_materials (title, content, translation, difficulty, related_words)
      VALUES (?, ?, ?, ?, ?)
    `)

    listeningMaterials.forEach(material => {
      insertListening.run(material.title, material.content, material.translation, material.difficulty, material.related_words)
    })
  }
}

export default db