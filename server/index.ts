import express from 'express'
import cors from 'cors'
import path from 'path'
import { initDatabase } from './database/init'
import userRoutes from './routes/userRoutes'
import wordRoutes from './routes/wordRoutes'
import learningRoutes from './routes/learningRoutes'
import gameRoutes from './routes/gameRoutes'
import uploadRoutes from './routes/uploadRoutes'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

initDatabase()

app.use('/api/users', userRoutes)
app.use('/api/words', wordRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/upload', uploadRoutes)

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})