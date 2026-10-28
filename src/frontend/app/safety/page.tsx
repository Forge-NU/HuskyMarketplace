import Link from "next/link";
import PhotoShell from "@/components/PhotoShell";
import styles from "@/components/Photo.module.css";
const safety=[
 ["Meet in public.","Arrange handoffs in well-lit, populated places. Tell someone you trust your plans. Avoid sharing your dorm room or home address in public listings."],
 ["Inspect before paying.","Ask about defects, missing parts, and condition. Confirm the item matches its listing before payment. Husky does not provide escrow."],
 ["Protect account information.","Never send passwords, one-time verification codes, bank credentials, or card numbers in messages or moving inquiries."],
 ["Agree on the moving job.","Confirm the items, stairs, timing, equipment, and whether the fee is hourly or fixed. Avoid unsafe lifting or transportation."],
 ["Trust your judgment.","If a situation feels unsafe, cancel and leave. For immediate danger, contact local emergency services."],
 ["Report problems.","The demo does not have working moderation or reporting. Real processes must be implemented and reviewed before launch."]
];
export default function SafetyPage(){return <PhotoShell><main className={styles.content}><header className={styles.contentHead}><p className={styles.eyebrow}>STUDENT MARKETPLACE SAFETY</p><h1>Make every meetup a safer one.</h1><p>Practical guidance for buying, selling, and coordinating moving help.</p></header><div className={styles.movingGrid}>{safety.map(([title,description],i)=><article className={styles.panel} key={title}><p className={styles.eyebrow}>0{i+1}</p><h2>{title}</h2><p>{description}</p></article>)}</div><p className={styles.notice}>Husky Marketplace is an independent student project, not affiliated with or endorsed by Northeastern University. Production safety reporting and dispute handling are not implemented.</p><Link href="/terms">Read draft terms →</Link></main></PhotoShell>}
