import { describe, expect, test } from "vite-plus/test";
import { buildId, idFromTemplate } from "./id.js";

describe("buildId", () => {
  test("simple", () => {
    expect(buildId("foo")).toBe("foo");
  });

  test("complex", () => {
    expect(buildId("foo", "bar", "1-2", "3")).toBe("foo-bar-1-2-3");
  });

  test("empty and undefined segments are skipped", () => {
    expect(buildId("foo", "", "", "", "bar", "")).toBe("foo-bar");
  });

  test("throws on empty string", () => {
    expect(() => buildId("")).toThrow();
  });

  test("throws on whitespace-only string", () => {
    expect(() => buildId("  ")).toThrow();
  });

  test("asId: lowercase hyphenated", () => {
    expect(buildId("lorem-ipsum")).toBe("lorem-ipsum");
  });

  test("asId: mixed case with space", () => {
    expect(buildId("Lorem Ipsum")).toBe("lorem-ipsum");
  });

  test("asId: alphanumeric with hyphens", () => {
    expect(buildId("l0rem-ip5um")).toBe("l0rem-ip5um");
  });

  test("asId: special characters stripped", () => {
    expect(buildId("lorem §±!@#$%^&*()=_+[]{};'\\:\"|,./<>?`~ ipsum")).toBe("lorem---ipsum");
  });

  test("build: single hyphenated", () => {
    expect(buildId("lorem-ipsum")).toBe("lorem-ipsum");
  });

  test("build: mixed case with space", () => {
    expect(buildId("Lorem Ipsum")).toBe("lorem-ipsum");
  });

  test("build: two segments", () => {
    expect(buildId("Lorem", "Ipsum")).toBe("lorem-ipsum");
  });

  test("build: padded segments", () => {
    expect(buildId(" Lorem ", " Ipsum ")).toBe("lorem-ipsum");
  });

  test("build: alphanumeric with space", () => {
    expect(buildId("l0rem ip5um")).toBe("l0rem-ip5um");
  });

  test("build: alphanumeric two segments", () => {
    expect(buildId("l0rem", "ip5um")).toBe("l0rem-ip5um");
  });

  test("build: alphanumeric padded segments", () => {
    expect(buildId(" l0rem ", " ip5um ")).toBe("l0rem-ip5um");
  });

  test("build: special characters in single string", () => {
    expect(buildId("lorem §±!@#$%^&*()=_+[]{};'\\:\"|,./<>?`~ ipsum")).toBe("lorem---ipsum");
  });

  test("build: special characters as separate segment", () => {
    expect(buildId("lorem", "§±!@#$%^&*()=_+[]{};'\\:\"|,./<>?`~", "ipsum")).toBe("lorem---ipsum");
  });

  test("similar: underscore, hyphen, and space produce the same id", () => {
    const id1 = buildId("foo_bar");
    const id2 = buildId("foo-bar");
    const id3 = buildId("foo bar");
    expect(id1).toBe(id2);
    expect(id1).toBe(id3);
    expect(id2).toBe(id3);
  });

  test("similar: case folding produces the same id", () => {
    const id4 = buildId("foobar");
    const id5 = buildId("fooBar");
    expect(id4).toBe(id5);
  });

  test("similar: separated vs concatenated are different", () => {
    const id1 = buildId("foo_bar");
    const id4 = buildId("foobar");
    expect(id1).not.toBe(id4);
  });
});

describe("idFromTemplate", () => {
  test("empty string returns root", () => {
    expect(idFromTemplate("")).toBe("root");
  });

  test("address template with wildcards", () => {
    expect(idFromTemplate("subsystem=datasources/data-source=*")).toBe("subsystem-e-datasources-s-data-source-e-w");
  });

  test("address template without wildcards", () => {
    expect(idFromTemplate("socket-binding-group=standard-sockets")).toBe("socket-binding-group-e-standard-sockets");
  });
});
