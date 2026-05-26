# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Spring Boot backend and a Vite React frontend.

- `backend/`: Java 21 Spring Boot API. Source lives in `src/main/java/com/expensetracker/`, grouped by `controller`, `model`, `repository`, and `config`.
- `backend/src/main/resources/application.properties`: local H2, JPA, CORS, and server settings.
- `frontend/`: React 19 + TypeScript app built with Vite. UI files are in `src/`; static assets are in `public/` and `src/assets/`.
- `prompts/`: AI prompt material, including `finance-ai-system-prompt.md`.
- `expense_tracker_plan.md`: product and implementation planning notes.

## Build, Test, and Development Commands

Run backend commands from `backend/`:

- `mvn spring-boot:run`: start the API on port `8080`.
- `mvn test`: run Spring Boot tests.
- `mvn package`: compile, test, and create the backend artifact.

### Local Database Setup (MongoDB via Docker)

- **Create and Start Container with Persistent Storage:**
  ```bash
  docker run --name expensetracker-mongo -p 27017:27017 -v expensetracker-data:/data/db -d mongo:latest
  ```
- **Start Existing Container:**
  ```bash
  docker start expensetracker-mongo
  ```
- **Stop Container:**
  ```bash
  docker stop expensetracker-mongo
  ```

Run frontend commands from `frontend/`:

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start Vite development server.
- `npm run build`: type-check with `tsc -b` and build production assets.
- `npm run lint`: run ESLint.
- `npm run preview`: serve the production build locally.

## Coding Style & Naming Conventions

Backend code uses standard Java/Spring conventions: `PascalCase` classes, `camelCase` fields and methods, controllers ending in `Controller`, repositories ending in `Repository`, and entities in `model`. Keep packages under `com.expensetracker`.

Frontend code uses TypeScript and React functional components. Name components in `PascalCase`, hooks with `use...`, and variables/functions in `camelCase`. Keep CSS in `src/` unless it is a global asset. Use ESLint before submitting.

## Testing Guidelines

The backend includes `spring-boot-starter-test`; add Java tests under `backend/src/test/java/com/expensetracker/` using `*Test.java` naming. Prefer focused unit tests for services and repositories, and integration tests for controller/API behavior.

No frontend test runner is currently configured. For UI changes, run `npm run lint` and `npm run build`. If adding a test framework, keep tests near the component or under `frontend/src/__tests__/`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative or descriptive messages such as `enhancing repaying logic for debts` and `Rename project from ItWorkedLocally to ExpenseTracker`. Keep commits concise and scoped to one change.

Pull requests should include a clear summary, test/build commands run, linked issues when applicable, and screenshots for visible UI changes. Mention database/configuration impact, especially H2, JPA mapping, or API contract changes.

## Security & Configuration Tips

Do not commit secrets or local credentials. The backend currently uses local MongoDB settings in `application.properties`; keep production database credentials and API keys in environment-specific configuration outside version control.
