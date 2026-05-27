import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  ...defineConfig({
    title: "dave",
    description: "UI test suite for halOP — the WildFly management console",
    base: "/dave/",

    themeConfig: {
      nav: [
        { text: "Guide", link: "/getting-started" },
        {
          text: "Reports",
          items: [
            {
              text: "Playwright Report",
              link: "https://hal.github.io/dave/reports/playwright/",
            },
            {
              text: "Allure Report",
              link: "https://hal.github.io/dave/reports/allure/",
            },
          ],
        },
      ],

      sidebar: [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/getting-started" },
            { text: "Why Playwright?", link: "/why-playwright" },
            { text: "Running Tests", link: "/running-tests" },
            { text: "Code Quality", link: "/code-quality" },
            { text: "Configuration", link: "/configuration" },
          ],
        },
        {
          text: "Architecture",
          items: [
            { text: "Overview", link: "/architecture" },
            { text: "Fixtures", link: "/fixtures" },
            { text: "Glossary", link: "/glossary" },
          ],
        },
        {
          text: "Contributing",
          items: [
            {
              text: "Writing Tests",
              link: "/writing-tests/",
              items: [
                { text: "Finding Elements", link: "/writing-tests/finding-elements" },
                { text: "Test Patterns", link: "/writing-tests/test-patterns" },
                { text: "Page Objects", link: "/writing-tests/page-objects" },
              ],
            },
            { text: "Skills", link: "/skills" },
            { text: "Sync", link: "/sync" },
            { text: "CI/CD", link: "/ci-cd" },
          ],
        },
      ],

      socialLinks: [{ icon: "github", link: "https://github.com/hal/dave" }],

      editLink: {
        pattern: "https://github.com/hal/dave/edit/main/docs/:path",
      },

      search: {
        provider: "local",
      },

      footer: {
        message: "UI test suite for halOP — the WildFly management console",
      },
    },
  }),

  mermaid: {
    theme: "default",
    flowchart: { useMaxWidth: true, rankSpacing: 80 },
    sequence: { useMaxWidth: true },
  },
});
