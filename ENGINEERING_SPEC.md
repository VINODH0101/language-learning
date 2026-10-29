# Polyglot C1 Daily
## Master Engineering Specification

### 1. Project objective

Build a deployable, automated language-learning application that helps one learner progress toward CEFR C1 proficiency in Portuguese and Spanish.

The application must deliver personalized daily lessons by email, maintain learning history, provide interactive exercises, and track progress.

The system must be designed to operate using free-tier hosting, open educational resources, and services that do not require paid subscriptions for the intended workload.

**No local AI model, GPU, or continuously running personal computer may be required in production.**

### 2. Mandatory architecture

Use the following architecture unless a documented technical limitation requires a better free alternative.

- Frontend: React and Vite.
- Hosting: Cloudflare Pages or another suitable free static hosting service.
- Database: Supabase PostgreSQL, using a free project.
- Scheduled execution: GitHub Actions.
- Content engine: Python.
- Email delivery: Resend or another suitable free email provider.
- Educational content: openly licensed datasets, public educational resources, and original template-generated exercises.
- Version control: GitHub.

Do not introduce a continuously running backend server unless required.

Use serverless functions or scheduled jobs for operations that do not need a persistent process.

### 3. Zero-cost design

The application must not require:
- Ollama or another locally installed language model.
- Paid AI APIs.
- Paid domains.
- Paid database plans.
- Paid application hosting.
- Paid email subscriptions for normal personal use.

Optional free AI APIs may be supported through an adapter, but the application must work without them.

Check current provider restrictions before implementation. Never claim that an external service is permanently free.

Disable paid upgrades and pay-as-you-go features wherever possible. Document any service that requires payment details or additional account verification.

### 4. Language-learning requirements

Maintain separate learning tracks for Portuguese and Spanish.

Each track must have:
- A configurable starting proficiency level.
- A target of C1.
- A configurable regional variety.
- A structured curriculum.
- Vocabulary history.
- Grammar history.
- Exercise results.
- Review schedules.
- Assessment history.

Support Brazilian and European Portuguese, and multiple Spanish varieties.

Do not assume the learner is a beginner. Provide a diagnostic assessment if the initial level is unknown.

### 5. Daily lesson requirements

Generate one new lesson per language per day.

Each lesson must contain:

1. Learning objectives.
2. At least 12 vocabulary items, with definitions and examples.
3. Grammar explanations.
4. Reading comprehension.
5. A natural conversation.
6. Speaking practice.
7. A writing assignment.
8. Listening practice.
9. Exercises.
10. Answer keys and explanations.
11. Review of previously studied material.
12. Further-learning resources.

Target approximately 45–60 minutes per language when all activities are completed.

Provide shorter study modes for busy days.

### 6. Curriculum progression

The curriculum must progress from the learner's actual starting level toward C1.

Cover:
- Grammar and syntax.
- Vocabulary and collocations.
- Idiomatic expressions.
- Formal and informal registers.
- Reading comprehension.
- Listening comprehension.
- Spoken interaction.
- Extended spoken production.
- Writing and argumentation.
- Summarization and mediation.
- Professional and academic communication.
- Regional differences.
- Common learner errors.

Introduce review and consolidation weeks.

Do not equate lesson completion with demonstrated proficiency.

### 7. Resource licensing and attribution

Prioritize sources that explicitly permit reuse.

For every imported dataset or example, store:
- Source name.
- Source URL.
- Applicable license.
- Attribution requirements.
- Original text where permitted.
- Language and regional variety.
- Import date.

Do not assume that free-to-access material can be redistributed.

Respect dataset terms, attribution requirements, rate limits, and applicable copyright restrictions.

Prefer small, curated datasets over downloading enormous corpora.

### 8. Content generation without AI

The application must be fully functional without an AI model.

Implement:
- Template-based lesson generation.
- Curriculum-driven topic selection.
- Vocabulary retrieval.
- Grammar exercises with deterministic answer checking.
- Sentence translation exercises where reliable answer sets are available.
- Cloze exercises.
- Reading comprehension questions.
- Spaced repetition.
- Progress summaries.
- Original writing and speaking prompts.

