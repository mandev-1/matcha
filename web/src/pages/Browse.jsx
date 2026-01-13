import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Button, Select, SelectItem, Input } from '@heroui/react'

function Browse() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    sort: 'distance',
    minAge: '',
    maxAge: '',
  })

  useEffect(() => {
    fetchProfiles()
  }, [filters])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`/api/browse?${params}`)
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Browse Profiles</h2>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4 flex-wrap">
            <Select
              label="Sort by"
              selectedKeys={[filters.sort]}
              onSelectionChange={(keys) => setFilters({...filters, sort: Array.from(keys)[0]})}
              className="min-w-[150px]"
            >
              <SelectItem key="distance">Distance</SelectItem>
              <SelectItem key="age">Age</SelectItem>
              <SelectItem key="fame">Fame Rating</SelectItem>
              <SelectItem key="tags">Common Tags</SelectItem>
            </Select>
            <Input
              type="number"
              label="Min Age"
              placeholder="Min"
              value={filters.minAge}
              onChange={(e) => setFilters({...filters, minAge: e.target.value})}
              className="w-32"
            />
            <Input
              type="number"
              label="Max Age"
              placeholder="Max"
              value={filters.maxAge}
              onChange={(e) => setFilters({...filters, maxAge: e.target.value})}
              className="w-32"
            />
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardBody>
                <div className="text-center">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt={profile.first_name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                      No Photo
                    </div>
                  )}
                  <h3 className="text-xl font-semibold">
                    {profile.first_name}, {profile.age}
                  </h3>
                  <p className="text-gray-600">{profile.location}</p>
                  <p className="text-sm">⭐ {profile.fame_rating}</p>
                  <Button
                    as={Link}
                    to={`/user/${profile.id}`}
                    color="primary"
                    size="sm"
                    className="mt-4"
                  >
                    View Profile
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
          {profiles.length === 0 && (
            <p className="col-span-3 text-center text-gray-600">
              No profiles found. Try adjusting your filters.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Browse

