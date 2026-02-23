import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface ReviewProps {
  user: any
}

const Review: React.FC<ReviewProps> = ({ user }) => {
  const [words, setWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    fetchReviewWords()
  }, [user.id])

  const fetchReviewWords = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/api/words/user/${user.id}/review`)
      setWords(response.data)
      setCurrentIndex(0)
      setShowAnswer(false)
      setCompleted(false)
      setCorrectCount(0)
    } catch (error) {
      console.error('Failed to fetch review words:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleNext = async (result: 'correct' | 'incorrect') => {
    const currentWord = words[currentIndex]

    try {
      await axios.post('http://localhost:5000/api/learning/review', {
        userId: user.id,
        wordId: currentWord.id,
        result,
        timeSpent: 15
      })

      if (result === 'correct') {
        setCorrectCount(correctCount + 1)
      }

      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        setCompleted(true)
      }
    } catch (error) {
      console.error('Failed to record review:', error)
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
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔄</div>
        <p>正在加载需要复习的单词...</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div>
        <h1 className="garden-title">🎉 复习完成！🎉</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🌟</div>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
            复习完成！
          </h2>
          <p style={{ fontSize: '24px', marginBottom: '30px', color: '#4A4A4A' }}>
            正确率：{Math.round((correctCount / words.length) * 100)}%
          </p>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#888' }}>
            {correctCount} / {words.length} 个单词回答正确
          </p>
          <button className="garden-button" onClick={fetchReviewWords}>
            继续复习 🔄
          </button>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div>
        <h1 className="garden-title">🔄 单词复习</h1>
        <div className="garden-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#DDA0DD' }}>
            太棒了！暂时没有需要复习的单词
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#4A4A4A' }}>
            去学习一些新单词吧！
          </p>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <div>
      <h1 className="garden-title">🔄 单词复习</h1>

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

            <div style={{ marginTop: '20px', fontSize: '18px', color: '#888' }}>
              掌握程度：{'⭐'.repeat(Math.min(currentWord.mastery_level + 1, 5))}
            </div>
            
            {!showAnswer ? (
              <button 
                className="garden-button" 
                onClick={handleShowAnswer}
                style={{ marginTop: '30px' }}
              >
                显示答案 👁️
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

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                  <button 
                    className="garden-button"
                    onClick={() => handleNext('incorrect')}
                    style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' }}
                  >
                    😅 不记得了
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

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 复习提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>根据艾宾浩斯遗忘曲线，及时复习可以大大提高记忆效果</li>
          <li>掌握程度越高，下次复习的间隔时间越长</li>
          <li>如果忘记了一个单词，不要担心，多复习几次就能记住</li>
        </ul>
      </div>
    </div>
  )
}

export default Review