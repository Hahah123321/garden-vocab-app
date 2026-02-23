import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface CharacterProps {
  user: any
}

const Character: React.FC<CharacterProps> = ({ user }) => {
  const [characterItems, setCharacterItems] = useState<any[]>([])
  const [userInventory, setUserInventory] = useState<any[]>([])
  const [shopItems, setShopItems] = useState<any[]>([])
  const [showShop, setShowShop] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCharacterData()
  }, [user.id])

  const fetchCharacterData = async () => {
    setLoading(true)
    try {
      const [shopRes, inventoryRes] = await Promise.all([
        axios.get('http://localhost:5000/api/game/character-items'),
        axios.get(`http://localhost:5000/api/game/inventory/${user.id}`)
      ])

      setShopItems(shopRes.data)
      setUserInventory(inventoryRes.data.characterItems || [])
    } catch (error) {
      console.error('Failed to fetch character data:', error)
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
        itemType: 'character'
      })

      alert(`成功购买 ${item.name}！`)
      fetchCharacterData()
    } catch (error: any) {
      alert(error.response?.data?.error || '购买失败')
    }
  }

  const handleEquip = async (itemId: number) => {
    try {
      await axios.post('http://localhost:5000/api/game/equip', {
        userId: user.id,
        itemId,
        itemType: 'character'
      })

      fetchCharacterData()
    } catch (error) {
      console.error('Failed to equip item:', error)
    }
  }

  const getItemIcon = (item: any) => {
    const icons: { [key: string]: string } = {
      'clothing': '👗',
      'accessory': '🎀'
    }
    return icons[item.type] || '✨'
  }

  const getEquippedItems = () => {
    return userInventory.filter(item => item.is_equipped === 1)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>👧</div>
        <p>正在加载角色...</p>
      </div>
    )
  }

  const equippedItems = getEquippedItems()

  return (
    <div>
      <h1 className="garden-title">👧 角色换装 👧</h1>

      <div className="score-display">
        <div className="score-item">
          <div className="score-value">⭐ {user.points}</div>
          <div className="score-label">可用积分</div>
        </div>
        <div className="score-item">
          <div className="score-value">👗 {userInventory.length}</div>
          <div className="score-label">拥有物品</div>
        </div>
      </div>

      <div className="character-display">
        <div style={{ textAlign: 'center' }}>
          <div className="character-avatar">
            👧
          </div>
          <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold', color: '#DDA0DD' }}>
            {user.nickname}
          </div>
          <div style={{ marginTop: '10px', fontSize: '16px', color: '#888' }}>
            花园宝宝
          </div>
        </div>
      </div>

      {equippedItems.length > 0 && (
        <div className="garden-card">
          <h2 className="garden-subtitle">✨ 当前装备</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
            {equippedItems.map((item) => (
              <div 
                key={item.id}
                style={{
                  padding: '15px 25px',
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)',
                  borderRadius: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{getItemIcon(item)}</span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button 
          className="garden-button"
          onClick={() => setShowShop(false)}
          style={{ flex: 1, background: !showShop ? 'linear-gradient(135deg, #98FB98 0%, #87CEEB 100%)' : 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)' }}
        >
          👗 我的衣柜
        </button>
        <button 
          className="garden-button"
          onClick={() => setShowShop(true)}
          style={{ flex: 1, background: showShop ? 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)' : 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)' }}
        >
          🛍️ 服装商店
        </button>
      </div>

      {!showShop ? (
        <div className="garden-card">
          <h2 className="garden-subtitle">👗 我的衣柜</h2>
          
          {userInventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>👗</div>
              <p style={{ fontSize: '18px', color: '#888', marginBottom: '20px' }}>
                你的衣柜还是空的，去商店买些漂亮的衣服吧！
              </p>
              <button className="garden-button" onClick={() => setShowShop(true)}>
                去商店购物 🛍️
              </button>
            </div>
          ) : (
            <div className="garden-scene">
              {userInventory.map((item) => (
                <div 
                  key={item.id}
                  className="garden-item"
                  style={{ 
                    border: item.is_equipped ? '3px solid #FFD700' : 'none',
                    boxShadow: item.is_equipped ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none'
                  }}
                >
                  <div className="garden-item-icon">{getItemIcon(item)}</div>
                  <div className="garden-item-name">{item.name}</div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                    {item.description}
                  </div>
                  {item.is_equipped ? (
                    <div style={{ 
                      padding: '8px 16px', 
                      background: '#FFD700', 
                      borderRadius: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      已装备 ✨
                    </div>
                  ) : (
                    <button
                      className="garden-button"
                      onClick={() => handleEquip(item.id)}
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      装备
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="garden-card">
          <h2 className="garden-subtitle">🛍️ 服装商店</h2>
          
          <div className="garden-scene">
            {shopItems.map((item) => {
              const owned = userInventory.some((ownedItem) => ownedItem.id === item.id)
              return (
                <div key={item.id} className="garden-item">
                  <div className="garden-item-icon">{getItemIcon(item)}</div>
                  <div className="garden-item-name">{item.name}</div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFA500', marginBottom: '10px' }}>
                    ⭐ {item.price}
                  </div>
                  {owned ? (
                    <div style={{ 
                      padding: '8px 16px', 
                      background: '#4CAF50', 
                      borderRadius: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      已拥有 ✓
                    </div>
                  ) : (
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
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 换装提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>学习单词可以获得积分，用来购买可爱的服装</li>
          <li>装备不同的服装可以展示你的个性</li>
          <li>完成每周目标可以获得额外积分奖励</li>
          <li>注意：如果未完成每周目标，部分服装可能会被"摧毁"</li>
        </ul>
      </div>
    </div>
  )
}

export default Character