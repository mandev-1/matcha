import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardBody, Input, Button } from '@heroui/react'

function Chat() {
  const { id } = useParams()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    // TODO: Fetch conversations and messages
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setConversations(data.conversations || []))
  }, [])

  useEffect(() => {
    if (id) {
      fetch(`/api/messages/${id}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages || []))
    }
  }, [id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !id) return

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (response.ok) {
        setNewMessage('')
        // TODO: Refresh messages
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h2 className="text-3xl font-bold mb-6">Chat</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardBody>
            <h3 className="font-semibold mb-4">Conversations</h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div key={conv.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                  {conv.name}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card className="md:col-span-2">
          <CardBody>
            {id ? (
              <>
                <div className="h-96 overflow-y-auto mb-4 space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`p-2 rounded ${msg.is_from_current_user ? 'bg-primary/20 ml-auto' : 'bg-gray-100'}`}>
                      <p>{msg.content}</p>
                      <span className="text-xs text-gray-500">{msg.created_at}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" color="primary">Send</Button>
                </form>
              </>
            ) : (
              <p className="text-center text-gray-600">Select a conversation to start chatting</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Chat

