import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface PracticeProps {
  user: any
}

type PracticeType = 'dictation' | 'listening' | 'fill-blank'

const Practice: React.FC<PracticeProps> = ({ user }) => {
  const [practiceType, setPracticeType] = useState<PracticeType | null>(null)
  const [words, setWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [listeningMaterials, setListeningMaterials] = useState<any[]>([])
  const [currentListening, setCurrentListening] = useState<any>(null)

  useEffect(() => {
    if (practiceType === 'listening') {
      fetchListeningMaterials()
    }
  }, [practiceType])

  const startPractice = async (type: PracticeType) => {
    setPracticeType(type)
    setLoading(true)

    if (type !== 'listening') {
      try {
        const response = await axios.get(`http://localhost:5000/api/words/user/${user.id}/learned`)
        const learnedWords = response.data.slice(0, 10)
        setWords(learnedWords)
        setCurrentIndex(0)
        setUserAnswer('')
        setShowResult(false)
        setCorrectCount(0)
        setCompleted(false)
      } catch (error) {
        console.error('Failed to fetch words:', error)
      }
    }

    setLoading(false)
  }

  const fetchListeningMaterials = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/learning/listening/${user.id}`)
      setListeningMaterials(response.data)
      setCurrentListening(response.data[0])
      setCurrentIndex(0)
      setCorrectCount(0)
      setCompleted(false)
    } catch (error) {
      console.error('Failed to fetch listening materials:', error)
    }
  }

  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  const handleSubmit = () => {
    if (!userAnswer.trim()) return

    const currentWord = words[currentIndex]
    const isCorrect = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase()

    if (isCorrect) {
      setCorrectCount(correctCount + 1)
    }

    setShowResult(true)
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer('')
      setShowResult(false)
    } else {
      setCompleted(true)
    }
  }

  const handleListeningNext = () => {
    if (currentIndex < listeningMaterials.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentListening(listeningMaterials[currentIndex + 1])
    } else {
      setCompleted(true)
    }
  }

  const handleBack = () => {
    setPracticeType(null)
    setWords([])
    setCurrentIndex(0)
    setUserAnswer('')
    setShowResult(false)
    setCorrectCount(0)
    setCompleted(false)
  }

  if (!practiceType) {
    return (
      <div>
        <h1 className="garden-title">✏️ 练习巩固</h1>

        <div className="garden-card">
          <h2 className="garden-subtitle">选择练习类型</h2>
          <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
            <div 
              onClick={() => startPractice('dictation')}
              style={{ 
                padding: '30px', 
                background: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)', 
                borderRadius: '20px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>🎧</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                听写练习
              </div>
              <div style={{ fontSize: '16px', color: 'white', opacity: 0.9 }}>
                听发音，拼写单词
              </div>
            </div>

            <div 
              onClick={() => startPractice('listening')}
              style={{ 
                padding: '30px', 
                background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)', 
                borderRadius: '20px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>📻</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                听力理解
              </div>
              <div style={{ fontSize: '16px', color: 'white', opacity: 0.9 }}>
                听故事，回答问题
              </div>
            </div>

            <div 
              onClick={() => startPractice('fill-blank')}
              style={{ 
                padding: '30px', 
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
                borderRadius: '20px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>📝</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                填空练习
              </div>
              <div style={{ fontSize: '16px', color: 'white', opacity: 0.9 }}>
                在句子中填入正确的单词
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
        <p>正在准备练习...</p>
      </div>
    )
  }

  if (practiceType === 'listening') {
    if (completed) {
      return (
        <div>
          <h1 className="garden-title">🎉 听力练习完成！🎉</h1>
          <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🌟</div>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
              太棒了！你完成了所有听力练习！
            </h2>
            <button className="garden-button" onClick={handleBack}>
              返回练习选择 📚
            </button>
          </div>
        </div>
      )
    }

    if (!currentListening) {
      return (
        <div>
          <h1 className="garden-title">📻 听力理解</h1>
          <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
            <p>暂无听力材料</p>
            <button className="garden-button" onClick={handleBack} style={{ marginTop: '20px' }}>
              返回
            </button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <h1 className="garden-title">📻 听力理解</h1>

        <div className="garden-card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <button 
              className="garden-button"
              onClick={() => speakText(currentListening.content)}
              style={{ fontSize: '18px', padding: '15px 30px' }}
            >
              🔊 播放音频
            </button>
          </div>

          <div className="word-card">
            <h3 style={{ fontSize: '24px', marginBottom: '20px', color: '#DDA0DD' }}>
              {currentListening.title}
            </h3>
            <p style={{ fontSize: '18px', lineHeight: '2', marginBottom: '20px' }}>
              {currentListening.content}
            </p>
            <div style={{ 
              padding: '20px', 
              background: '#FFF8DC', 
              borderRadius: '15px',
              marginTop: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FFA500' }}>
                中文翻译：
              </div>
              <p style={{ lineHeight: '1.8', color: '#4A4A4A' }}>
                {currentListening.translation}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button className="garden-button" onClick={handleListeningNext}>
              下一个 ➡️
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div>
        <h1 className="garden-title">🎉 练习完成！🎉</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🌟</div>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
            练习完成！
          </h2>
          <p style={{ fontSize: '24px', marginBottom: '30px', color: '#4A4A4A' }}>
            正确率：{Math.round((correctCount / words.length) * 100)}%
          </p>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#888' }}>
            {correctCount} / {words.length} 个单词正确
          </p>
          <button className="garden-button" onClick={handleBack}>
            返回练习选择 📚
          </button>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div>
        <h1 className="garden-title">✏️ 练习巩固</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <p>你还没有学习足够的单词，先去学习一些新单词吧！</p>
          <button className="garden-button" onClick={handleBack} style={{ marginTop: '20px' }}>
            返回
          </button>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <div>
      <h1 className="garden-title">
        {practiceType === 'dictation' ? '🎧 听写练习' : '📝 填空练习'}
      </h1>

      <div className="garden-card">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
          进度：{currentIndex + 1} / {words.length}
        </p>

        <div className="word-card">
          {practiceType === 'dictation' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '20px', color: '#888' }}>
                点击按钮听发音，然后拼写单词
              </div>
              <button 
                className="garden-button"
                onClick={() => speakWord(currentWord.word)}
                style={{ fontSize: '18px', padding: '15px 30px', marginBottom: '30px' }}
              >
                🔊 播放发音
              </button>

              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="garden-input"
                placeholder="输入单词..."
                style={{ marginBottom: '20px', textAlign: 'center', fontSize: '20px' }}
                disabled={showResult}
                autoFocus
              />

              {!showResult ? (
                <button 
                  className="garden-button"
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  style={{ width: '100%' }}
                >
                  提交答案 ✅
                </button>
              ) : (
                <>
                  <div style={{ 
                    padding: '20px', 
                    borderRadius: '15px',
                    background: userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                      ? '#E8F5E9' 
                      : '#FFEBEE',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                        ? '#4CAF50' 
                        : '#F44336',
                      marginBottom: '10px'
                    }}>
                      {userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                        ? '✅ 正确！' 
                        : '❌ 错误'}
                    </div>
                    {userAnswer.toLowerCase().trim() !== currentWord.word.toLowerCase() && (
                      <div style={{ fontSize: '20px', color: '#4A4A4A' }}>
                        正确答案：<strong>{currentWord.word}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="garden-button" onClick={handleNext}>
                      下一个 ➡️
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '20px', color: '#888' }}>
                根据例句，填入正确的单词
              </div>

              <div className="word-example" style={{ textAlign: 'left', marginBottom: '30px' }}>
                {currentWord.example.replace(
                  new RegExp(currentWord.word, 'gi'),
                  '_____'
                )}
              </div>

              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="garden-input"
                placeholder="填入单词..."
                style={{ marginBottom: '20px', textAlign: 'center', fontSize: '20px' }}
                disabled={showResult}
                autoFocus
              />

              {!showResult ? (
                <button 
                  className="garden-button"
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  style={{ width: '100%' }}
                >
                  提交答案 ✅
                </button>
              ) : (
                <>
                  <div style={{ 
                    padding: '20px', 
                    borderRadius: '15px',
                    background: userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                      ? '#E8F5E9' 
                      : '#FFEBEE',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                        ? '#4CAF50' 
                        : '#F44336',
                      marginBottom: '10px'
                    }}>
                      {userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase() 
                        ? '✅ 正确！' 
                        : '❌ 错误'}
                    </div>
                    {userAnswer.toLowerCase().trim() !== currentWord.word.toLowerCase() && (
                      <div style={{ fontSize: '20px', color: '#4A4A4A' }}>
                        正确答案：<strong>{currentWord.word}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="garden-button" onClick={handleNext}>
                      下一个 ➡️
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Practice