Use structured, curated lesson templates rather than pretending a small collection of templates is unlimited original content.

Provide a fallback when a topic has insufficient resources.

### 9. Optional AI integration

If an eligible free hosted model API is available, support it through a provider-independent interface.

The interface must:
- Read credentials from environment variables.
- Validate generated JSON.
- Enforce timeouts.
- Limit retries.
- Detect malformed output.
- Handle provider outages.
- Preserve the non-AI fallback.

Do not make successful daily delivery dependent on an optional AI service.

Never send personal credentials or unnecessary learner information to a model provider.

### 10. Email delivery

Send a combined daily email containing both language lessons.

The email must:
- Have a date-specific subject.
- Be mobile-friendly.
- Use readable typography.
- Separate the two languages.
- Place answers after exercises.
- Include useful resource links.
- Include a dashboard link.
- Indicate the estimated study time.
- Identify the language variety and proficiency target.

Support preview mode and test delivery.

Record delivery status and provider response identifiers when available.

Do not mark an email as delivered merely because the request was created.

Use bounded retries and prevent duplicate daily deliveries.

If email delivery fails, preserve the lesson and display the failure in the dashboard.

### 11. Learning history

Store:
- User preferences.
- Language level and regional variety.
- Daily lesson identifiers.
- Vocabulary history.
- Exercise attempts and results.
- Incorrect answers.
- Review dates.
- Completed activities.
- Assessment results.
- Email delivery history.

Use database constraints to prevent duplicate lessons and deliveries for the same learner, language, and date where appropriate.

Use migrations to manage schema changes.

### 12. Security requirements

- Never commit secrets to source control.
- Never expose email API keys or database service-role credentials to the frontend.
- Keep privileged database operations in trusted server-side execution.
- Validate API inputs.
- Escape untrusted HTML.
- Use appropriate row-level security policies.
- Store only necessary personal information.
- Protect scheduled job endpoints against unauthorized invocation.
- Use least-privilege credentials.
- Provide a secure configuration guide.

### 13. Scheduling requirements

Use a GitHub Actions scheduled workflow.

The workflow must:
- Run once per day.
- Use an explicitly configured timezone or UTC with a documented conversion.
- Support manual execution.
- Prevent concurrent duplicate runs.
- Generate lessons.
- Save progress.
- Send email.
- Record success or failure.
- Preserve diagnostic logs.

Do not rely exclusively on a schedule to determine the lesson date. Calculate the intended date using the configured timezone.

### 14. Testing requirements

Include automated tests for:
- Curriculum selection.
- Content validation.
- Duplicate detection.
- Database operations.
- Exercise answer checking.
- Email rendering.
- Email failure handling.
- Missing configuration.
- Scheduled execution.
- Security-sensitive configuration.
- Frontend error states.

Mock external services in unit tests.

Provide a separate integration-test mode for testing actual database and email connections.

### 15. Deployment requirements

Produce a complete repository that includes:
- Frontend source.
- Backend or scheduled-job source.
- Database migrations.
- Seed data.
- Automated tests.
- GitHub Actions workflow.
- Deployment configuration.
- Environment variable example.
- `.gitignore`.
- README.
- Troubleshooting instructions.
- Free-tier setup instructions.

The application must be deployable by following documented steps without purchasing a domain or subscription.

### 16. Acceptance criteria

The project is complete only when:

1. The frontend builds successfully.
2. The application can retrieve and display both language tracks.
3. The curriculum and exercises work without AI.
4. Learning history persists in the database.
5. The scheduled workflow completes successfully.
6. A combined email is received by the configured recipient.
7. Duplicate daily delivery is prevented under normal retry conditions.
8. Failures are logged and recoverable.
9. No secrets are exposed in frontend bundles or source control.
10. The application is deployed to a public HTTPS URL.
11. The repository contains reproducible deployment instructions.
12. The complete workflow has been tested end to end.

### 17. Engineering principle

Build a reliable learning product first and add sophisticated generation later.

The system must remain useful, maintainable, and deployable even when optional AI providers or individual free services become unavailable.