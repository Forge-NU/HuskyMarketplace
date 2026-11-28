import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadProfile, saveProfile } from "../lib/profile/service.ts";

function localOrigin(value) {
  const url = new URL(value);
  assert(
    url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password,
    "Profile checks require local HTTP services",
  );
  return url.origin;
}
const api = localOrigin(process.env.SUPABASE_URL || "http://127.0.0.1:54321");
const mail = localOrigin(
  process.env.AUTH_TEST_MAILBOX_URL || "http://127.0.0.1:54324",
);
const key = process.env.SUPABASE_ANON_KEY;
assert(key, "Pass the local public key as SUPABASE_ANON_KEY");
const columns = "username, display_name, bio, campus_area";
let checks = 0;
function pass(name) {
  console.log("PASS " + name);
  checks++;
}
async function student() {
  const email = `profile_${randomUUID()}@northeastern.edu`;
  const client = createClient(api, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const password = `Local-${randomUUID()}`;
  const signed = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: "Old metadata",
        bio: "Old bio",
        campus_area: "East Village",
      },
    },
  });
  assert.ifError(signed.error);
  let token;
  for (let i = 0; i < 40 && !token; i++) {
    const messages = await (await fetch(mail + "/api/v1/messages")).json();
    const message = messages.messages.find((m) =>
      m.To.some((to) => to.Address === email),
    );
    if (message) {
      const body = await (
        await fetch(`${mail}/api/v1/message/${message.ID}`)
      ).json();
      token = (body.Text + " " + body.HTML).match(/\b\d{8}\b/)?.[0];
    }
    if (!token) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(token, "No signup code in the disposable mailbox");
  const confirmed = await client.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  assert.ifError(confirmed.error);
  const verified = await client.rpc("confirm_device_session", {
    p_token: randomBytes(32).toString("hex"),
    p_remember: false,
  });
  assert.ifError(verified.error);
  assert.equal(verified.data, true);
  return { client, id: confirmed.data.user.id, email, password };
}
const a = await student(),
  b = await student();
try {
  const initial = await loadProfile(a.client);
  assert.equal(initial.displayName, "");
  assert.equal(initial.bio, "");
  pass("New profiles do not revive stale metadata values");
  const username = `profile_${randomBytes(6).toString("hex")}`;
  await saveProfile(a.client, {
    ...initial,
    username,
    displayName: "  Local Student  ",
    bio: "  Campus books  ",
    area: "Fenway",
    campus: "Boston",
    schoolYear: "Second year",
  });
  const row = await b.client
    .from("profiles")
    .select(columns)
    .eq("user_id", a.id)
    .single();
  assert.ifError(row.error);
  assert.deepEqual(row.data, {
    username,
    display_name: "Local Student",
    bio: "Campus books",
    campus_area: "Fenway",
  });
  pass("A saved public profile is visible to another verified student");
  const reload = await loadProfile(a.client);
  assert.equal(reload.displayName, "Local Student");
  assert.equal(reload.campus, "Boston");
  assert.equal(reload.schoolYear, "Second year");
  const auth = await a.client.auth.getUser();
  assert.equal(auth.data.user.user_metadata.display_name, "Old metadata");
  pass("Reload uses columns while only school details update in metadata");
  const denied = await b.client
    .from("profiles")
    .update({ display_name: "Wrong owner" })
    .eq("user_id", a.id)
    .select("user_id");
  assert.ifError(denied.error);
  assert.deepEqual(denied.data, []);
  assert.equal((await loadProfile(a.client)).displayName, "Local Student");
  pass("Another student cannot edit the public profile");
  const before = await loadProfile(b.client);
  await assert.rejects(
    () =>
      saveProfile(b.client, {
        ...before,
        username: username.toUpperCase(),
        displayName: "Not saved",
      }),
    /taken/,
  );
  const after = await loadProfile(b.client);
  assert.equal(after.username, before.username);
  assert.equal(after.displayName, before.displayName);
  pass(
    "Case-insensitive username collisions leave every public field unchanged",
  );
  await saveProfile(a.client, { ...reload, bio: "", area: "" });
  const cleared = await b.client
    .from("profiles")
    .select("bio, campus_area")
    .eq("user_id", a.id)
    .single();
  assert.ifError(cleared.error);
  assert.deepEqual(cleared.data, { bio: null, campus_area: null });
  const empty = await loadProfile(a.client);
  assert.equal(empty.bio, "");
  assert.equal(empty.area, "");
  pass("Cleared optional fields stay empty despite older metadata");
  const unverified = createClient(api, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const passwordOnly = await unverified.auth.signInWithPassword({
    email: a.email,
    password: a.password,
  });
  assert.ifError(passwordOnly.error);
  const hidden = await unverified
    .from("profiles")
    .select(columns)
    .eq("user_id", a.id);
  assert.ifError(hidden.error);
  assert.deepEqual(hidden.data, []);
  const blocked = await unverified
    .from("profiles")
    .update({ display_name: "Unverified edit" })
    .eq("user_id", a.id)
    .select("user_id");
  assert.ifError(blocked.error);
  assert.deepEqual(blocked.data, []);
  assert.equal((await loadProfile(a.client)).displayName, "Local Student");
  pass("A password-only device cannot read or edit even its own profile");
  await unverified.auth.signOut();
  const anonymous = await unverified.from("profiles").select(columns);
  assert(anonymous.error);
  pass("Signed-out clients cannot read public student profiles");
} finally {
  await a.client.auth.signOut();
  await b.client.auth.signOut();
}
console.log(`${checks} local profile checks passed`);
