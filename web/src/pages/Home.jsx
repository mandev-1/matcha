import { Link } from 'react-router-dom'
import { Button, Card, CardBody } from '@heroui/react'

function Home() {
  // TODO: Get user from context/state
  const user = null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to Matcha</h1>
        <p className="text-xl text-gray-600 mb-8">Find your perfect match today!</p>
        {user ? (
          <div className="flex gap-4 justify-center">
            <Button as={Link} to="/browse" color="primary" size="lg">
              Browse Profiles
            </Button>
            <Button as={Link} to="/profile" color="secondary" variant="flat" size="lg">
              Complete Your Profile
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Button as={Link} to="/register" color="primary" size="lg">
              Get Started
            </Button>
            <Button as={Link} to="/login" color="secondary" variant="flat" size="lg">
              Login
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Find compatible partners based on location, interests, and preferences
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">Connect instantly with your matches</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your data is protected and your privacy is our priority
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Home

