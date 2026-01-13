import { useState, useEffect } from 'react'
import { Card, CardBody, Input, Button, Textarea, Select, SelectItem } from '@heroui/react'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // TODO: Fetch user profile
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load profile')
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setSuccess('Profile updated successfully!')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-3xl font-bold mb-6">Your Profile</h2>

      {error && (
        <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 text-success p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profile?.first_name || ''}
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                  required
                />
                <Input
                  label="Last Name"
                  value={profile?.last_name || ''}
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  label="Email"
                  value={profile?.email || ''}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  required
                />
                <Input
                  type="date"
                  label="Birth Date"
                  value={profile?.birth_date || ''}
                  onChange={(e) => setProfile({...profile, birth_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Preferences</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Gender"
                  selectedKeys={profile?.gender ? [profile.gender] : []}
                  onSelectionChange={(keys) => setProfile({...profile, gender: Array.from(keys)[0]})}
                >
                  <SelectItem key="male">Male</SelectItem>
                  <SelectItem key="female">Female</SelectItem>
                  <SelectItem key="other">Other</SelectItem>
                </Select>
                <Select
                  label="Sexual Preference"
                  selectedKeys={profile?.sexual_preference ? [profile.sexual_preference] : []}
                  onSelectionChange={(keys) => setProfile({...profile, sexual_preference: Array.from(keys)[0]})}
                >
                  <SelectItem key="heterosexual">Heterosexual</SelectItem>
                  <SelectItem key="homosexual">Homosexual</SelectItem>
                  <SelectItem key="bisexual">Bisexual</SelectItem>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">About You</h3>
              <Textarea
                label="Biography"
                placeholder="Tell us about yourself..."
                value={profile?.biography || ''}
                onChange={(e) => setProfile({...profile, biography: e.target.value})}
                minRows={5}
              />
              <Input
                label="Interest Tags (comma-separated)"
                placeholder="e.g., #vegan, #geek, #piercing"
                value={profile?.tags || ''}
                onChange={(e) => setProfile({...profile, tags: e.target.value})}
                className="mt-4"
              />
            </div>

            <Button
              type="submit"
              color="primary"
              isLoading={saving}
            >
              Update Profile
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

export default Profile

