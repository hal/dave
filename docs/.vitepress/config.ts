import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
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
            { text: "Running Tests", link: "/running-tests" },
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
            { text: "Writing Tests", link: "/writing-tests" },
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
);
