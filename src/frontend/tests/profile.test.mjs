import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProfile,
  profileComplete,
  validateBio,
} from "../lib/profile/model.ts";
import { loadProfile, saveProfile } from "../lib/profile/service.ts";
import { safeNext } from "../lib/auth.ts";
const profile = {
  userId: "owner",
  email: "student@northeastern.edu",
  emailVerified: false,
  username: "student",
  displayName: "Student",
  area: "Fenway",
  bio: "Student who loves secondhand finds.",
};
// Isolated fixtures: these tests never write to the shared database.
function fixture() {
  const calls = [];
  const state = {
    user: {
      id: "owner",
      email: profile.email,
      user_metadata: {
        display_name: "Old metadata name",
        bio: "Old metadata bio",
        campus_area: "East Village",
      },
    },
    saveError: null,
    metadataError: null,
    row: {
      username: "student",
      display_name: "Student",
      bio: profile.bio,
      campus_area: "Fenway",
    },
  };
  const query = {
    select(value) {
      calls.push(["select", value]);
      return this;
    },
    update(value) {
      calls.push(["update", value]);
      return this;
    },
    eq(key, value) {
      calls.push(["eq", key, value]);
      return this;
    },
    maybeSingle: async () => ({ data: state.row, error: state.saveError }),
    single: async () => ({ data: state.row, error: state.saveError }),
  };
  const client = {
    from(name) {
      calls.push(["from", name]);
      return query;
    },
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
      updateUser: async (value) => {
        calls.push(["metadata", value]);
        return { error: state.metadataError };
      },
    },
  };
  return { client, calls, state };
}
test("username and display name are distinct and validated", () => {
  assert.deepEqual(validateProfile("  A_STUDENT ", "  Student Name  "), {
    username: "a_student",
    displayName: "Student Name",
  });
  for (const handle of [
    "a",
    "bad name",
    "bad-handle",
    "a".repeat(25),
    "husky_012345678901234567",
  ])
    assert.throws(() => validateProfile(handle, "Student"));
  assert.throws(() => validateProfile("student", " "));
});
test("automatic handles and missing display names require setup", () => {
  assert.equal(
    profileComplete({
      username: "husky_012345678901234567",
      displayName: "Student",
    }),
    false,
  );
  assert.equal(
    profileComplete({ username: "student", displayName: "" }),
    false,
  );
  assert.equal(profileComplete(profile), true);
});
test("redirects reject external, protocol relative and backslash destinations", () => {
  for (const value of [
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/\n/evil.invalid",
    null,
  ])
    assert.equal(safeNext(value), "/");
  assert.equal(safeNext("/browse?cat=books"), "/browse?cat=books");
});
test("load uses profile columns even when old metadata disagrees", async () => {
  const f = fixture();
  const result = await loadProfile(f.client);
  assert.equal(result.username, "student");
  assert.equal(result.displayName, "Student");
  assert.equal(result.bio, profile.bio);
  assert.equal(result.area, "Fenway");
  assert.deepEqual(
    f.calls.find((c) => c[0] === "select"),
    ["select", "username, display_name, bio, campus_area"],
  );
  assert.ok(
    f.calls.some(
      (c) => c[0] === "eq" && c[1] === "user_id" && c[2] === "owner",
    ),
  );
});
test("profile verification comes from Auth, never editable metadata", async () => {
  const f = fixture();
  f.state.user.user_metadata.email_verified = true;
  assert.equal((await loadProfile(f.client)).emailVerified, false);
  f.state.user.email_confirmed_at = "2026-11-17T12:00:00Z";
  assert.equal((await loadProfile(f.client)).emailVerified, true);
});
test("saving cannot persist a supplied verification flag", async () => {
  const f = fixture();
  const saved = await saveProfile(f.client, {
    ...profile,
    campus: "Boston",
    emailVerified: true,
  });
  assert.equal(saved.emailVerified, false);
  assert.equal(
    "emailVerified" in f.calls.find((c) => c[0] === "update")[1],
    false,
  );
  assert.equal(
    "emailVerified" in f.calls.find((c) => c[0] === "metadata")[1].data,
    false,
  );
});
test("saving updates public fields together without metadata writes", async () => {
  const f = fixture();
  await saveProfile(f.client, profile);
  assert.deepEqual(f.calls.find((c) => c[0] === "update")[1], {
    username: "student",
    display_name: "Student",
    campus_area: "Fenway",
    bio: profile.bio,
  });
  assert.equal(
    f.calls.some((c) => c[0] === "metadata"),
    false,
  );
});
test("database unique constraint handles username collisions", async () => {
  const f = fixture();
  f.state.saveError = { code: "23505" };
  await assert.rejects(() => saveProfile(f.client, profile), /taken/);
  assert.equal(
    f.calls.some((c) => c[0] === "metadata"),
    false,
  );
});
test("changed sessions cannot save someone else's profile", async () => {
  const f = fixture();
  f.state.user.id = "another-user";
  await assert.rejects(() => saveProfile(f.client, profile), /session changed/);
  assert.equal(
    f.calls.some((c) => c[0] === "update"),
    false,
  );
});
test("partial failure reports exactly what was saved", async () => {
  const f = fixture();
  f.state.metadataError = { message: "offline" };
  await assert.rejects(
    () => saveProfile(f.client, { ...profile, campus: "Boston" }),
    /Profile saved, but your campus or school year/,
  );
});
test("missing profile is an error rather than demo data", async () => {
  const f = fixture();
  f.state.row = null;
  await assert.rejects(() => loadProfile(f.client), /could not load/);
});

