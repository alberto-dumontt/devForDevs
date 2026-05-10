# dev for devs

A free, community-driven platform built by developers, for developers. Whether you're just starting out, switching paths, or leveling up — dev for devs is an open space to grow alongside the community.

## Features

- **Community** — Post questions, share experiences, and comment with other developers. Topics include tech questions, career, industry, networking, and more.
- **DevSpec.AI** — Fill in your tech stack, career goal, and experience level to generate a personalized project specification, ready to use as a study guide, portfolio piece, or interview prep.
- **Roadmaps** — Curated study paths from community professionals. Currently includes a Backend for Beginners roadmap, with more on the way.
- **Courses** — Community-recommended courses with honest picks from developers who've actually taken them.
- **Recommendations** — Developer-recommended tools and resources, organized by category.
- **DevRadar** — Automatically collected developer job listings, updated daily (currently focused on the Brazilian market).
- **User Profiles** — Public profiles with role, seniority, bio, GitHub, and LinkedIn links.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Auth & Database | Supabase |
| HTTP Client | Axios |
| Internationalization | i18next (English, pt-BR) |
| Linting | ESLint |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Shared UI components (Layout, Sidebar, etc.)
├── contexts/         # React contexts (AuthContext)
├── i18n/             # Internationalization config and locale files
├── lib/              # External service clients (Supabase)
├── pages/            # Route-level page components
│   └── roadmaps/     # Roadmap pages
└── services/         # API service layer
```

## Contributing

This is a community project. If you're a developer and want to contribute, you're welcome here.

Built by [Alberto Dumontt](https://github.com/alberto-dumontt).
