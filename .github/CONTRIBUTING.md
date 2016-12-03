# Contributing to XMTP

To get started with the repo, make sure to use Node.js v7+ and clone the repo:
```bash
$ nvm use v7 || nvm install v7
$ git clone git@github.com:xmtpjs/xmtp.git && cd xmtp
$ npm install
```

In order to run the tests:
```bash
$ npm test
```

Or the coverage report:
```bash
$ npm run test-cov && open coverage/lcov-report/index.html
```

Or the linter:
```bash
$ npm run lint
```

Or the benchmarker:
```bash
$ npm run bench
```

## Submitting Issues
You can create an issue [here](https://github.com/xmtpjs/xmtp/issues/new), but before doing that please read the notes below and include as many details as possible with your report. If you can, please include:
* The version of XMTP that you are using.
* The version of Node.js you are using, and if you are using Babel.
* A minimum sample of code recreating the issue.
* What you expected to happen and what actually happened.
* Error output or debug logs.
* Screenshots or animated GIFs.

Please perform a cursory search, prior to submitting your issue, to see if a similar issue has already been submitted.

## Submitting Pull Requests
* Follow the JavaScript coding style.
 * Easiest way to do this is by using EditorConfig or ESLint.
 * Make sure to run `npm run lint` and fixing any errors/warnings before pushing up.
* Write tests for your new feature, bug fix, or change.
 * Coverage should not go down, because of your change.
 * If you need help writing tests, we can guide you.
* Write documentation on your new feature or a change in how something works.
 * All documentation is in the root `docs` folders.
 * Write documentation in Markdown.
* Use short, present tense commit messages.

## General Code Conventions
* Tabs for indentation (no spaces).
* 80 character line length strongly preferred.
* Prefer ' over ".
* ES2015 syntax when possible.
* 'use strict';.
* Use arrow functions over `function () {}`
* Use semicolons;
* Trailing commas,
