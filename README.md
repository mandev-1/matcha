#### Matcha (42cursus)

Preface  
Build a web application that helps two people connect, from sign-up through to a first meeting. Users should be able to register, log in, complete their profile, browse and view other profiles, “like” them, and chat when the interest is mutual.

### Section 1 — Tech stack and general requirements  
- The app must run without errors, warnings, or notices on both server and client.
- You may use any programming language.
- You may use micro-frameworks and any libraries you need.
- You may use UI libraries (e.g., React, Angular, Vue, Bootstrap, Semantic) in any combination.
- No security vulnerabilities are allowed. Meet all mandatory security requirements at a minimum; more is encouraged.
- “Micro-framework” here means a framework that includes a router and possibly templating, but not an ORM, validators, or a user account manager. (This definition is authoritative for evaluation.)
- Suggested micro-frameworks/languages:
  - Ruby: Sinatra
  - Node: Express (considered a micro-framework here)
  - Python: Flask
  - Scala: Scalatra
  - PHP: Slim (Silex not allowed due to Doctrine integration)
  - Rust: Nickel
  - Go: Goji
  - Java: Spark
  - C++: Crow
- Use a relational or graph database. Choose a free option such as MySQL, MariaDB, PostgreSQL, Cassandra, InfluxDB, Neo4j, etc.
  - Write your own queries manually. You may build your own helper library to manage them.
- For evaluation, seed the database with at least 500 distinct profiles.
- You may choose any web server (Apache, Nginx, or a built-in server).
- Support at least the latest versions of Firefox and Chrome.
- The site must have a clear layout with at least a header, a main section, and a footer.
- The site must be responsive and usable on smaller screens.
- All forms must validate input properly, and the entire site must be secure. The following will not be tolerated:
  - Plain-text password storage
  - HTML/JavaScript injection in unprotected fields
  - Uploads of unauthorized content
  - SQL injection

### Section 2 — Mandatory features

Registration and sign-in  
- Users register with at least: email, username, last name, first name, and a securely protected password.
- Reject passwords that are common English words.
- After registering, send a unique verification link via email.
- Users can log in with username and password.
- Users can request a password reset email.
- Users can log out with one click from any page.

User profile
- After logging in, users must complete their profile with:
  - Gender
  - Sexual preferences
  - Biography
  - Reusable interest tags (e.g., #vegan, #geek, #piercing)
  - Up to 5 photos, with one designated as the profile picture
- Users can edit these details at any time, including last name, first name, and email.
- Users can see who viewed their profile.
- Users can see who “liked” them.
- Each user has a public “fame rating” (you define the metric; it must be consistent).
- Location:
  - Determine user location via GPS down to the neighborhood, with explicit consent.
  - If the user declines GPS, they must manually provide an approximate location (city or neighborhood) for matching to work.
  - Users can update their location at any time.
  - Note: This approach aligns with GDPR by requiring explicit consent.

Browsing (suggested matches)
- Show a list of suggested profiles that match the user’s preferences.
  - For example, a heterosexual woman should see male profiles; handle bisexuality.
  - If orientation is unspecified, treat as bisexual by default.
- Determine matches intelligently using multiple criteria:
  - Proximity to the user’s location
  - Number of shared tags
  - Higher fame rating
- Prioritize users in the same geographic area.
- Allow sorting by age, location, fame rating, and shared tags.
- Allow filtering by age, location, fame rating, and shared tags.

Search
- Provide advanced search by choosing one or more criteria:
  - Age range
  - Fame rating range
  - Location
  - One or more interest tags
- Like the suggestions list, search results must be sortable and filterable by age, location, fame rating, and tags.

Profile view
- Users can view other profiles and see all available information except email and password.
- Viewing a profile must be recorded in visit history.
- Users can:
  - “Like” another user’s profile picture. If both users like each other, they are “connected” and can chat. A user without a profile picture cannot like.
  - Remove a “like,” which stops further notifications from that user and disables chat between them.
  - View another user’s fame rating.
  - See if a user is currently online; if not, show last connection date/time.
  - Report a profile as a fake account.
  - Block a user, which removes them from search results, stops notifications, and disables chat.
- Clearly indicate if the viewed profile has liked the current user or if they are already connected, and allow “unlike”/disconnect.

Chat
- Connected users can chat in near real time (maximum 10-second delay).
- From any page, users must see when a new message arrives.

Notifications
- Deliver real-time notifications (maximum 10-second delay) for:
  - Receiving a like
  - Profile views
  - New messages
  - A like-back from someone they liked
  - A connected user unliking them
- From any page, users must see when they have unread notifications.

Security note
- Store all credentials, API keys, and environment variables locally in a .env file and exclude it from Git. Exposing credentials publicly can cause the project to fail.

### Bonus (evaluated only if the mandatory part is flawless)
- Add OmniAuth strategies for authentication.
- Personal photo gallery with drag-and-drop upload and basic edits (crop, rotate, filters).
- Interactive user map with more precise JavaScript-based geolocation.
- Video or audio chat for connected users.
- Scheduling and organizing in-person dates or events for matched users.
