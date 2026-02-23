import React, { useState } from 'react'
import axios from 'axios'

interface LoginProps {
  onLogin: (user: any) => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { nickname })
      onLogin(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="garden-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 className="garden-title">🌸 花园宝宝背单词 🌸</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', fontSize: '18px' }}>
          欢迎来到神奇的花园世界！
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4A4A4A' }}>
              请输入你的昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="garden-input"
              placeholder="例如：小花朵"
              maxLength={20}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#FF6B6B', 
              marginBottom: '15px', 
              textAlign: 'center',
              padding: '10px',
              background: '#FFF5F5',
              borderRadius: '10px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="garden-button"
            style={{ width: '100%' }}
            disabled={loading || !nickname.trim()}
          >
            {loading ? '登录中...' : '进入花园 🌺'}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#888' }}>
          <p>🌟 首次登录将自动创建账号</p>
          <p>🌟 无需密码，只需昵称即可</p>
        </div>
      </div>
    </div>
  )
}

export default Login