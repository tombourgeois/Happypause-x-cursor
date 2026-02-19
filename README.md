# HappyPause

Focus-cycle app with guided breaks. Work for Y minutes (default 55), take a break for X minutes (default 5), with a random guided activity from 6 categories: FITNESS, LEISURE, SOCIAL, MIND, SPIRITUAL, RELAXATION.

Built with **React Native (Expo)** + **NativeWind** and a **self-hosted Node.js API** with SQLite.

## Features

- **Focus timer** – Countdown with circular progress, "Have a HappyPause" button
- **Guided breaks** – Random activity with thumbs up/down, Cycle/Done/Skip
- **Stats & history** – Total focus/pause time, weekly chart, category breakdown
- **Custom activities** – Create your own, optionally submit for public approval
- **User accounts** – Sign up, login, forgot password, profile with avatar
- **Profile** – Personal info, change email/password, notifications, download data, delete account

## Quick Start

### 1. Start the API

```bash
cd backend
npm install
npm run seed   # First time only - seeds 60 activities from CSV
npm start      # Runs on http://localhost:3001
```

### 2. Start the app

```bash
cd app
npm install
npx expo start
```

Then open in browser (web), or scan the QR code with Expo Go (Android/iOS).

### 3. Configure API URL (for physical device)

If testing on a physical device, set the API URL to your machine's IP:

- Create `app/.env` with `EXPO_PUBLIC_API_URL=http://YOUR_IP:3001`
- Or run `EXPO_PUBLIC_API_URL=http://192.168.x.x:3001 npx expo start`

## Project Structure

```
Happypause/
├── backend/              # Node.js + Fastify + SQLite API
│   ├── server.js
│   ├── routes/           # auth, activities, logs, stats, settings, profile, admin
│   ├── db/               # schema, seed, migrations
│   ├── lib/              # auth, email
│   ├── public/images/    # activity images, avatars
│   └── data/             # happypause.db
├── app/                  # Expo React Native app
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── contexts/
│   └── types/
├── docs/                 # Plan, CSV, prompts
└── legacy/               # Original web app (reference)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| **Auth** | | |
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| GET | /auth/me | Current user |
| POST | /auth/forgot-password | Request reset code |
| POST | /auth/reset-password | Reset with code |
| POST | /auth/change-password | Request change code |
| POST | /auth/change-password/verify | Verify & set new password |
| POST | /auth/change-email/* | Change email flow |
| POST | /auth/delete-account | Request delete code |
| POST | /auth/delete-account/confirm | Confirm delete |
| GET | /auth/download-data | Export user data |
| **Profile** | | |
| GET | /profile | Get profile |
| PUT | /profile | Update profile |
| PUT | /profile/avatar | Set avatar URL |
| POST | /profile/avatar/upload | Upload avatar image |
| **Activities** | | |
| GET | /activities | List activities |
| GET | /activities/next | Weighted random activity |
| PATCH | /activities/:id/feedback | Thumbs up/down |
| POST | /activities | Create custom activity |
| **Data** | | |
| GET | /logs | List logs |
| POST | /logs | Create log |
| GET | /stats | Aggregated stats |
| GET | /settings | Get settings |
| PUT | /settings | Update settings |
| GET | /images/:filename | Static images |
| **Admin** | | |
| GET | /admin/pending-activities | List pending |
| POST | /admin/activities/:id/approve | Approve |
| POST | /admin/activities/:id/reject | Reject |

All requests use `X-Device-ID` for guest mode. Authenticated requests use `Authorization: Bearer <token>`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| PORT | API port (default: 3001) |
| JWT_SECRET | Secret for JWT signing |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS | Email for password reset |
| SMTP_FROM | From address |
| ADMIN_USER_IDS | Comma-separated user IDs for admin |

See `backend/.env.example` for a template.

### App (`app/.env`)

| Variable | Description |
|----------|-------------|
| EXPO_PUBLIC_API_URL | API base URL (default: http://localhost:3001) |

## Tech Stack

| Layer | Choice |
|-------|--------|
| API | Node.js, Fastify |
| Database | SQLite (better-sqlite3) |
| Auth | JWT, bcrypt |
| Mobile | Expo, React Native |
| Styling | NativeWind (Tailwind) |
| Email | Nodemailer |

## License

MIT
