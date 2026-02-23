import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface GardenProps {
  user: any
}

const Garden: React.FC<GardenProps> = ({ user }) => {
  const [gardenItems, setGardenItems] = useState<any[]>([])
  const [userGarden, setUserGarden] = useState<any[]>([])
  const [shopItems, setShopItems] = useState<any[]>([])
  const [showShop, setShowShop] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGardenData()
  }, [user.id])

  const fetchGardenData = async () => {
    setLoading(true)
    try {
      const [gardenRes, userGardenRes, shopRes] = await Promise.all([
        axios.get('http://localhost:5000/api/game/garden-items'),
        axios.get(`http://localhost:5000/api/game/garden/${user.id}`),
        axios.get('http://localhost:5000/api/game/garden-items')
      ])

      setGardenItems(gardenRes.data)
      setUserGarden(userGardenRes.data)
      setShopItems(shopRes.data)
    } catch (error) {
      console.error('Failed to fetch garden data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (item: any) => {
    if (user.points < item.price) {
      alert('积分不足！')
      return
    }

    try {
      await axios.post('http://localhost:5000/api/game/purchase', {
        userId: user.id,
        itemId: item.id,
        itemType: 'garden'
      })

      alert(`成功购买 ${item.name}！`)
      fetchGardenData()
    } catch (error: any) {
      alert(error.response?.data?.error || '购买失败')
    }
  }

  const handlePlaceItem = (item: any) => {
    setSelectedItem(item)
  }

  const handleConfirmPlace = async (positionX: number, positionY: number) => {
    try {
      await axios.post('http://localhost:5000/api/game/garden/place', {
        userId: user.id,
        gardenItemId: selectedItem.id,
        positionX,
        positionY
      })

      setSelectedItem(null)
      fetchGardenData()
    } catch (error) {
      console.error('Failed to place item:', error)
    }
  }

  const handleRemoveItem = async (gardenItemId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/game/garden/${user.id}/${gardenItemId}`)
      fetchGardenData()
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const getItemIcon = (item: any) => {
    const icons: { [key: string]: string } = {
      'flower': '🌸',
      'plant': '🌿',
      'decoration': '🏰',
      'furniture': '🪑'
    }
    return icons[item.type] || '🌺'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🌺</div>
        <p>正在加载花园...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="garden-title">🌺 我的花园 🌺</h1>

      <div className="score-display">
        <div className="score-item">
          <div className="score-value">⭐ {user.points}</div>
          <div className="score-label">可用积分</div>
        </div>
        <div className="score-item">
          <div className="score-value">🏡 {userGarden.length}</div>
          <div className="score-label">花园物品</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button 
          className="garden-button"
          onClick={() => setShowShop(false)}
          style={{ flex: 1, background: !showShop ? 'linear-gradient(135deg, #98FB98 0%, #87CEEB 100%)' : 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)' }}
        >
          🏡 我的花园
        </button>
        <button 
          className="garden-button"
          onClick={() => setShowShop(true)}
          style={{ flex: 1, background: showShop ? 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)' : 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)' }}
        >
          🛒 花园商店
        </button>
      </div>

      {!showShop ? (
        <div className="garden-card">
          <h2 className="garden-subtitle">🏡 花园场景</h2>
          
          {userGarden.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌱</div>
              <p style={{ fontSize: '18px', color: '#888', marginBottom: '20px' }}>
                你的花园还是空的，去商店买些装饰吧！
              </p>
              <button className="garden-button" onClick={() => setShowShop(true)}>
                去商店购物 🛒
              </button>
            </div>
          ) : (
            <div className="garden-scene">
              {userGarden.map((item) => (
                <div 
                  key={item.id}
                  className="garden-item"
                  style={{ position: 'relative' }}
                >
                  <div className="garden-item-icon">{getItemIcon(item)}</div>
                  <div className="garden-item-name">{item.name}</div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#FF6B6B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="garden-card">
          <h2 className="garden-subtitle">🛒 花园商店</h2>
          
          <div className="garden-scene">
            {shopItems.map((item) => (
              <div key={item.id} className="garden-item">
                <div className="garden-item-icon">{getItemIcon(item)}</div>
                <div className="garden-item-name">{item.name}</div>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                  {item.description}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFA500', marginBottom: '10px' }}>
                  ⭐ {item.price}
                </div>
                <button
                  className="garden-button"
                  onClick={() => handlePurchase(item)}
                  disabled={user.points < item.price}
                  style={{ 
                    fontSize: '14px',
                    padding: '8px 16px',
                    opacity: user.points < item.price ? 0.5 : 1
                  }}
                >
                  {user.points < item.price ? '积分不足' : '购买'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 花园提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>学习单词可以获得积分，用来购买花园装饰</li>
          <li>完成每周目标可以获得额外积分奖励</li>
          <li>打造一个美丽的花园，展示你的学习成果！</li>
          <li>注意：如果未完成每周目标，部分装饰可能会被"摧毁"</li>
        </ul>
      </div>
    </div>
  )
}

export default Garden