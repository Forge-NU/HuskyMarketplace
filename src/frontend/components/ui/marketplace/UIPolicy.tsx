import Link from "next/link";
import UIShell from "./UIShell";
import {POLICY_HTML} from "@/lib/ui/policy-content";
import styles from "./UI.module.css";
export default function UIPolicy({which}:{which:"terms"|"privacy"}){
 return <UIShell><main className={styles.content}><div className={styles.policy}><p className={styles.eyebrow}>HUSKY MARKETPLACE / POLICIES</p><p className={styles.policyWarning}>Draft for review — not final launch policies, not legal advice. Original prototype policy text will be imported when available.</p><div dangerouslySetInnerHTML={{__html:POLICY_HTML[which]}}/><nav className={styles.formActions}><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/safety">Safety</Link></nav></div></main></UIShell>
}
