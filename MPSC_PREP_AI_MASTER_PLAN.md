# MPSC Prep AI — Master Product & Development Plan

## 1. Product Overview

Build a production-ready MPSC Group C preparation platform focused on Previous Year Questions (PYQs), daily quizzes, AI-assisted question processing, personalized practice, analytics, and free/paid plans.

Core flow:

Admin uploads PYQ paper
→ PDF/OCR/text extraction
→ AI structures questions
→ validation
→ admin review
→ approval
→ question bank
→ daily/subject/topic/PYQ quizzes
→ student attempts
→ performance analytics
→ weak-topic detection
→ personalized practice.

The system must clearly distinguish real PYQs from AI-generated questions.

---

## 2. Primary Goals

Students should be able to:

- Practice MPSC Group C PYQs.
- Practice by year, paper, subject, and topic.
- Take daily quizzes.
- Take subject/topic quizzes.
- Take full mock tests.
- Review wrong answers.
- Bookmark questions.
- Track accuracy and time.
- Identify weak topics.
- Receive personalized quizzes.
- Use free or paid plans.

Admins should be able to:

- Upload question papers and answer keys.
- Process PDFs with AI.
- Review extracted questions.
- Edit/approve/reject questions.
- Manage subjects/topics/exams.
- Build and schedule quizzes.
- Generate AI practice quizzes.
- Manage users and subscriptions.
- View analytics.
- Review reported questions.
- Configure platform settings.

---

## 3. Recommended Technology Stack

Preferred stack:

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- TanStack Query
- Chart library

### Backend
- Node.js
- Express.js
- REST APIs
- Prisma ORM

### Database
- PostgreSQL

### Authentication
- Secure cookie/session or JWT architecture
- Password hashing

### Storage
- Object storage for PDFs and uploaded files

### AI
- Server-side AI provider abstraction
- API keys only on backend

### Optional later infrastructure
- Redis
- BullMQ or another background job system

### Payments
- Razorpay or another suitable Indian payment provider

---

## 4. Architecture Principles

Use a modular architecture.

Do not hardcode MPSC Group C subjects or marking rules throughout the application.

Model the hierarchy:

Exam
→ Stage
→ Year
→ Paper
→ Subject
→ Topic
→ Question.

The architecture should later support other exams without rewriting the application.

Use:

- Separation of concerns
- Reusable services
- DTO/validation layers where appropriate
- Centralized error handling
- Environment-based configuration
- Database migrations
- Proper indexes
- Audit logging
- Secure file handling

---

## 5. User Roles

### STUDENT

Permissions:

- Register/login
- View dashboard
- Practice questions
- Take quizzes
- Review results
- Bookmark questions
- View wrong questions
- View analytics
- Manage subscription
- View profile

### ADMIN

Permissions:

- Upload papers
- Process papers
- Review questions
- Edit questions
- Approve/reject questions
- Manage subjects/topics
- Manage quizzes
- Generate AI quizzes
- Manage users
- Manage plans
- View analytics
- Review reports

### SUPER_ADMIN

Optional later:

- Manage admins
- Manage system-wide settings
- Manage permissions

---

## 6. Student Pages

Public:

- Home
- About
- Features
- Pricing
- PYQ Library
- Login
- Register
- Forgot Password
- Contact

Authenticated:

- Dashboard
- Daily Quiz
- Subject Practice
- Topic Practice
- PYQ Practice
- Full Mock Test
- Quiz History
- Performance Analytics
- Weak Topics
- Wrong Questions
- Bookmarks
- Revision
- Leaderboard
- Subscription
- Profile
- Settings

---

## 7. Landing Page

Hero:

Headline:
"Prepare Smarter for MPSC Group C with PYQs + AI"

Subheading:
"Practice previous-year questions, take daily quizzes, identify weak topics and improve your MPSC preparation with AI-powered practice."

Buttons:

- Start Free Practice
- Explore PYQs

Dynamic metrics:

- Total PYQs
- Total quizzes
- Subjects
- Students

Sections:

1. Hero
2. Features
3. How It Works
4. PYQ Categories
5. Daily Quiz
6. AI Quiz Generation
7. Performance Analytics
8. Pricing
9. Testimonials
10. FAQ
11. Footer

---

## 8. Student Dashboard

Show:

### Today's Progress
- Questions attempted
- Correct answers
- Accuracy
- Time spent
- Daily streak

### Today's Quiz
- Quiz title
- Question count
- Duration
- Start button

### Subject Performance
- History
- Geography
- Indian Polity
- Economy
- General Science
- Current Affairs
- Marathi
- English
- Mathematics
- Reasoning

