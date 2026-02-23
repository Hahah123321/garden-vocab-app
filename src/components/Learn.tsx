import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface LearnProps {
  user: any
}

const Learn: React.FC<LearnProps> = ({ user }) => {
  const [words, setWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    fetchNewWords()
  }, [user.id])

  const fetchNewWords = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/api/words/user/${user.id}/new?limit=5`)
      setWords(response.data)
      setCurrentIndex(0)
      setShowMeaning(false)
      setCompleted(false)
    } catch (error) {
      console.error('Failed to fetch new words:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowMeaning = () => {
    setShowMeaning(true)
  }

  const handleNext = async (result: 'correct' | 'incorrect') => {
    const currentWord = words[currentIndex]

    try {
      await axios.post('http://localhost:5000/api/learning/learn', {
        userId: user.id,
        wordId: currentWord.id,
        result,
        timeSpent: 30
      })

      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowMeaning(false)
      } else {
        setCompleted(true)
      }
    } catch (error) {
      console.error('Failed to record learning:', error)
    }
  }

  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🌸</div>
        <p>正在加载单词...</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div>
        <h1 className="garden-title">🎉 学习完成！🎉</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🌟</div>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
            太棒了！你已经完成了今天的学习任务！
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#4A4A4A' }}>
            继续加油，明天也要来学习哦！
          </p>
          <button className="garden-button" onClick={fetchNewWords}>
            继续学习更多单词 📚
          </button>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div>
        <h1 className="garden-title">📖 学习新单词</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
            恭喜！你已经学习了所有单词！
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#4A4A4A' }}>
            去复习一下学过的单词吧！
          </p>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <div>
      <h1 className="garden-title">📖 学习新单词</h1>

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
          <div style={{ textAlign: 'center' }}>
            {currentWord.image_url && (
              <img
                src={`http://localhost:5000${currentWord.image_url}`}
                alt={currentWord.word}
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '15px',
                  marginBottom: '20px'
                }}
              />
            )}
            <div className="word-text">{currentWord.word}</div>
            <div className="word-phonetic">
              {currentWord.phonetic}
              <button 
                onClick={() => speakWord(currentWord.word)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '24px',
                  marginLeft: '10px'
                }}
              >
                🔊
              </button>
            </div>
            
            {!showMeaning ? (
              <button 
                className="garden-button" 
                onClick={handleShowMeaning}
                style={{ marginTop: '20px' }}
              >
                查看释义 👁️
              </button>
            ) : (
              <>
                <div className="word-meaning">{currentWord.meaning}</div>
                
                {currentWord.example && (
                  <div className="word-example">
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#87CEEB' }}>
                      例句：
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      {currentWord.example}
                    </div>
                    <div style={{ color: '#888', fontStyle: 'italic' }}>
                      {currentWord.example_translation}
                    </div>
                  </div>
                )}

                {currentWord.context_description && (
                  <div className="word-example" style={{ marginTop: '20px', borderLeftColor: '#FFB6C1' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FFB6C1' }}>
                      🌸 花园宝宝情境：
                    </div>
                    <div>{currentWord.context_description}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                  <button 
                    className="garden-button"
                    onClick={() => handleNext('incorrect')}
                    style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' }}
                  >
                    😅 还没记住
                  </button>
                  <button 
                    className="garden-button"
                    onClick={() => handleNext('correct')}
                    style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' }}
                  >
                    😊 记住了
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Learn