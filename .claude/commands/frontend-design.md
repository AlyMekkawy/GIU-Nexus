# Frontend Design Skill

You are about to redesign a GIU Nexus page or component. Before writing a single line of code, work through this design thinking framework out loud, then execute it fully.

## Step 1 — Design Thinking (answer these first)

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick ONE extreme aesthetic and name it explicitly: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian — or invent your own flavor.
- **Constraints**: React 18, GSAP 3.15, scoped CSS file, no external UI libraries.
- **Differentiation**: State the one thing someone will remember about this design.

CRITICAL: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

## Step 2 — Implementation Rules

Produce production-grade code that is visually striking and cohesive:

**Typography**
- Choose fonts that are beautiful and characterful — import from Google Fonts or use system font stacks creatively
- NEVER use Inter, Roboto, Arial, or Space Grotesk
- Pair a distinctive display font with a refined body font

**Color & Theme**
- Commit fully — use CSS custom properties for every color
- Dominant colors with sharp accents outperform timid evenly-distributed palettes
- NEVER use purple gradients on white backgrounds

**Motion**
- Use GSAP for entrance animations (staggered reveals, scaleY bar charts, etc.)
- One well-orchestrated page load beats scattered micro-interactions
- Add hover states that surprise

**Spatial Composition**
- Try asymmetry, overlap, diagonal flow, or grid-breaking elements
- Generous negative space OR controlled density — pick one

**Backgrounds & Visual Details**
- Create atmosphere: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows
- No flat solid background colors

## Step 3 — GIU Nexus Project Context

Tech stack: React 18 + React Router + Axios + GSAP 3.15 + scoped CSS

Key pages and their files:
- `client/src/pages/HomePage.jsx` + `HomePage.css`
- `client/src/pages/JobsPage.jsx` + `JobsPage.css`
- `client/src/pages/RecommendedJobsPage.jsx` + `styles/RecommendedJobsPage.css`
- `client/src/pages/SavedJobsPage.jsx` + `SavedJobsPage.css`
- `client/src/pages/MyApplicationsPage.jsx` + `MyApplicationsPage.css`
- `client/src/pages/LoginPage.jsx` + `LoginPage.css`
- `client/src/pages/RegisterPage.jsx` + `RegisterPage.css`
- `client/src/pages/ProfilePage.jsx` + `ProfilePage.css`
- `client/src/pages/EditProfilePage.jsx` + `EditProfilePage.css`
- `client/src/pages/AdminDashboard.jsx` + `AdminDashboard.css`

Existing design tokens (extend or override these):
```css
--color-primary: #0066cc;
--color-ink: #1d1d1f;
--color-muted: #6e6e73;
--color-canvas-parchment: #f5f5f7;
--radius-pill: 9999px;
```

Edit the real files directly at `C:\Users\khalo\WebstormProjects\GIU-Nexus\`.

## Now execute

The user will specify which page/component to redesign as `$ARGUMENTS`. Apply the full framework above and produce the redesigned JSX + CSS files.
