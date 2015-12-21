# Contribution Guidelines

Please ensure your pull request adheres to the following guidelines:

- [Read this.](https://github.com/blog/1943-how-to-write-the-perfect-pull-request)
- Search previous suggestions before making a new one, as yours may be a duplicate.
- Make an individual pull request for each suggestion.
- All new functions should be documented and have jsdoc compatible documentation.
- Keep descriptions short and simple, but descriptive.
- Start the description with a capital and end with a full stop/period.
- Check your spelling and grammar.
- Use similar method naming and syntax to existing codebase.
- Make sure your text editor is set to remove trailing whitespace and always leave a new line at the end of any file.

Thank you for your improvements, criticisms, and suggestions! Anything to push forward.

## Needs

Unless otherwise shown, there are no tests or build tools. This is something that needs to be addressed immediately and is the top priority of this project. As it would be wise to have unit tests and Selenium tests to verify the correctness of the extension. It would be nice to have build tools to streamline the build process (simple as it stands but could get complex in the future) and minimize the code for distribution. However, the first step to this is to rewrite the code into testable code. As it stands, it's not very testable. This is the main reason for unit tests not existing.

There is also the desire for a more streamlined UI, error reporting (automatic or done by the user), and some kind of MP3 link (possibly using a third party service but only if desired by the client).

Overall, many thoughts but so few developers! Tests are of utmost importance though and, without them, it is hard for anyone to contribute to the codebase without fear of destroying the entire thing.
