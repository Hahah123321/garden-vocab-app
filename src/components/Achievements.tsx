import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface AchievementsProps {
  user: any
}

const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const [allAchievements, setAllAchievements] = useState<any[]>([])
  const [userAchievements, setUserAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
    checkNewAchievements()
  }, [user.id])

  const fetchAchievements = async () => {
    setLoading(true)
    try {
      const [allRes, userRes] = await Promise.all([
        axios.get('http://localhost:5000/api/game/achievements'),
        axios.get(`http://localhost:5000/api/game/achievements/${user.id}`)
      ])

      setAllAchievements(allRes.data)
      setUserAchievements(userRes.data)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkNewAchievements = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/game/achievements/check', {
        userId: user.id
      })

      if (response.data.newAchievements && response.data.newAchievements.length > 0) {
        alert(`🎉 恭喜解锁新成就！\n${response.data.newAchievements.map((a: any) => a.name).join(', ')}`)
        fetchAchievements()
      }
    } catch (error) {
      console.error('Failed to check achievements:', error)
    }
  }

  const isUnlocked = (achievementId: number) => {
    return userAchievements.some(ua => ua.id === achievementId)
  }

  const getAchievementIcon = (achievement: any) => {
    const icons: { [key: string]: string } = {
      'words_learned': '📚',
      'consecutive_days': '📅',
      'weekly_goal': '🎯',
      'review_count': '🔄'
    }
    return icons[achievement.condition_type] || '🏆'
  }

  const getProgress = (achievement: any) => {
    switch (achievement.condition_type) {
      case 'words_learned':
        return userAchievements.filter(ua => ua.id === achievement.id).length > 0 
          ? 100 
          : Math.min(100, Math.round((userAchievements.length / achievement.condition_value) * 100))
      case 'review_count':
        return userAchievements.filter(ua => ua.id === achievement.id).length > 0 
          ? 100 
          : 0
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🏆</div>
        <p>正在加载成就...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="garden-title">🏆 成就系统 🏆</h1>

      <div className="score-display">
        <div className="score-item">
          <div className="score-value">🏆 {userAchievements.length}</div>
          <div className="score-label">已解锁成就</div>
        </div>
        <div className="score-item">
          <div className="score-value">⭐ {user.points}</div>
          <div className="score-label">当前积分</div>
        </div>
      </div>

      <div className="garden-card">
        <h2 className="garden-subtitle">🎖️ 所有成就</h2>
        
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          {allAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id)
            const progress = getProgress(achievement)

            return (
              <div
                key={achievement.id}
                style={{
                  padding: '20px',
                  background: unlocked 
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
                    : 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
                  borderRadius: '20px',
                  opacity: unlocked ? 1 : 0.7,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '48px' }}>
                    {unlocked ? getAchievementIcon(achievement) : '🔒'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: unlocked ? 'white' : '#666',
                      marginBottom: '5px'
                    }}>
                      {achievement.name}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: unlocked ? 'white' : '#888',
                      marginBottom: '10px'
                    }}>
                      {achievement.description}
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: unlocked ? 'white' : '#666'
                    }}>
                      奖励：⭐ {achievement.reward_points} 积分
                    </div>
                  </div>
                  {unlocked && (
                    <div style={{ 
                      padding: '10px 20px', 
                      background: 'rgba(255, 255, 255, 0.3)', 
                      borderRadius: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      ✓ 已解锁
                    </div>
                  )}
                </div>

                {!unlocked && progress > 0 && progress < 100 && (
                  <div style={{ marginTop: '15px' }}>
                    <div className="progress-bar" style={{ height: '10px' }}>
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      进度：{progress}%
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {userAchievements.length > 0 && (
        <div className="garden-card">
          <h2 className="garden-subtitle">🌟 最近解锁的成就</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {userAchievements.slice(0, 5).map((achievement) => (
              <div 
                key={achievement.id}
                className="achievement-badge"
                style={{ 
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  padding: '12px 20px',
                  fontSize: '16px'
                }}
              >
                {getAchievementIcon(achievement)} {achievement.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 成就提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>完成各种学习任务可以解锁成就</li>
          <li>每个成就都有对应的积分奖励</li>
          <li>解锁成就可以展示你的学习成果</li>
          <li>坚持学习，解锁更多成就！</li>
        </ul>
      </div>
    </div>
  )
}

export default Achievements