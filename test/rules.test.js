"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../rules.js");

test("recognizes the exact confirmation labels", () => {
  assert.equal(rules.isContinueLabel("Yes, continue"), true);
  assert.equal(rules.isContinueLabel("  YES,   CONTINUE  "), true);
  assert.equal(rules.isContinueLabel("Continue"), false);
  assert.equal(rules.isContinueLabel("Yes, delete"), false);
});

test("recognizes the decline label without broad matching", () => {
  assert.equal(rules.isDeclineLabel("No thanks"), true);
  assert.equal(rules.isDeclineLabel("No"), false);
});

test("recognizes the warning shown by Google", () => {
  const copy = [
    "Continue with this search?",
    "Malicious queries could result in unsafe or harmful actions."
  ].join(" ");

  assert.equal(rules.hasPromptTitle(copy), true);
  assert.equal(rules.hasWarningCopy(copy), true);
});

test("rejects ordinary search UI copy", () => {
  const copy = "Continue with this search? Here are your results.";
  assert.equal(rules.hasPromptTitle(copy), true);
  assert.equal(rules.hasWarningCopy(copy), false);
});

test("requires udm=50 as an exact query parameter", () => {
  assert.equal(
    rules.hasAiModeFlag("https://www.google.com/search?udm=50&q=test"),
    true
  );
  assert.equal(
    rules.hasAiModeFlag("https://www.google.com/search?q=udm%3D50"),
    false
  );
  assert.equal(
    rules.hasAiModeFlag("https://www.google.com/search?udm=2&q=test"),
    false
  );
  assert.equal(rules.hasAiModeFlag("not a URL"), false);
});

test("accepts the Google AI Mode URL before and after confirmation", () => {
  const before =
    "https://www.google.com/search?udm=50&atvm=2&q=how+good+is+big+pickel";
  const after =
    "https://www.google.com/search?atvm=2&q=how+good+is+big+pickel&udm=50&mstk=AUtExfCHexlYYxi92sVNkIeqsZbN8tnx5iVmRXejsYuIOSF5j75C144fqDeXauvOh9D6u5DzPCdKvfWfLvsIT6ClF_2xZE8XxUqns9rkbVVtgCJjbPsEg4rl3qgfaCZiOA0_5rUiG9qexmpR8OxiRY3LaZL38CF5hWduHDqHHvuEG53e-9cVq-7bEXVedeoKPpZkvBAeokHLZJIKyW7PZNoQ0eRar9qgXWE-zXUKl2LUhRu6a4LhxJRE_ek7qV0WrxR-OFhmV5veA7mKjw&csuir=1";

  assert.equal(rules.hasAiModeFlag(before), true);
  assert.equal(rules.hasAiModeFlag(after), true);
});
