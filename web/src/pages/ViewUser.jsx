import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, Button } from '@heroui/react'

function ViewUser() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/user/${id}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch user:', err)
        setLoading(false)
      })
  }, [id])

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/like/${id}`, { method: 'POST' })
      if (response.ok) {
        // TODO: Update UI
      }
    } catch (err) {
      console.error('Failed to like user:', err)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-8">User not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardBody>
          <div className="text-center mb-6">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.first_name}
                className="w-48 h-48 rounded-full mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-48 h-48 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                No Photo
              </div>
            )}
            <h1 className="text-3xl font-bold">
              {user.first_name} {user.last_name}, {user.age}
            </h1>
            <p className="text-gray-600">📍 {user.location}</p>
            <p>⭐ Fame Rating: {user.fame_rating}</p>
            {user.is_online ? (
              <span className="text-green-500">🟢 Online</span>
            ) : (
              <span className="text-gray-500">Last seen: {user.last_seen}</span>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">About</h3>
            <p>{user.biography || 'No biography provided.'}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.tags?.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button color="primary" onPress={handleLike}>
              Like
            </Button>
            {user.is_connected && (
              <Button as={Link} to={`/chat/${id}`} color="primary" variant="flat">
                Chat
              </Button>
            )}
            <Button color="danger" variant="flat">Report</Button>
            <Button color="danger" variant="flat">Block</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ViewUser

