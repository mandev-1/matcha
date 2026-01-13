# Hero UI Templates Guide

## Template Structure

Your templates are organized in the `templates/` directory:

```
templates/
├── layout.html          # Base layout template
├── index.html          # Home page
├── login.html          # Login page
├── register.html       # Registration page
├── profile.html        # User profile page
├── browse.html         # Browse profiles page
├── view_user.html      # View another user's profile
├── chat.html           # Chat interface
└── view.go            # Template rendering helpers
```

## How Hero Templates Work

Hero is a template engine that compiles HTML templates to Go code for better performance.

### 1. Write HTML Templates

Create your HTML templates with Go template syntax:

```html
<!-- templates/index.html -->
{{define "index"}}
<div class="hero-section">
    <h1>Welcome to Matcha</h1>
    {{if .User}}
        <p>Hello, {{.User.FirstName}}!</p>
    {{else}}
        <p>Please login</p>
    {{end}}
</div>
{{end}}
```

### 2. Generate Go Code from Templates

Run the hero command to compile templates:

```bash
hero -source=./templates -dest=./templates
```

Or use the Makefile:
```bash
make hero
```

This generates Go functions like `RenderIndex()`, `RenderLogin()`, etc. in `templates/*.go` files.

### 3. Use Generated Templates in Handlers

After generation, update your handlers:

```go
// Before (using standard templates)
templates.RenderTemplate(w, "index", data)

// After (using Hero-generated functions)
templates.RenderIndex(w, data)
```

## Template Syntax

### Variables
```html
{{.Title}}           <!-- Access struct field -->
{{.User.FirstName}}  <!-- Nested fields -->
```

### Conditionals
```html
{{if .User}}
    <p>Logged in as {{.User.FirstName}}</p>
{{else}}
    <a href="/login">Login</a>
{{end}}

{{if eq .User.Gender "male"}}selected{{end}}
```

### Loops
```html
{{range .Profiles}}
    <div class="profile">{{.FirstName}}</div>
{{end}}

{{range $index, $profile := .Profiles}}
    <div>#{{$index}}: {{$profile.FirstName}}</div>
{{end}}
```

### Includes/Partials
```html
{{template "header" .}}
{{template "footer" .}}
```

## Layout System

The `layout.html` template provides the base structure:

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{.Title}} - Matcha</title>
</head>
<body>
    <nav>...</nav>
    <main>{{.Content}}</main>
</body>
</html>
```

Each page template defines its content:

```html
{{define "index"}}
<div>Page content here</div>
{{end}}
```

## Template Data Structure

Create a data struct for each page:

```go
type IndexData struct {
    Title string
    User  *models.User
    // ... other fields
}
```

Pass it to the template:

```go
data := IndexData{
    Title: "Home",
    User:  currentUser,
}
templates.RenderIndex(w, data)
```

## Workflow

1. **Create/Edit HTML templates** in `templates/*.html`
2. **Generate Go code**: `make hero`
3. **Update handlers** to use generated functions
4. **Test** your changes

## Tips

- **Hot Reload**: Use `hero -watch` to auto-regenerate on file changes
- **Partial Templates**: Create reusable components in separate files
- **Error Handling**: Always check for template errors in handlers
- **Performance**: Hero templates are faster than standard Go templates

## Example Handler

```go
func IndexHandler(w http.ResponseWriter, r *http.Request) {
    data := templates.IndexData{
        Title: "Home",
        User:  getUserFromSession(r),
    }
    
    if err := templates.RenderIndex(w, data); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}
```

## Next Steps

1. Generate templates: `make hero`
2. Update handlers to use generated functions
3. Add more templates as needed
4. Style with CSS in `static/css/`