test("bio is optional, trimmed and limited before any writes", async () => {
  assert.equal(validateBio("  Hi campus  "), "Hi campus");
  assert.equal(validateBio(""), "");
  const f = fixture();
  await assert.rejects(
    () => saveProfile(f.client, { ...profile, bio: "x".repeat(201) }),
    /200 characters/,
  );
  assert.equal(
    f.calls.some((c) => c[0] === "update"),
    false,
  );
});

test("null public columns do not fall back to stale metadata", async () => {
  const f = fixture();
  f.state.row = {
    username: "student",
    display_name: null,
    bio: null,
    campus_area: null,
  };
  const loaded = await loadProfile(f.client);
  assert.equal(loaded.displayName, "");
  assert.equal(loaded.bio, "");
  assert.equal(loaded.area, "");
  assert.equal(profileComplete(loaded), false);
});

test("clearing optional fields stores nulls in the public columns", async () => {
  const f = fixture();
  await saveProfile(f.client, { ...profile, bio: "  ", area: "" });
  const update = f.calls.find((c) => c[0] === "update")[1];
  assert.equal(update.bio, null);
  assert.equal(update.campus_area, null);
});

test("only campus and school year remain in metadata", async () => {
  const f = fixture();
  await saveProfile(f.client, {
    ...profile,
    campus: "Boston",
    schoolYear: "Second year",
  });
  assert.deepEqual(f.calls.find((c) => c[0] === "metadata")[1], {
    data: { campus: "Boston", school_year: "Second year" },
  });
});

test("unchanged school details do not trigger another Auth write", async () => {
  const f = fixture();
  Object.assign(f.state.user.user_metadata, {
    campus: "Boston",
    school_year: "Second year",
  });
  await saveProfile(f.client, {
    ...profile,
    campus: "Boston",
    schoolYear: "Second year",
  });
  assert.equal(
    f.calls.some((c) => c[0] === "metadata"),
    false,
  );
});

test("a rejected profile update cannot continue to school metadata", async () => {
  const f = fixture();
  f.state.saveError = { code: "42501" };
  await assert.rejects(
    () => saveProfile(f.client, { ...profile, campus: "Boston" }),
    /profile could not be saved/,
  );
  assert.equal(
    f.calls.some((c) => c[0] === "metadata"),
    false,
  );
});

test("an update returning no row is not reported as saved", async () => {
  const f = fixture();
  f.state.row = null;
  await assert.rejects(
    () => saveProfile(f.client, profile),
    /profile could not be saved/,
  );
});
