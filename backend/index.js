const axios = require("axios")
const express = require("express")
const { WebSocketServer } = require('ws')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

const GOOGLE_API_KEY = "Api_key"


const server = require('http').createServer(app)

const wss = new WebSocketServer({ 
    server: server 
})

console.log('Setting up WebSocket server...')

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established')

    ws.on("message", async (message) => {
        try {
            console.log('Received message:', message.toString())
            
            const { query, model } = JSON.parse(message.toString())
            
            if (!query || !model) {
                ws.send(JSON.stringify({ error: 'Query and model are required' }))
                return
            }

            console.log(`Processing query: "${query}" with model: ${model}`)

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": query
                                }
                            ]
                        }
                    ]
                },
                {
                    headers: {
                        'X-goog-api-key': GOOGLE_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            )


            const aiResponse = response.data.candidates[0].content.parts[0].text
            console.log('Sending AI response to client')
            ws.send(aiResponse)

        } catch (error) {
            console.error('Error processing message:', error.message)
            
            let errorMessage = 'An error occurred while processing your request.'
            
            if (error.response) {
               
                errorMessage = `API Error: ${error.response.data?.error?.message || error.response.statusText}`
            } else if (error.request) {
               
                errorMessage = 'Network error: Unable to reach the AI service'
            } else {
             
                errorMessage = `Error: ${error.message}`
            }
            
            ws.send(errorMessage)
        }
    })

    ws.on('close', () => {
        console.log('WebSocket connection closed')
    })

    ws.on('error', (error) => {
        console.error('WebSocket error:', error)
    })

    // Send welcome message
    ws.send('Connected to AI Chat Server')
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() })
})

// Fallback HTTP endpoint (optional)
app.post("/chat", async (req, res) => {
    try {
        const { chat, model } = req.body
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": chat
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'X-goog-api-key': GOOGLE_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        )

        const ans = response.data.candidates[0].content.parts[0].text
        res.json({ ans: ans, mod: model })

    } catch (error) {
        console.error('HTTP endpoint error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`WebSocket server running on ws://localhost:${PORT}`)
})