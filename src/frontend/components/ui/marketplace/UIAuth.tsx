"use client";
/* eslint-disable @next/next/no-img-element */
import {useEffect,useState,type FormEvent} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import UIShell from "./UIShell";
import {createClient} from "@/lib/supabase/client";
import {isNortheasternEmail,safeNext} from "@/lib/auth";
import styles from "./UI.module.css";
const NEXT_KEY="husky_auth_next",EMAIL_KEY="husky_auth_pending_email";
// The project's current email template sends eight digits; align with Arin before merging.
const CODE_LENGTH=8;
export default function UIAuth({mode}:{mode:"login"|"signup"|"verify"}){
 const router=useRouter(),search=useSearchParams();
 const [agreed,setAgreed]=useState(false),[updates,setUpdates]=useState(false);
 const [email,setEmail]=useState(""),[code,setCode]=useState(""),[displayName,setDisplayName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{if(mode==="verify")setEmail(sessionStorage.getItem(EMAIL_KEY)||"")},[mode]);
 const next=safeNext(search.get("next"));
 async function request(e:FormEvent){e.preventDefault();setError("");const addr=email.trim().toLowerCase();if(!isNortheasternEmail(addr)){setError("Use your @northeastern.edu email address.");return}if(mode==="signup"&&(!agreed||displayName.trim().length<2)){setError("Enter a display name and accept the Terms to continue.");return}
 setBusy(true);try{const {error}=await createClient().auth.signInWithOtp({email:addr,options:{shouldCreateUser:true}});if(error){setError(error.message);return}
 sessionStorage.setItem(EMAIL_KEY,addr);sessionStorage.setItem(NEXT_KEY,next);
 if(mode==="signup"&&displayName.trim()){localStorage.setItem("husky_demo_pending_name",displayName.trim());localStorage.setItem("husky_demo_pending_updates",String(updates))}
 router.push("/verify")}catch(ex){setError(ex instanceof Error?ex.message:"Unable to connect to the verification service.")}finally{setBusy(false)} }
 async function verify(e:FormEvent){e.preventDefault();setError("");if(!isNortheasternEmail(email)){setError("Start at the login page and request a new code.");return}if(code.length!==CODE_LENGTH){setError(`Enter the full ${CODE_LENGTH}-digit email code.`);return}
 setBusy(true);try{const {error}=await createClient().auth.verifyOtp({email,token:code,type:"email"});if(error){setError(error.message);return}
 sessionStorage.removeItem(EMAIL_KEY);const dest=safeNext(sessionStorage.getItem(NEXT_KEY));sessionStorage.removeItem(NEXT_KEY);router.replace(dest);router.refresh()
 }catch(ex){setError(ex instanceof Error?ex.message:"Verification failed.")}finally{setBusy(false)} }
 const verifyMode=mode==="verify";
 return <UIShell><main className={styles.content}><div className={styles.authLayout}><div className={styles.authCard}>
  <p className={styles.eyebrow}>YOUR HUSKY ACCOUNT</p><h1>{verifyMode?"One quick step, and you're in.":mode==="signup"?"Create your Husky account.":"Welcome back."}</h1>
  <p className={styles.hint}>{verifyMode?`Enter the eight-digit code sent to ${email||"your school email"}.`:"Sign in securely with your Northeastern email. We'll email you a verification code."}</p>
  <form onSubmit={verifyMode?verify:request}>
   {mode==="signup"&&<div className={styles.formField}><label className={styles.inputLabel} htmlFor="name">Display name *</label><input className={styles.input} id="name" minLength={2} required maxLength={60} autoComplete="name" value={displayName} onChange={e=>setDisplayName(e.target.value)}/></div>}
   {!verifyMode?<div className={styles.formField}><label className={styles.inputLabel} htmlFor="email">Northeastern email</label><input className={styles.input} id="email" type="email" required placeholder="you@northeastern.edu" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>:
   <div className={styles.formField}><label className={styles.inputLabel} htmlFor="code">Eight-digit verification code</label><input className={styles.input} id="code" type="text" inputMode="numeric" pattern="[0-9]{8}" maxLength={CODE_LENGTH} autoComplete="one-time-code" placeholder="Enter your code" required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,CODE_LENGTH))}/></div>}
   {mode==="signup"&&<div className={styles.formField}><label style={{display:"flex",gap:9,fontSize:13,alignItems:"start"}}><input type="checkbox" checked={agreed} required onChange={e=>setAgreed(e.target.checked)}/><span>I agree to the <Link href="/terms" target="_blank">Terms</Link> and acknowledge the <Link href="/privacy" target="_blank">Privacy Policy</Link>. *</span></label><label style={{display:"flex",gap:9,fontSize:13,alignItems:"start",marginTop:12}}><input type="checkbox" checked={updates} onChange={e=>setUpdates(e.target.checked)}/><span>I'd like optional marketplace updates (no marketing emails are sent by this preview).</span></label></div>}
   {error&&<p className={styles.error} role="alert">{error}</p>}
   <button type="submit" className={styles.primaryButton} disabled={busy} style={{width:"100%"}}>{busy?"Working…":verifyMode?"Verify and sign in →":"Send verification code →"}</button>
  </form>
  <div className={styles.formActions}>{mode==="login"?<span>New here? <Link href="/signup">Create an account</Link></span>:mode==="signup"?<span>Already have an account? <Link href="/login">Log in</Link></span>:<Link href="/login">Use a different email</Link>}<Link href="/terms">Terms &amp; privacy</Link></div>
  <p className={styles.notice}>This page uses real Supabase OTP authentication. Other marketplace actions remain browser-local demonstrations until their backend integration is reviewed.</p>
 </div><aside className={styles.authArt}><img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80" alt="College work desk"/><div className={styles.authArtCopy}><p className={styles.eyebrow}>CAMPUS FINDS</p><h2>Buy, sell, and make room for what comes next.</h2></div></aside></div></main></UIShell>
}
