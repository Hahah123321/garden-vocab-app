import React, { useState } from 'react'
import axios from 'axios'

interface WordImportProps {
  onImportComplete?: () => void
}

const WordImport: React.FC<WordImportProps> = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)
  const [editingWords, setEditingWords] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setOcrResult(null)
      setEditingWords([])
    }
  }

  const handleUploadAndRecognize = async () => {
    if (!selectedFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const response = await axios.post('http://localhost:5000/api/upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setOcrResult(response.data)

      const initialWords = response.data.words.map((word: string) => ({
        word,
        phonetic: '',
        meaning: '',
        example: '',
        example_translation: '',
        context_description: '',
        difficulty: 'medium',
        category: 'general',
        imageUrl: response.data.imageUrl
      }))

      setEditingWords(initialWords)
    } catch (error: any) {
      console.error('上传失败:', error)
      alert(error.response?.data?.error || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleWordChange = (index: number, field: string, value: string) => {
    const updatedWords = [...editingWords]
    updatedWords[index] = { ...updatedWords[index], [field]: value }
    setEditingWords(updatedWords)
  }

  const handleRemoveWord = (index: number) => {
    const updatedWords = editingWords.filter((_, i) => i !== index)
    setEditingWords(updatedWords)
  }

  const handleImport = async () => {
    const validWords = editingWords.filter(w => w.word && w.meaning)

    if (validWords.length === 0) {
      alert('请至少填写一个完整的单词信息')
      return
    }

    setImporting(true)

    try {
      const response = await axios.post('http://localhost:5000/api/upload/import', {
        words: validWords
      })

      alert(`成功导入 ${response.data.count} 个单词！`)

      if (onImportComplete) {
        onImportComplete()
      }

      setSelectedFile(null)
      setPreviewUrl('')
      setOcrResult(null)
      setEditingWords([])
    } catch (error: any) {
      console.error('导入失败:', error)
      alert(error.response?.data?.error || '导入失败，请重试')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setOcrResult(null)
    setEditingWords([])
  }

  return (
    <div>
      <h1 className="garden-title">📷 图片导入单词</h1>

      <div className="garden-card">
        <h2 className="garden-subtitle">上传图片</h2>

        {!previewUrl ? (
          <div style={{ 
            border: '3px dashed #FFB6C1',
            borderRadius: '20px',
            padding: '50px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📷</div>
              <div style={{ fontSize: '18px', color: '#888', marginBottom: '10px' }}>
                点击或拖拽上传图片
              </div>
              <div style={{ fontSize: '14px', color: '#AAA' }}>
                支持 JPG、PNG、GIF 等格式
              </div>
            </label>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{ 
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '15px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                className="garden-button"
                onClick={handleUploadAndRecognize}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)' }}
              >
                {loading ? '识别中...' : '🔍 识别单词'}
              </button>
              <button
                className="garden-button"
                onClick={handleReset}
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' }}
              >
                🔄 重新选择
              </button>
            </div>
          </div>
        )}

        {ocrResult && (
          <div style={{ marginTop: '30px', padding: '20px', background: '#FFF8DC', borderRadius: '15px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#FFA500' }}>
              识别结果
            </h3>
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#4A4A4A' }}>
              <div><strong>识别文本:</strong> {ocrResult.text || '无'}</div>
              <div><strong>识别单词:</strong> {ocrResult.words.join(', ') || '无'}</div>
              <div><strong>置信度:</strong> {ocrResult.confidence?.toFixed(2) || 0}%</div>
            </div>
            {ocrResult.ocrError && (
              <div style={{ marginTop: '10px', color: '#FF6B6B', fontSize: '14px' }}>
                ⚠️ {ocrResult.ocrError}
              </div>
            )}
          </div>
        )}
      </div>

      {editingWords.length > 0 && (
        <div className="garden-card">
          <h2 className="garden-subtitle">编辑单词信息</h2>
          <p style={{ marginBottom: '20px', color: '#888' }}>
            请完善以下单词的信息，至少填写单词和释义
          </p>

          <div style={{ display: 'grid', gap: '20px' }}>
            {editingWords.map((wordData, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFFFF 100%)',
                  borderRadius: '15px',
                  border: '2px solid #FFB6C1'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '20px', color: '#DDA0DD', margin: 0 }}>
                    单词 #{index + 1}
                  </h3>
                  <button
                    onClick={() => handleRemoveWord(index)}
                    style={{
                      background: '#FF6B6B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 15px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    删除
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      单词 *
                    </label>
                    <input
                      type="text"
                      value={wordData.word}
                      onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                      className="garden-input"
                      placeholder="例如：garden"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      释义 *
                    </label>
                    <input
                      type="text"
                      value={wordData.meaning}
                      onChange={(e) => handleWordChange(index, 'meaning', e.target.value)}
                      className="garden-input"
                      placeholder="例如：花园"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      音标
                    </label>
                    <input
                      type="text"
                      value={wordData.phonetic}
                      onChange={(e) => handleWordChange(index, 'phonetic', e.target.value)}
                      className="garden-input"
                      placeholder="例如：/ˈɡɑːrdn/"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      例句
                    </label>
                    <input
                      type="text"
                      value={wordData.example}
                      onChange={(e) => handleWordChange(index, 'example', e.target.value)}
                      className="garden-input"
                      placeholder="例如：The garden is beautiful."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      例句翻译
                    </label>
                    <input
                      type="text"
                      value={wordData.example_translation}
                      onChange={(e) => handleWordChange(index, 'example_translation', e.target.value)}
                      className="garden-input"
                      placeholder="例如：花园很美丽。"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                      花园宝宝情境
                    </label>
                    <textarea
                      value={wordData.context_description}
                      onChange={(e) => handleWordChange(index, 'context_description', e.target.value)}
                      className="garden-input"
                      placeholder="描述单词在花园宝宝故事中的情境..."
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                        难度
                      </label>
                      <select
                        value={wordData.difficulty}
                        onChange={(e) => handleWordChange(index, 'difficulty', e.target.value)}
                        className="garden-input"
                      >
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4A4A4A' }}>
                        分类
                      </label>
                      <select
                        value={wordData.category}
                        onChange={(e) => handleWordChange(index, 'category', e.target.value)}
                        className="garden-input"
                      >
                        <option value="general">通用</option>
                        <option value="nature">自然</option>
                        <option value="animal">动物</option>
                        <option value="emotion">情感</option>
                        <option value="action">动作</option>
                        <option value="fantasy">幻想</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              className="garden-button"
              onClick={handleImport}
              disabled={importing || editingWords.filter(w => w.word && w.meaning).length === 0}
              style={{ 
                fontSize: '18px',
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
              }}
            >
              {importing ? '导入中...' : '📚 导入到词库'}
            </button>
          </div>
        </div>
      )}

      <div className="garden-card">
        <h2 className="garden-subtitle">💡 使用提示</h2>
        <ul style={{ lineHeight: '2', fontSize: '16px', color: '#4A4A4A' }}>
          <li>上传包含英文单词的图片，系统会自动识别图片中的文字</li>
          <li>识别结果可能包含一些错误，请仔细检查并修正</li>
          <li>完善单词的释义、例句等信息，让学习更有效</li>
          <li>可以删除不需要的单词，只保留想要学习的</li>
          <li>导入后的单词可以在"学习"页面中学习</li>
        </ul>
      </div>
    </div>
  )
}

export default WordImport