import { readFile } from "node:fs/promises";
import path from "node:path";
export default async function EmailPreviewPage() {
  const template = await readFile(
    path.join(process.cwd(), "../../supabase/templates/verification.html"),
    "utf8",
  );
  return (
    <main style={{ minHeight: "100vh", background: "#fff9ef" }}>
      <p style={{ margin: 0, padding: 16, textAlign: "center", fontSize: 13 }}>
        Verification email preview · Sample code, not a real sign-in email
      </p>
      <iframe
        title="Verification email preview"
        sandbox=""
        srcDoc={template.replace("{{ .Token }}", "48291630")}
        style={{ border: 0, width: "100%", height: "80vh", minHeight: 560 }}
      />
    </main>
  );
}