### Weak Areas
Display weak subjects/topics and a "Practice Weak Topics" action.

### Recent Activity
Show quiz name, score, accuracy, and date.

---

## 9. Question Bank

Filters:

- Exam
- Stage
- Year
- Paper
- Subject
- Topic
- Difficulty
- Language
- Question type

Question page should show:

- Question
- Four options
- Correct answer after submission
- Explanation
- Source
- Bookmark
- Report question

Question badges:

- PYQ
- AI Generated
- Practice
- Mock

---

## 10. Quiz Engine

Support:

### Daily Quiz
Configurable question count and duration.

### Subject Quiz
Questions from one subject.

### Topic Quiz
Questions from one topic.

### PYQ Quiz
Actual approved PYQs.

### Full Mock Test
Exam-style timed quiz.

### Revision Quiz
Previously incorrect/bookmarked questions.

### Weak Topic Quiz
Questions based on weak topics.

Quiz interface:

- Question number
- Options
- Timer
- Progress
- Next
- Previous
- Mark for review
- Clear answer
- Submit

After submission:

- Score
- Correct
- Incorrect
- Unattempted
- Accuracy
- Time
- Subject performance
- Topic performance
- Review answers

---

## 11. Daily Quiz System

Do not generate a new AI quiz for every student request.

Create/cache a daily quiz once and let eligible users attempt it.

Admin-configurable fields:

- Date
- Subjects
- Number of questions
- Difficulty
- PYQ percentage
- AI-generated percentage
- Duration
- Language

Example:

20 questions
70% PYQ
30% AI/practice
20% easy
60% medium
20% hard

---

## 12. Admin Panel

Dashboard cards:

- Total users
- Active users
- Premium users
- Total questions
- Approved questions
- Pending questions
- AI-generated questions
- Total quizzes
- Today's attempts
- Revenue

Admin modules:

- Dashboard
- Papers
- Questions
- Subjects
- Topics
- Quizzes
- AI generation
- Users
- Plans
- Subscriptions
- Reports
- Notifications
- Analytics
- Settings
- Audit logs

---

## 13. PYQ Upload Pipeline

Admin selects:

- Exam
- Stage
- Year
- Paper
- Language

Uploads:

- Question paper PDF/image
- Optional answer key

Pipeline:

Upload
→ Store file
→ Create processing job
→ Extract text/OCR
→ AI structure extraction
→ Validate
→ Detect duplicates
→ Save as PENDING_REVIEW
→ Admin review
→ APPROVED/REJECTED.

AI extraction must never automatically publish trusted content.

---

## 14. AI Question Extraction

Return structured data similar to:

{
  "question": "...",
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "correctAnswer": "B",
  "subject": "Polity",
  "topic": "Indian Constitution",
  "difficulty": "Medium",
  "language": "Marathi",
  "year": 2025,
  "exam": "MPSC Group C",
  "stage": "Prelims",
  "explanation": "...",
  "source": "MPSC Group C 2025 Prelims"
}

Question status:

- PENDING_REVIEW
- APPROVED
- REJECTED

---

## 15. AI Quiz Generation

Admin chooses:

- Subject
- Topic
- Number
- Difficulty
- PYQ percentage
- AI percentage
- Language

AI-generated questions must not be labelled as real PYQs.

AI generation should use approved question/topic context and produce structured output.

Every generated question should contain:

- question
- options
- correctAnswer
- explanation
- subject
- topic
- difficulty
- language
- questionType

---

## 16. Validation and Duplicate Detection

Validate:

- Exactly four options
- Exactly one correct answer
- Required fields
- Valid subject/topic
- Valid difficulty
- Valid language
- No duplicate
- Explanation where required

Duplicate detection can use:

- Normalized text
- Hashing
- Similarity/embeddings later

Admin must see possible duplicates before approval.

---

## 17. Initial Subject Configuration

Make subjects configurable.

Initial suggested subjects:

- History
- Geography
- Indian Polity
- Economy
- General Science
- Current Affairs
- Marathi
- English
- Mathematics
- Reasoning

Do not assume these are permanently correct. Admin must be able to configure the current official exam structure and syllabus.

---

## 18. Performance Tracking

For each quiz answer store:

- User ID
- Quiz ID
- Question ID
- Selected answer
- Correct answer
- Time spent
- Correct/incorrect
- Attempt date

Calculate:

- Overall accuracy
- Subject accuracy
- Topic accuracy
- Difficulty accuracy
- Average time
- Attempt rate
- Weak topics
- Strong topics

