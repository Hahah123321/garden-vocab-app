import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface DashboardProps {
  user: any
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<any>(null)
  const [weeklyGoal, setWeeklyGoal] = useState<any>(null)
  const [recentAchievements, setRecentAchievements] = useState<any[]>([])
  const [reviewReminders, setReviewReminders] = useState<any>(null)
  const [checkingGoal, setCheckingGoal] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchWeeklyGoal()
    fetchRecentAchievements()
    fetchReviewReminders()
  }, [user.id])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchWeeklyGoal = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/weekly-goals/${user.id}`)
      setWeeklyGoal(response.data)
    } catch (error) {
      console.error('Failed to fetch weekly goal:', error)
    }
  }

  const fetchRecentAchievements = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/achievements/${user.id}`)
      setRecentAchievements(response.data.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    }
  }

  const fetchReviewReminders = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/upload/reminders/${user.id}`)
      setReviewReminders(response.data)
    } catch (error) {
      console.error('Failed to fetch review reminders:', error)
    }
  }

  const handleCheckWeeklyGoal = async () => {
    setCheckingGoal(true)
    try {
      const response = await axios.post('http://localhost:5000/api/upload/weekly-goal/check', {
        userId: user.id
      })

      if (response.data.penaltyApplied) {
        const penaltyItems = response.data.penaltyItems
        alert(`⚠️ 本周目标未完成！\n\n以下物品已被摧毁：\n${penaltyItems.map((item: any) => `• ${item.name}`).join('\n')}`)
      } else if (response.data.isCompleted) {
        alert('🎉 恭喜！本周目标已完成！')
      } else {
        alert(`本周目标进度：${response.data.goal.learned_words} / ${response.data.goal.target_words} 个单词`)
      }

      fetchWeeklyGoal()
    } catch (error: any) {
      console.error('Failed to check weekly goal:', error)
      alert(error.response?.data?.error || '检查失败，请重试')
    } finally {
      setCheckingGoal(false)
    }
  }

  const getProgressPercentage = () => {
    if (!weeklyGoal) return 0
    return Math.min(100, Math.round((weeklyGoal.learned_words / weeklyGoal.target_words) * 100))
  }

  return (
    <div>
      <h1 className="garden-title">🌸 欢迎回来，{user.nickname}！🌸</h1>

      <div className="score-display">
        <div className="score-item">
          <div className="score-value">⭐ {user.points}</div>
          <div className="score-label">积分</div>
        </div>
        {stats && (
          <>
            <div className="score-item">
              <div className="score-value">📚 {stats.totalWords}</div>
              <div className="score-label">已学单词</div>
            </div>
            <div className="score-item">
              <div className="score-value">🔄 {stats.reviews}</div>
              <div className="score-label">复习次数</div>
            </div>
            <div className="score-item">
              <div className="score-value">🏆 {stats.achievements}</div>
              <div className="score-label">成就</div>
            </div>
          </>
        )}
      </div>

      {weeklyGoal && (
        <div className="garden-card">
          <h2 className="garden-subtitle">📅 本周学习目标</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '18px' }}>
            已学习 {weeklyGoal.learned_words} / {weeklyGoal.target_words} 个新单词
          </p>
          {weeklyGoal.is_completed === 1 && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '15px', 
              color: '#4CAF50', 
              fontWeight: 'bold',
              fontSize: '20px'
            }}>
              🎉 恭喜！本周目标已完成！🎉
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              className="garden-button"
              onClick={handleCheckWeeklyGoal}
              disabled={checkingGoal}
              style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)' }}
            >
              {checkingGoal ? '检查中...' : '📊 检查周目标'}
            </button>
          </div>
        </div>
      )}

      {reviewReminders && reviewReminders.overdueCount > 0 && (
        <div className="garden-card" style={{ 
          background: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)',
          border: '3px solid #FFA500'
        }}>
          <h2 className="garden-subtitle">⏰ 复习提醒</h2>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
            <p style={{ fontSize: '20px', color: '#FF6B6B', fontWeight: 'bold', marginBottom: '10px' }}>
              你有 {reviewReminders.overdueCount} 个单词需要复习！
            </p>
            <p style={{ fontSize: '16px', color: '#4A4A4A', marginBottom: '20px' }}>
              根据艾宾浩斯遗忘曲线，及时复习可以大大提高记忆效果
            </p>
            <button 
              className="garden-button"
              onClick={() => window.location.href = '/review'}
              style={{ 
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                fontSize: '18px',
                padding: '15px 40px'
              }}
            >
              🔄 立即复习
            </button>
          </div>
          {reviewReminders.words && reviewReminders.words.length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#FFA500' }}>
                需要复习的单词：
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {reviewReminders.words.slice(0, 10).map((word: any) => (
                  <span 
                    key={word.id}
                    style={{
                      padding: '8px 15px',
                      background: '#FFB6C1',
                      borderRadius: '15px',
                      fontSize: '14px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {recentAchievements.length > 0 && (
        <div className="garden-card">
          <h2 className="garden-subtitle">🏆 最近获得的成就</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="achievement-badge">
                {achievement.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="garden-card">
        <h2 className="garden-subtitle">🌟 快速开始</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)', 
            borderRadius: '15px', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📖</div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>学习新单词</div>
          </div>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)', 
            borderRadius: '15px', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔄</div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>复习单词</div>
          </div>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
            borderRadius: '15px', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✏️</div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>练习巩固</div>
          </div>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #98FB98 0%, #87CEEB 100%)', 
            borderRadius: '15px', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌺</div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>装扮花园</div>
          </div>
        </div>
      </div>

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 学习提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>每天学习5-10个新单词，循序渐进</li>
          <li>及时复习，根据艾宾浩斯遗忘曲线巩固记忆</li>
          <li>完成每周目标可以获得额外积分奖励</li>
          <li>积累积分可以购买可爱的服装和花园装饰</li>
          <li>坚持学习，解锁更多成就！</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard