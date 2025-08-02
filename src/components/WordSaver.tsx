'use client'

import { useState, useEffect } from 'react'

interface SavedWord {
  id: string
  word: string
  meaning: string
  context?: string
  videoId?: string
  timestamp?: number
  createdAt: Date
}

interface WordSaverProps {
  videoId?: string
  currentTime?: number
}

export default function WordSaver({ videoId, currentTime }: WordSaverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [context, setContext] = useState('')
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])

  const handleSaveWord = async () => {
    if (!word.trim() || !meaning.trim()) return

    const newWord: SavedWord = {
      id: Date.now().toString(),
      word: word.trim(),
      meaning: meaning.trim(),
      context: context.trim() || undefined,
      videoId,
      timestamp: currentTime,
      createdAt: new Date(),
    }

    setSavedWords(prev => [newWord, ...prev])
    
    // TODO: Save to Supabase in future update
    if (typeof window !== 'undefined') {
      const existingWords = JSON.parse(localStorage.getItem('savedWords') || '[]')
      localStorage.setItem('savedWords', JSON.stringify([newWord, ...existingWords]))
    }

    setWord('')
    setMeaning('')
    setContext('')
    setIsOpen(false)
  }

  const handleDeleteWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id))
    
    if (typeof window !== 'undefined') {
      const existingWords = JSON.parse(localStorage.getItem('savedWords') || '[]')
      const updatedWords = existingWords.filter((w: SavedWord) => w.id !== id)
      localStorage.setItem('savedWords', JSON.stringify(updatedWords))
    }
  }

  // Load saved words on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const words = JSON.parse(localStorage.getItem('savedWords') || '[]')
      setSavedWords(words.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt) })))
    }
  }, [])

  return (
    <div className="h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">単語帳</h3>
              <p className="text-sm text-gray-500">{savedWords.length}個の単語が保存されています</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>単語を追加</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-purple-100">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900">新しい単語を追加</h4>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="単語・フレーズ..."
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="意味・翻訳..."
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="文脈・例文（オプション）..."
                rows={2}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveWord}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  単語を保存
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {savedWords.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">まだ保存された単語がありません</p>
              <p className="text-sm text-gray-400 mt-1">動画を視聴しながら単語を追加してください</p>
            </div>
          ) : (
            savedWords.map((savedWord) => (
              <div key={savedWord.id} className="bg-gradient-to-r from-white to-purple-50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg">{savedWord.word}</div>
                    <div className="text-gray-600 font-medium mt-1">{savedWord.meaning}</div>
                    {savedWord.context && (
                      <div className="text-sm text-gray-500 mt-2 italic bg-purple-50 rounded-lg p-2 border-l-4 border-purple-200">
                        "{savedWord.context}"
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-3 flex items-center space-x-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{savedWord.createdAt.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWord(savedWord.id)}
                    className="ml-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}