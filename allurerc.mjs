export default {
  environments: {
    chromium: {
      name: "Chromium",
      matcher: ({ labels }) => labels.some(({ name, value }) => name === "parentSuite" && value === "chromium"),
    },
    firefox: {
      name: "Firefox",
      matcher: ({ labels }) => labels.some(({ name, value }) => name === "parentSuite" && value === "firefox"),
    },
    webkit: {
      name: "WebKit",
      matcher: ({ labels }) => labels.some(({ name, value }) => name === "parentSuite" && value === "webkit"),
    },
  },
};