Initial weak-topic rule:

If attempts >= 10 and accuracy < 60%:
WEAK

If accuracy >= 80%:
STRONG

Otherwise:
NORMAL

Make thresholds configurable.

---

## 19. Revision

Automatically maintain:

### Wrong Questions
Questions answered incorrectly.

### Bookmarks
Questions explicitly bookmarked.

### Revision Quiz
Generated from wrong/bookmarked/weak-topic questions.

---

## 20. Subscription Plans

Example only; admin must control values.

### Free
- 10 questions/day
- Limited PYQs
- Basic analytics
- Ads

### Premium
- Unlimited practice
- Full PYQ library
- AI quizzes
- Full mock tests
- Advanced analytics
- Weak-topic practice
- Revision mode
- No ads

Possible example prices:

- Monthly: ₹99
- Quarterly: ₹249
- Yearly: ₹699

Do not hardcode pricing.

Backend must enforce plan permissions.

---

## 21. Subscription Data Model

Entities:

- Plan
- Subscription
- Payment
- PaymentTransaction
- SubscriptionHistory

Statuses:

- ACTIVE
- EXPIRED
- CANCELLED
- PENDING
- FAILED

Never store card details.

Payment verification must happen server-side.

---

## 22. Database Model

Recommended PostgreSQL entities:

- users
- roles
- plans
- subscriptions
- payments
- exams
- exam_stages
- papers
- paper_files
- subjects
- topics
- questions
- question_options
- question_sources
- question_tags
- question_embeddings
- quizzes
- quiz_questions
- quiz_attempts
- quiz_answers
- bookmarks
- wrong_questions
- user_progress
- notifications
- ai_generation_jobs
- ai_usage_logs
- admin_logs
- reports
- settings

Use foreign keys, unique constraints, indexes, timestamps, and migrations.

---

## 23. Question Model

Support fields such as:

- id
- examId
- stageId
- paperId
- year
- subjectId
- topicId
- questionText
- language
- questionType
- difficulty
- explanation
- correctOption
- sourceType
- sourceReference
- aiGenerated
- aiConfidence
- status
- createdAt
- updatedAt

---

## 24. REST API Structure

Student/public APIs:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/me
- GET /api/exams
- GET /api/subjects
- GET /api/topics
- GET /api/questions
- GET /api/questions/:id
- POST /api/questions/:id/bookmark
- GET /api/quizzes/daily
- GET /api/quizzes/:id
- POST /api/quizzes/:id/start
- POST /api/quizzes/:id/submit
- GET /api/users/progress
- GET /api/users/weak-topics
- GET /api/users/wrong-questions
- GET /api/subscriptions/plans
- POST /api/subscriptions/create
- POST /api/payments/verify

Admin APIs:

- POST /api/admin/papers/upload
- POST /api/admin/papers/:id/process
- GET /api/admin/papers
- GET /api/admin/questions
- PATCH /api/admin/questions/:id
- POST /api/admin/questions/:id/approve
- POST /api/admin/questions/:id/reject
- POST /api/admin/ai/generate-quiz
- POST /api/admin/quizzes
- PATCH /api/admin/quizzes/:id
- POST /api/admin/daily-quizzes
- GET /api/admin/users
- GET /api/admin/analytics
- GET /api/admin/subscriptions

Adapt route naming if the project architecture uses a better convention, but preserve clear separation between student and admin authorization.

---

## 25. Async AI/PDF Processing

Large PDF processing must not block an HTTP request.

Preferred architecture:

Admin upload
→ processing job
→ queue
→ worker
→ extraction/OCR
→ AI
→ validation
→ database
→ review.

A simple background worker is acceptable for MVP. Redis + BullMQ can be introduced later.

---

## 26. Security

Implement:

- Password hashing
- Secure authentication
- Role-based authorization
- Rate limiting
- Input validation
- SQL injection protection through ORM/parameterized queries
- XSS protection
- CSRF protection where applicable
- Secure file upload
- File type validation
- File size limits
- API rate limits
- Secure secrets
- Audit logs

Never expose:

- Database credentials
- AI API keys
- Payment secrets
- Auth secrets

to the frontend.

---

## 27. File Upload Security

Validate:

- MIME type
- Extension
- File size
- Filename

Generate server-side filenames/IDs.

Do not trust original filenames.

Store uploaded files in secure storage rather than a publicly writable folder.

---

## 28. AI Cost Control

Do not call AI for every student question.

Use:

- Cached/generated quizzes
- Stored AI questions
- Pre-generation
- Token usage tracking
- Cost tracking
- Configurable model/provider

