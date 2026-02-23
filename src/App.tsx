import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Learn from './components/Learn'
import Review from './components/Review'
import Practice from './components/Practice'
import Garden from './components/Garden'
import Character from './components/Character'
import Achievements from './components/Achievements'
import WordImport from './components/WordImport'
import './index.css'

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('gardenUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    localStorage.setItem('gardenUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('gardenUser')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="garden-container">
        <nav className="nav-menu">
          <Link to="/" className="nav-item">首页</Link>
          <Link to="/learn" className="nav-item">学习</Link>
          <Link to="/review" className="nav-item">复习</Link>
          <Link to="/practice" className="nav-item">练习</Link>
          <Link to="/import" className="nav-item">导入</Link>
          <Link to="/garden" className="nav-item">花园</Link>
          <Link to="/character" className="nav-item">换装</Link>
          <Link to="/achievements" className="nav-item">成就</Link>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            退出
          </button>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/learn" element={<Learn user={user} />} />
          <Route path="/review" element={<Review user={user} />} />
          <Route path="/practice" element={<Practice user={user} />} />
          <Route path="/import" element={<WordImport onImportComplete={() => {}} />} />
          <Route path="/garden" element={<Garden user={user} />} />
          <Route path="/character" element={<Character user={user} />} />
          <Route path="/achievements" element={<Achievements user={user} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App