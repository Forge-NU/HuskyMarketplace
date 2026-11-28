import test from "node:test";
import assert from "node:assert/strict";
import { isDevelopmentRoute } from "../lib/routes.ts";

test("internal test pages and nested paths are identified for production denial", () => {
  for (const route of ["/test-compression", "/email-preview", "/team-browse"]) {
    assert.equal(isDevelopmentRoute(route), true);
    assert.equal(isDevelopmentRoute(`${route}/`), true);
    assert.equal(isDevelopmentRoute(`${route}/nested`), true);
    assert.equal(isDevelopmentRoute(`${route}-other`), false);
  }
});
test("marketplace, authentication and explicit demo pages remain available", () => {
  for (const route of [
    "/",
    "/browse",
    "/sell",
    "/login",
    "/verify-device",
    "/demo/item/1",
    "/item/uuid",
    "/account",
    "/messages",
    "/moving",
  ])
    assert.equal(isDevelopmentRoute(route), false);
});
