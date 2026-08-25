# AGENTS.md — MPSC Prep AI

## Source of Truth

Read `MPSC_PREP_AI_MASTER_PLAN.md` before making architectural or feature decisions.

The master plan describes the product requirements. This file describes how you must work.

## Core Development Rule

Work phase-by-phase.

Never build the entire platform in one pass.

Current instruction:

**Start with PHASE 1 only.**

Stop after PHASE 1 is implemented and tested.

Wait for the user to explicitly say:

`PHASE 1 COMPLETE`

before starting PHASE 2.

## Workflow for Every Phase

1. Read the relevant requirements.
2. Inspect the existing repository.
3. Understand the current implementation before editing.
4. Explain the implementation plan briefly.
5. Implement the current phase.
6. Run the frontend/backend/database checks.
7. Fix errors.
8. Test the changed functionality.
9. Show the final relevant file structure.
10. Summarize what was completed.
11. Stop and wait for confirmation.

## Do Not

- Do not implement future phases early.
- Do not delete working functionality without a reason.
- Do not rewrite large parts of the project unnecessarily.
- Do not hardcode secrets.
- Do not put AI API keys in frontend code.
- Do not expose database credentials.
- Do not automatically publish AI-extracted questions.
- Do not label AI-generated questions as PYQs.
- Do not assume the exam structure will never change.
- Do not create unnecessary dependencies.
- Do not ignore TypeScript/JavaScript/runtime errors.
- Do not leave broken imports or dead routes.

## Architecture Principles

Prefer:

- Clear separation of frontend/backend responsibilities.
- Reusable components.
- Reusable backend services.
- Environment configuration.
- Database migrations.
- Validation at API boundaries.
- Centralized error handling.
- Proper authorization.
- Secure file handling.
- Consistent API responses.
- Scalable database relationships.

## Security Rules

All secrets belong in environment variables.

Never commit:

- `.env`
- API keys
- Payment secrets
- JWT/session secrets
- Database passwords
- Private certificates

Ensure `.gitignore` covers sensitive files.

Admin endpoints must enforce server-side authorization.

Frontend route protection is not sufficient by itself.

## AI Rules

AI output is untrusted input.

Validate AI-generated JSON before storing it.

AI-extracted PYQs must start in:

`PENDING_REVIEW`

Only an authorized admin can approve them.

AI-generated practice questions must use a distinct question type and must never be represented as authentic PYQs.

## Database Rules

Use migrations.

Avoid destructive schema changes unless explicitly requested.

Use foreign keys and indexes where appropriate.

Do not duplicate data unnecessarily.

Use timestamps consistently.

## UI Rules

Student UI:

- Mobile-first
- Clean
- Fast
- Focused
- Accessible

Admin UI:

- Efficient
- Data-dense
- Clear status indicators
- Good filtering/search

Avoid excessive animations.

## Testing Rules

At minimum, after each phase:

- Start backend.
- Start frontend.
- Run relevant lint/type checks if configured.
- Exercise the main changed flow.
- Fix errors before declaring the phase complete.

## Git Rules

Make focused changes.

Use meaningful commits if the user asks for commits.

Do not force-push or reset user work without explicit permission.

## Phase 1 Deliverable

Phase 1 should establish:

- Project structure
- Frontend
- Backend
- PostgreSQL connection/configuration
- Prisma setup
- Environment configuration
- Basic frontend routing
- Basic backend server
- Health-check endpoint
- Initial README
- Secure `.gitignore`

Do not implement authentication, payments, AI extraction, or the full admin panel in Phase 1.
