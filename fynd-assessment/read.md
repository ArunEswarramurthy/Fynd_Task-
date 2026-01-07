## Task 2: Fynd AI Feedback System

### 1. Problem Statement
Design and implement a **production-ready AI-powered feedback system** with:
- User review submission
- AI-generated responses
- Admin analytics dashboard
- Secure server-side LLM integration

---

### 2. System Overview
A **full-stack, two-dashboard web application**:

- **User Dashboard:** Review submission & AI replies
- **Admin Dashboard:** Analytics, filtering, insights

---

### 3. Architecture

**Frontend**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express
- MongoDB Atlas
- Zod validation

**AI Layer**
- Google Gemini 2.0 Flash
- Server-side only (no API key exposure)

**Deployment**
- Frontend: Vercel
- Backend: Render

---

### 4. Features

#### User Dashboard
- Interactive 5-star rating
- Review submission
- Real-time AI response
- Glassmorphism UI
- Fully responsive design

#### Admin Dashboard
- Real-time analytics
- Auto-refresh every 5 seconds
- Rating distribution charts
- Review filtering
- AI-generated summaries and action items

#### Backend API
- Secure LLM integration
- MongoDB persistence
- Graceful AI fallbacks
- Structured error handling

---

### 5. API Endpoints

#### POST `/api/reviews`
Submits a new review and generates an AI response.

#### GET `/api/reviews`
Fetches reviews with analytics and filters.

#### GET `/api/health`
Health check endpoint.

---

### 6. Security & Reliability
- Server-side LLM calls only
- Zod schema validation
- Sanitized error responses
- Controlled CORS origins

---

### 7. Performance Optimizations
- Indexed MongoDB queries
- Parallel AI processing
- Lazy-loaded components
- Optimized polling strategy

---

### 8. Trade-offs & Limitations
- Polling instead of WebSockets
- No authentication (by design)
- Free-tier API limitations
- No caching layer

---

### 9. Future Improvements
- Authentication and roles
- WebSocket-based real-time updates
- AI response caching
- Review moderation pipeline
- Export analytics (CSV/PDF)

---

### 10. Live Deployment Links

| Component | URL |
|---------|-----|
| User Dashboard | https://userdashboard-two-eta.vercel.app |
| Admin Dashboard | https://admin-pi-indol.vercel.app |
| Backend API | https://fynd-backend-qp8r.onrender.com |
