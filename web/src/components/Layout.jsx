import { Link, useNavigate } from 'react-router-dom'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from '@heroui/react'

function Layout({ children }) {
  const navigate = useNavigate()
  // TODO: Get user from context/state
  const user = null // Replace with actual user state

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <NavbarBrand>
          <Link to="/" className="font-bold text-inherit">
            Matcha
          </Link>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {user ? (
            <>
              <NavbarItem>
                <Link to="/browse">Browse</Link>
              </NavbarItem>
              <NavbarItem>
                <Link to="/chat">Chat</Link>
              </NavbarItem>
              <NavbarItem>
                <Link to="/profile">Profile</Link>
              </NavbarItem>
            </>
          ) : null}
        </NavbarContent>
        <NavbarContent justify="end">
          {user ? (
            <NavbarItem>
              <Button color="danger" variant="flat" onPress={() => {/* TODO: logout */}}>
                Logout
              </Button>
            </NavbarItem>
          ) : (
            <>
              <NavbarItem className="hidden lg:flex">
                <Link to="/login">Login</Link>
              </NavbarItem>
              <NavbarItem>
                <Button as={Link} color="primary" href="/register" variant="flat">
                  Sign Up
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>
      </Navbar>
      <main>{children}</main>
    </div>
  )
}

export default Layout