AI usage log:

- user/admin
- model
- input tokens
- output tokens
- estimated cost
- request type
- createdAt

---

## 29. Notifications

Support:

- Daily quiz available
- Quiz reminder
- Subscription expiring
- New PYQ uploaded
- New mock test
- Streak reminder

Allow notification preferences.

---

## 30. Leaderboard

Optional.

Support:

- Weekly points
- Monthly points
- Accuracy
- Completion

Allow users to hide their leaderboard identity.

Do not expose private user information.

---

## 31. SEO

Public pages:

- /mpsc-group-c-pyq
- /mpsc-group-c-2025-pyq
- /mpsc-group-c-2024-pyq
- /mpsc-group-c-history-pyq
- /mpsc-group-c-polity-pyq

Use dynamic metadata.

---

## 32. Source and Content Integrity

Store source metadata for actual PYQs:

- exam
- year
- stage
- paper
- question number
- source file
- page number where available
- source type

Do not mix actual PYQs and AI-generated questions.

Only use uploaded material that the platform has permission/right to use, and retain appropriate source attribution.

---

## 33. Question Reporting

Students can report:

- Wrong answer
- Wrong explanation
- Typo
- Duplicate
- Poor question
- Other

Admin can review and resolve reports.

---

## 34. Mobile-First UX

The student interface should be mobile-first.

Use:

- Responsive layout
- Large touch targets
- Sticky timer
- Simple quiz navigation
- Fast loading
- Low-bandwidth-friendly UI

Admin interface can be denser and desktop-oriented.

---

## 35. Development Phases

### PHASE 1 — Foundation
- Repository structure
- Frontend initialization
- Backend initialization
- PostgreSQL
- Prisma
- Environment configuration
- Basic routing
- Health-check API
- README

### PHASE 2 — Authentication
- Register
- Login
- Logout
- Password hashing
- Authentication
- Roles
- Protected routes

### PHASE 3 — Database
- Exams
- Stages
- Subjects
- Topics
- Papers
- Questions
- Options
- Quizzes

### PHASE 4 — Admin Panel
- Admin login
- Dashboard
- Subject management
- Topic management
- Question management
- Paper management

### PHASE 5 — Manual Question Entry
- Create/edit questions
- Answer
- Explanation
- Metadata
- Status workflow

### PHASE 6 — PDF Upload
- Secure upload
- Paper metadata
- Storage
- Processing status

### PHASE 7 — AI Extraction
- Text extraction
- OCR where necessary
- AI structured extraction
- Validation
- Duplicate detection
- Pending review

### PHASE 8 — Question Review
- PDF preview
- Extracted question editor
- Approve/reject workflow

### PHASE 9 — Quiz Engine
- Daily
- Subject
- Topic
- PYQ
- Mock
- Timer
- Scoring
- Review

### PHASE 10 — Student Dashboard
- Progress
- Accuracy
- Weak topics
- Quiz history
- Wrong questions
- Bookmarks

### PHASE 11 — AI Quiz Generation
- AI questions
- AI quizzes
- Weak-topic quizzes
- Personalized practice

### PHASE 12 — Subscriptions
- Plans
- Checkout
- Payment verification
- Subscription
- Feature gating

### PHASE 13 — Analytics
- Student analytics
- Admin analytics
- Revenue
- AI usage

### PHASE 14 — Notifications
- Daily quiz
- Subscription
- New content

### PHASE 15 — Security Audit
- Auth
- Authorization
- APIs
- File uploads
- Rate limiting
- Secrets

### PHASE 16 — Testing
- Unit
- Integration
- E2E
- Mobile
- Performance

### PHASE 17 — Deployment
- Frontend
- Backend
- PostgreSQL
- Object storage
- Optional Redis
- HTTPS
- Monitoring

---

## 36. MVP Scope

Build this first:

Student:
- Register/login
- Dashboard
- PYQ practice
- Daily quiz
- Quiz result
- Basic analytics

Admin:
- Login
- Upload PDF
- Manual question entry
- AI extraction
- Question review
- Question management
- Quiz creation

Monetization:
- Free plan
- Premium plan architecture

Later:
- Advanced personalization
- Leaderboard
- Notifications
- Advanced analytics
- Mobile app

---

## 37. Development Rule

Do not implement the whole application at once.

For every phase:

1. Analyze requirements.
2. Explain the implementation plan.
3. Implement only the current phase.
4. Run the application.
5. Test it.
6. Fix errors.
7. Show the resulting structure and important changes.
8. Stop.

Only continue when the user explicitly confirms completion.

Start with PHASE 1.
