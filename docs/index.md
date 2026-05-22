---
layout: home

hero:
  name: dave
  text: UI Test Suite
  tagline: End-to-end tests for halOP — the WildFly management console
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Writing Tests
      link: /writing-tests
    - theme: alt
      text: GitHub
      link: https://github.com/hal/dave

features:
  - title: Automated Containers
    details: Each test file gets its own WildFly container via testcontainers — fully isolated, automatically started and stopped.
  - title: Page Object Model
    details: Clean separation between test logic and UI locators. Page objects are injected as Playwright fixtures — ready to use.
  - title: Multi-Browser
    details: Tests run in Chromium, Firefox, and WebKit. OUIA attributes provide stable element selectors across browsers.
---
