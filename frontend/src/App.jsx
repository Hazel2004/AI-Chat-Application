import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [ans, setAns] = useState("")
  const [mod, setMod] = useState("")
  const [load, setLoad] = useState(false)
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState("")
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash")

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server')
      setSocket(ws)
    }

    ws.onmessage = (event) => {
      console.log('Received:', event.data)
      setAns(event.data)
      setLoad(false)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      setSocket(null)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setLoad(false)
    }

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  function sendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('WebSocket connection not available')
      return
    }

    if (!message.trim()) {
      alert('Please enter a message')
      return
    }

    setLoad(true)
    setAns("")
    
    const messageData = {
      query: message,
      model: selectedModel
    }

    socket.send(JSON.stringify(messageData))
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>AI Chat Application</h1>
      
      <div style={{ marginBottom: '20px', minHeight: '100px', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
        <strong>Response:</strong>
        <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
          {load ? "Loading..." : ans}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="gemini-1.5-flash">Gemini-1.5-flash</option>
          <option value="gemini-2.0-flash">Gemini-2.0-flash</option>
          <option value="gemini-pro">Gemini-Pro</option>
        </select>
      </div>

      <button 
        onClick={sendMessage}
        disabled={load || !socket}
        style={{ 
          width: '100%', 
          padding: '10px', 
          borderRadius: '4px', 
          border: 'none', 
          backgroundColor: load || !socket ? '#ccc' : '#007bff', 
          color: 'white',
          cursor: load || !socket ? 'not-allowed' : 'pointer'
        }}
      >
        {load ? "Loading..." : "Send"}
      </button>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Status: {socket ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  )
}

export default App