# Other — eslint.config.js

This document describes the `eslint.config.js` module, which defines the project's ESLint configuration using the new flat configuration format.

## ESLint Configuration Module (`eslint.config.js`)

### Purpose

The `eslint.config.js` module is the central configuration file for ESLint in this project. Its primary purpose is to:

*   **Enforce Code Style:** Maintain a consistent coding style across the entire codebase.
*   **Identify Potential Errors:** Catch common programming mistakes and anti-patterns early in the development cycle.
*   **Improve Code Quality:** Ensure code adheres to best practices, enhancing readability, maintainability, and reducing bugs.

By centralizing these rules, it ensures all developers adhere to the same standards, improving collaboration and the overall health of the codebase.

### Core Functionality

This module leverages the `@antfu/eslint-config` package as its foundational configuration. It imports this robust base configuration and then applies project-specific overrides and additions. This approach minimizes boilerplate and allows the project to benefit from a well-maintained and opinionated set of linting rules, while still allowing for necessary customizations.

When ESLint is executed (e.g., via the command line, a build script, or an IDE integration), it automatically discovers and applies the rules defined in this file to all relevant source code.

### Key Components

The `eslint.config.js` file is structured around importing and configuring the `antfu` base setup:

1.  **`import antfu from '@antfu/eslint-config'`**:
    *   This line imports the default export from the `@antfu/eslint-config` package. This package provides a comprehensive, opinionated, and well-maintained set of ESLint rules, often used in modern TypeScript/Vue/React projects. It acts as the baseline for our project's linting setup, significantly reducing the need to configure hundreds of individual rules from scratch.

2.  **`export default antfu({ ... }, { ... })`**:
    *   This exports the final ESLint configuration. The `antfu` function is called with two primary arguments:

    *   **First Argument (Base Options for `@antfu/eslint-config`):**
        An object containing options that configure the behavior of the `@antfu/eslint-config` itself.
        *   `typescript: true`: This crucial option enables TypeScript-specific linting rules and parser configurations provided by `@antfu/eslint-config`. It ensures that TypeScript syntax is correctly parsed and type-aware rules are applied.
        *   `ignores`: An array of glob patterns specifying files and directories that ESLint should *not* process. This is essential for performance and avoiding linting generated files, build artifacts, or third-party code.
            *   `dist`, `node_modules`, `coverage`: Common build outputs and dependency directories.
            *   `.nuxt`, `.output`, `.temp`: Nuxt.js specific build/cache directories.
            *   `!.github`: An exception to a broader ignore pattern, ensuring `.github` files (e.g., workflows) are linted if they contain lintable code.
            *   `specs/**/*.md`: Ignores Markdown files within `specs` directories, as they typically don't contain lintable code.
            *   `.claude/**`, `.gemini/**`, `.opencode/**`: Directories likely related to AI-generated code or specific development environments, which might not adhere to project linting standards or are temporary.

    *   **Second Argument (Overrides/Custom Rules):**
        An object where project-specific ESLint rules can be added or existing rules can be overridden.
        *   `rules: { /* Custom rules can be added here */ }`: This empty object serves as a placeholder. Developers can add or modify individual ESLint rules here. For example, to disable a specific rule: `'no-console': 'off'`.

### Architecture Diagram

The following diagram illustrates how `eslint.config.js` integrates with ESLint and leverages the base configuration:

```mermaid
graph TD
    A[ESLint CLI / IDE Integration] --> B[eslint.config.js]
    B --> C[@antfu/eslint-config]
```
*Explanation:* The ESLint CLI or IDE integrations consume `eslint.config.js` as the project's primary configuration. This configuration file, in turn, builds upon the base rules and configurations provided by `@antfu/eslint-config`, applying project-specific customizations and ignored paths.

### Integration with the Codebase

*   **Automatic Discovery:** ESLint automatically detects `eslint.config.js` in the project root, making it the default configuration for all linting operations.
*   **Development Workflow:**
    *   **IDE Support:** Most modern IDEs (e.g., VS Code, WebStorm) have ESLint extensions that automatically pick up this configuration, providing real-time feedback on code quality directly in the editor.
    *   **Pre-commit Hooks:** This configuration is typically integrated with tools like Husky and lint-staged, ensuring that only lint-clean code is committed to the repository.
    *   **CI/CD Pipelines:** Used in continuous integration pipelines to enforce code quality checks before merging pull requests, preventing regressions and maintaining a high standard of code.

### Contribution and Customization

Developers needing to adjust the linting rules for project-specific requirements should modify `eslint.config.js`.

*   **Adding/Overriding Rules:** To add a new rule or override an existing one, modify the `rules` object in the second argument of the `antfu` call:
    ```javascript
    export default antfu({
      // ... base options
    }, {
      rules: {
        'indent': ['error', 2], // Example: enforce 2-space indentation
        'no-console': 'warn', // Example: change 'no-console' from error to warn
        // ... other custom rules
      },
    })
    ```
*   **Modifying Ignores:** To add or remove paths from being linted, adjust the `ignores` array in the first argument.
*   **Extending Base Configuration:** For more advanced scenarios, consult the `@antfu/eslint-config` documentation for further customization options that can be passed in the first argument.
