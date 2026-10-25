'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, CircleHelp, ClipboardList, Cloud, GraduationCap, LayoutDashboard, LogIn, LogOut, Plus, Settings, ShieldCheck, StickyNote, Target, Trash2, X } from 'lucide-react';

type School = { id: string; name: string; institution_symbol: string | null; address: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null; created_at?: string };
type Note = { id: string; text: string; note_type: string; due_date: string | null; done: boolean; created_at: string };
type Activity = { id: string; title: string; activity_type: string; school_id: string | null; activity_date: string; notes: string | null; done: boolean; school?: { name: string } | null };
type Tab = 'today' | 'calendar' | 'schools' | 'goals' | 'settings';

const openingItems = [
  'טופס פתיחה מקוון בשבלול', 'שליחת מייל עם מכתב למנהל', 'מידעון להורים', 'מידעון למורים',
  'קישור להצהרות בריאות מקוונות', 'הצהרת בריאות ידנית', 'יצירת קשר איתי להורים ולמורים',
  'סירוב פפילומה חרדי', 'אנשי קשר ומיילים ולעדכן אצל ליטל', 'מעבר על שיבוצי כיתות ומנב״ס',
  'עישון', 'אפיפן', 'בעיות בריאות ותלמידים מיוחדים', 'תיאום מועדים לפי גאנט',
  'תיעוד ברחל״י פעילות בית ספרית', 'תיעוד פעילות יומית שבלול'
];
const activityTypes = ['חיסונים', 'בדיקות סינון', 'חינוך לבריאות', 'פתיחת בית ספר', 'יום השלמות'];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [tab, setTab] = useState<Tab>('today');
  const [schools, setSchools] = useState<School[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('תזכורת');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0,10));
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolSymbol, setSchoolSymbol] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState('חיסונים');
  const [activitySchool, setActivitySchool] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0,10));
  const [activityNotes, setActivityNotes] = useState('');
  const [openingSchool, setOpeningSchool] = useState<School | null>(null);
  const [openingChecks, setOpeningChecks] = useState<Record<string, boolean>>({});
  const [customOpeningItems, setCustomOpeningItems] = useState<string[]>(openingItems);
  const [newOpeningItem, setNewOpeningItem] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session && supabase) void loadData(); }, [session]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true); setError('');
    const [s, n, a] = await Promise.all([
      supabase.from('schools').select('*').order('name'),
      supabase.from('notes').select('*').order('created_at', { ascending: false }),
      supabase.from('activities').select('*, school:schools(name)').order('activity_date')
    ]);
    if (s.error || n.error || a.error) setError([s.error?.message, n.error?.message, a.error?.message].filter(Boolean).join(' · '));
    setSchools((s.data || []) as School[]); setNotes((n.data || []) as Note[]); setActivities((a.data || []) as Activity[]); setLoading(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault(); if (!supabase) return setError('חסרות הגדרות Supabase. העתיקי את .env.example ל-.env.local והכניסי את פרטי הפרויקט.');
    setError(''); setLoading(true);
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (result.error) setError(result.error.message);
    else if (authMode === 'signup' && !result.data.session) setSuccess('נשלח מייל לאימות החשבון. בדקי את תיבת הדואר שלך.');
  }

  async function addNote(e: FormEvent) {
    e.preventDefault(); if (!supabase || !noteText.trim()) return;
    const { error } = await supabase.from('notes').insert({ text: noteText.trim(), note_type: noteType, due_date: noteDate || null, done: false });
    if (error) setError(error.message); else { setNoteText(''); setSuccess('הפתק נשמר'); await loadData(); }
  }
  async function toggleNote(note: Note) {
    if (!supabase) return; const { error } = await supabase.from('notes').update({ done: !note.done }).eq('id', note.id);
    if (error) setError(error.message); else setNotes(old => old.map(n => n.id === note.id ? { ...n, done: !n.done } : n));
  }
  async function deleteNote(id: string) {
    if (!supabase) return; const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) setError(error.message); else setNotes(old => old.filter(n => n.id !== id));
  }
  async function addSchool(e: FormEvent) {
    e.preventDefault(); if (!supabase || !schoolName.trim()) return;
    const { error } = await supabase.from('schools').insert({ name: schoolName.trim(), institution_symbol: schoolSymbol || null, address: schoolAddress || null, contact_name: contactName || null, contact_email: contactEmail || null, contact_phone: contactPhone || null });
    if (error) setError(error.message); else { setShowSchoolForm(false); setSchoolName(''); setSchoolSymbol(''); setSchoolAddress(''); setContactName(''); setContactEmail(''); setContactPhone(''); setSuccess('בית הספר נוסף'); await loadData(); }
  }
  async function addActivity(e: FormEvent) {
    e.preventDefault(); if (!supabase || !activityTitle.trim()) return;
    const { error } = await supabase.from('activities').insert({ title: activityTitle.trim(), activity_type: activityType, school_id: activitySchool || null, activity_date: activityDate, notes: activityNotes || null, done: false });
    if (error) setError(error.message); else { setShowActivityForm(false); setActivityTitle(''); setActivityNotes(''); setSuccess('הפעילות נשמרה ביומן'); await loadData(); }
  }
  async function toggleActivity(a: Activity) {
    if (!supabase) return; const { error } = await supabase.from('activities').update({ done: !a.done }).eq('id', a.id);
    if (error) setError(error.message); else setActivities(old => old.map(x => x.id === a.id ? { ...x, done: !x.done } : x));
  }
  async function saveOpening() {
    if (!supabase || !openingSchool) return;
    const { error } = await supabase.from('school_openings').upsert({ school_id: openingSchool.id, school_year: String(new Date().getFullYear()), checklist: customOpeningItems.map(label => ({ label, checked: !!openingChecks[label] })) }, { onConflict: 'school_id,school_year' });
    if (error) setError(error.message); else { setSuccess('רשימת הפתיחה נשמרה'); setOpeningSchool(null); }
  }
  async function openChecklist(school: School) {
    setOpeningSchool(school); setOpeningChecks({});
    if (supabase) {
      const { data } = await supabase.from('school_openings').select('checklist').eq('school_id', school.id).eq('school_year', String(new Date().getFullYear())).maybeSingle();
      if (data?.checklist && Array.isArray(data.checklist)) {
        const rows = data.checklist as {label:string;checked:boolean}[];
        setCustomOpeningItems(rows.map(x=>x.label)); setOpeningChecks(Object.fromEntries(rows.map(x=>[x.label,x.checked])));
      } else { setCustomOpeningItems(openingItems); }
    }
  }

  const today = new Date().toISOString().slice(0,10);
  const todayActivities = useMemo(() => activities.filter(a => a.activity_date === today), [activities, today]);
  const dueNotes = useMemo(() => notes.filter(n => !n.done && (!n.due_date || n.due_date <= today)), [notes, today]);
  const doneActivities = activities.filter(a=>a.done).length;
  const openedCount = schools.filter(s => false).length;

  if (!session) return <main className="auth-wrap"><div className="auth-card"><div className="brand-mark"><GraduationCap size={27}/></div><p className="eyebrow">תכנון · תזכורות · יעדים</p><h1>המתכננת שלי</h1><p className="muted">מערכת אישית לניהול עבודת בריאות התלמיד</p><form onSubmit={signIn} className="stack"><label>כתובת מייל<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com"/></label><label>סיסמה<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={authMode==='login'?'current-password':'new-password'}/></label><button className="primary" disabled={loading}>{loading?'רגע...':authMode==='login'?'כניסה למערכת':'יצירת חשבון'}</button></form><button className="text-button" onClick={()=>setAuthMode(authMode==='login'?'signup':'login')}>{authMode==='login'?'אין לך חשבון? יצירת חשבון':'כבר יש לך חשבון? כניסה'}</button>{!supabase && <p className="error">יש להגדיר את פרטי Supabase בקובץ הסביבה לפני הכניסה.</p>}{error && <p className="error">{error}</p>}{success && <p className="success">{success}</p>}<p className="tiny">אין להזין כאן פרטי תלמידים או מידע רפואי מזהה.</p></div></main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="logo-row"><div className="brand-mark small"><GraduationCap size={22}/></div><div><strong>המתכננת שלי</strong><span>בריאות התלמיד</span></div></div><nav>
      <button className={tab==='today'?'nav-item active':'nav-item'} onClick={()=>setTab('today')}><LayoutDashboard size={18}/> היום שלי</button>
      <button className={tab==='calendar'?'nav-item active':'nav-item'} onClick={()=>setTab('calendar')}><CalendarDays size={18}/> לוח שנה</button>
      <button className={tab==='schools'?'nav-item active':'nav-item'} onClick={()=>setTab('schools')}><GraduationCap size={18}/> בתי ספר</button>
      <button className={tab==='goals'?'nav-item active':'nav-item'} onClick={()=>setTab('goals')}><Target size={18}/> יעדים</button>
      <button className={tab==='settings'?'nav-item active':'nav-item'} onClick={()=>setTab('settings')}><Settings size={18}/> הגדרות</button>
    </nav><div className="sidebar-bottom"><div className="cloud-note"><Cloud size={17}/><span>שמירה בענן<br/><small>Supabase</small></span></div><button className="nav-item" onClick={()=>supabase?.auth.signOut()}><LogOut size={18}/> יציאה</button></div></aside>
    <section className="main-area"><header className="topbar"><div><p className="eyebrow">ניהול יום העבודה</p><h1>{({today:'היום שלי',calendar:'לוח שנה',schools:'בתי ספר',goals:'יעדים',settings:'הגדרות'} as Record<Tab,string>)[tab]}</h1></div><div className="top-actions"><span className="date-chip">{new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'})}</span><button className="primary" onClick={()=>tab==='schools'?setShowSchoolForm(true):setShowActivityForm(true)}><Plus size={17}/> {tab==='schools'?'בית ספר חדש':'פעילות חדשה'}</button></div></header>
    {error && <div className="alert error-box">{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}{success && <div className="alert success-box">{success}<button onClick={()=>setSuccess('')}><X size={16}/></button></div>}
    {loading && <p className="muted">טוען נתונים...</p>}
    {tab==='today' && <div className="content-grid"><div className="primary-column"><section className="panel hero-panel"><div><span className="pill">תמונת מצב יומית</span><h2>בואי נעשה סדר ביום שלך</h2><p className="muted">כל הפעילויות, המשימות והפתקים במקום אחד.</p></div><div className="hero-stats"><div><strong>{todayActivities.length}</strong><span>פעילויות היום</span></div><div><strong>{dueNotes.length}</strong><span>פתקים לטיפול</span></div><div><strong>{schools.length}</strong><span>בתי ספר</span></div></div></section>
      <section className="panel"><div className="section-heading"><div><h2><CalendarDays size={20}/> מה קורה היום</h2><p className="muted">פעילויות מתוכננות להיום</p></div><button className="secondary" onClick={()=>setTab('calendar')}>לכל היומן <ChevronLeft size={16}/></button></div>{todayActivities.length===0?<div className="empty"><CalendarDays size={28}/><strong>אין פעילויות מתוכננות להיום</strong><span>אפשר להוסיף פעילות חדשה או לבדוק את היומן.</span></div>:<div className="item-list">{todayActivities.map(a=><div className="activity-row" key={a.id}><div className="type-dot"/><div className="item-main"><strong>{a.title}</strong><span>{a.activity_type} · {a.school?.name || 'ללא בית ספר'}</span>{a.notes && <p>{a.notes}</p>}</div><button className={a.done?'done-button':'check-button'} onClick={()=>toggleActivity(a)} title="סימון ביצוע">{a.done?<Check size={17}/>:<CheckCircle2 size={17}/>}</button></div>)}</div>}</section>
      <section className="panel"><div className="section-heading"><div><h2><StickyNote size={20}/> פתקים, תזכורות ומטלות</h2><p className="muted">הוסיפי תוך כדי היום — בלי לפתוח פעילות חדשה</p></div></div><form className="note-form" onSubmit={addNote}><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="מה חשוב לזכור, לברר או לבצע?" rows={2}/><div className="form-row"><select value={noteType} onChange={e=>setNoteType(e.target.value)}><option>תזכורת</option><option>מטלה</option><option>הערה</option></select><input type="date" value={noteDate} onChange={e=>setNoteDate(e.target.value)}/><button className="primary" disabled={!noteText.trim()}><Plus size={16}/> הוספה</button></div></form><div className="item-list">{notes.slice(0,8).map(n=><div className="note-row" key={n.id}><button className={n.done?'done-button':'check-button'} onClick={()=>toggleNote(n)}>{n.done?<Check size={16}/>:<CheckCircle2 size={16}/>}</button><div className="item-main"><strong className={n.done?'struck':''}>{n.text}</strong><span>{n.note_type}{n.due_date?` · ${n.due_date}`:''}</span></div><button className="icon-button" onClick={()=>deleteNote(n.id)} aria-label="מחיקה"><Trash2 size={16}/></button></div>)}</div>{notes.length===0&&<p className="empty-small">הפתקים שתוסיפי יופיעו כאן.</p>}</section></div>
      <div className="secondary-column"><section className="panel"><div className="section-heading"><h2><ClipboardList size={19}/> דורש טיפול</h2></div>{dueNotes.length===0?<p className="muted">אין כרגע פתקים שממתינים לטיפול.</p>:dueNotes.slice(0,5).map(n=><div className="mini-task" key={n.id}><span className="mini-dot"/><div><strong>{n.text}</strong><small>{n.note_type}</small></div></div>)}</section><section className="panel"><div className="section-heading"><h2><GraduationCap size={19}/> בתי הספר שלי</h2><button className="icon-button" onClick={()=>setTab('schools')}><ChevronLeft size={17}/></button></div>{schools.slice(0,5).map(s=><div className="school-mini" key={s.id}><div className="school-icon"><GraduationCap size={17}/></div><div><strong>{s.name}</strong><small>{s.institution_symbol||'סמל מוסד לא הוזן'}</small></div></div>)}{schools.length===0&&<p className="muted">הוסיפי את בית הספר הראשון שלך.</p>}</section><section className="tip-card"><ShieldCheck size={22}/><strong>תכנון בלי מידע רפואי מזהה</strong><p>השתמשי במערכת לתכנון ותזכורות כלליות בלבד.</p></section></div></div>}
    {tab==='calendar' && <section className="panel"><div className="section-heading"><div><h2>פעילויות מתוכננות</h2><p className="muted">רשימת הפעילויות לפי תאריך</p></div><button className="primary" onClick={()=>setShowActivityForm(true)}><Plus size={16}/> פעילות חדשה</button></div>{activities.length===0?<div className="empty"><CalendarDays size={28}/><strong>עדיין אין פעילויות</strong><span>הוסיפי פעילות כדי להתחיל לבנות את היומן.</span></div>:<div className="table-wrap"><table><thead><tr><th>תאריך</th><th>פעילות</th><th>בית ספר</th><th>סוג</th><th>סטטוס</th></tr></thead><tbody>{activities.map(a=><tr key={a.id}><td>{a.activity_date}</td><td>{a.title}</td><td>{a.school?.name||'—'}</td><td>{a.activity_type}</td><td><button className={a.done?'status-done':'status-planned'} onClick={()=>toggleActivity(a)}>{a.done?'בוצע':'מתוכנן'}</button></td></tr>)}</tbody></table></div>}</section>}
    {tab==='schools' && <section className="panel"><div className="section-heading"><div><h2>רשימת בתי הספר</h2><p className="muted">הוסיפי בית ספר פעם אחת והשתמשי בו בכל הפעילויות.</p></div><button className="primary" onClick={()=>setShowSchoolForm(true)}><Plus size={16}/> בית ספר חדש</button></div>{schools.length===0?<div className="empty"><GraduationCap size={28}/><strong>עוד לא הוספת בתי ספר</strong><span>אפשר להתחיל מבית ספר אחד לדוגמה.</span></div>:<div className="school-grid">{schools.map(s=><article className="school-card" key={s.id}><div className="school-card-icon"><GraduationCap size={21}/></div><h3>{s.name}</h3><p>{s.institution_symbol?`סמל מוסד: ${s.institution_symbol}`:'סמל מוסד לא הוזן'}</p>{s.address&&<p>{s.address}</p>}{s.contact_name&&<p>איש קשר: {s.contact_name}</p>}<div className="school-card-actions"><button className="secondary" onClick={()=>void openChecklist(s)}><ClipboardList size={15}/> פתיחת בית ספר</button></div></article>)}</div>}</section>}
    {tab==='goals' && <div className="content-grid goals-grid"><section className="panel"><div className="section-heading"><div><h2><Target size={20}/> פתיחת כל בתי הספר</h2><p className="muted">מעקב אחר פתיחת בתי הספר לשנת הלימודים</p></div></div><div className="goal-number">{openedCount} <span>מתוך {schools.length} בתי ספר</span></div><div className="progress-track"><div style={{width:`${schools.length?openedCount/schools.length*100:0}%`}}/></div><p className="muted">היעד יתעדכן לאחר שנחבר את מצב רשימות הפתיחה לכל בית ספר.</p></section><section className="panel"><h2>פעילויות שהושלמו</h2><div className="goal-number">{doneActivities} <span>פעילויות</span></div><p className="muted">נתון ראשוני המבוסס על פעילויות שסומנו כבוצעו.</p></section></div>}
    {tab==='settings' && <div className="content-grid"><section className="panel"><h2><Settings size={20}/> הגדרות מערכת</h2><p className="muted">כאן נוסיף בהמשך תבניות, מועדי הכנה, צבעי פעילות ורשימות ציוד.</p><div className="setting-line"><span>סוגי פעילות</span><strong>{activityTypes.length}</strong></div><div className="setting-line"><span>פריטי צ׳קליסט פתיחה ברירת מחדל</span><strong>{customOpeningItems.length}</strong></div></section><section className="panel"><h2><Cloud size={20}/> שמירה וגיבוי</h2><p>נתוני האתר נשמרים ב-Supabase. גיבוי ל-Google Drive עדיין לא הוגדר בפרויקט הראשוני.</p><p className="muted">לפני שימוש קבוע, יש להגדיר גיבוי נפרד ולבדוק שחזור.</p></section></div>}
    </section>
    {showSchoolForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSchoolForm(false)}}><form className="modal" onSubmit={addSchool}><div className="modal-head"><div><h2>הוספת בית ספר</h2><p className="muted">פרטים שתוכלי להשתמש בהם שוב בפעילויות.</p></div><button type="button" className="icon-button" onClick={()=>setShowSchoolForm(false)}><X/></button></div><label>שם בית הספר *<input value={schoolName} onChange={e=>setSchoolName(e.target.value)} required/></label><div className="form-row"><label>סמל מוסד<input value={schoolSymbol} onChange={e=>setSchoolSymbol(e.target.value)}/></label><label>טלפון איש קשר<input value={contactPhone} onChange={e=>setContactPhone(e.target.value)}/></label></div><label>כתובת<input value={schoolAddress} onChange={e=>setSchoolAddress(e.target.value)}/></label><label>שם איש קשר<input value={contactName} onChange={e=>setContactName(e.target.value)}/></label><label>מייל איש קשר<input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)}/></label><button className="primary" type="submit">שמירת בית ספר</button></form></div>}
    {showActivityForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowActivityForm(false)}}><form className="modal" onSubmit={addActivity}><div className="modal-head"><div><h2>פעילות חדשה</h2><p className="muted">נחבר בהמשך לכל סוג פעילות את משימות ההכנה שלו.</p></div><button type="button" className="icon-button" onClick={()=>setShowActivityForm(false)}><X/></button></div><label>שם הפעילות *<input value={activityTitle} onChange={e=>setActivityTitle(e.target.value)} required placeholder="לדוגמה: חיסוני כיתה א׳"/></label><label>סוג פעילות<select value={activityType} onChange={e=>setActivityType(e.target.value)}>{activityTypes.map(t=><option key={t}>{t}</option>)}</select></label><label>בית ספר<select value={activitySchool} onChange={e=>setActivitySchool(e.target.value)}><option value="">ללא שיוך</option>{schools.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>תאריך<input type="date" value={activityDate} onChange={e=>setActivityDate(e.target.value)} required/></label><label>הערות<textarea value={activityNotes} onChange={e=>setActivityNotes(e.target.value)} rows={3} placeholder="הערות כלליות ללא פרטים רפואיים מזהים"/></label>{activityType==='פתיחת בית ספר'&&<p className="inline-info">לאחר שמירת הפעילות, פתחי את רשימת הפתיחה בכרטיס בית הספר כדי לסמן את המטלות.</p>}<button className="primary" type="submit">שמירת פעילות</button></form></div>}
    {openingSchool && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpeningSchool(null)}}><div className="modal wide-modal"><div className="modal-head"><div><p className="eyebrow">צ׳קליסט פתיחה</p><h2>{openingSchool.name}</h2><p className="muted">סמני את הסעיפים שהושלמו. אפשר להוסיף סעיפים נוספים.</p></div><button className="icon-button" onClick={()=>setOpeningSchool(null)}><X/></button></div><div className="checklist-progress"><strong>{customOpeningItems.filter(t=>openingChecks[t]).length} מתוך {customOpeningItems.length}</strong><div className="progress-track"><div style={{width:`${customOpeningItems.length?customOpeningItems.filter(t=>openingChecks[t]).length/customOpeningItems.length*100:0}%`}}/></div></div><div className="checklist">{customOpeningItems.map(item=><label className="checklist-item" key={item}><input type="checkbox" checked={!!openingChecks[item]} onChange={e=>setOpeningChecks(old=>({...old,[item]:e.target.checked}))}/><span>{item}</span><button type="button" className="icon-button subtle-icon" onClick={e=>{e.preventDefault();setCustomOpeningItems(old=>old.filter(x=>x!==item));setOpeningChecks(old=>{const next={...old};delete next[item];return next;})}} aria-label="הסרת מטלה"><Trash2 size={14}/></button></label>)}</div><form className="add-check-item" onSubmit={e=>{e.preventDefault();if(newOpeningItem.trim()){setCustomOpeningItems(old=>[...old,newOpeningItem.trim()]);setNewOpeningItem('')}}}><input value={newOpeningItem} onChange={e=>setNewOpeningItem(e.target.value)} placeholder="הוספת מטלה לרשימת הפתיחה"/><button className="secondary" disabled={!newOpeningItem.trim()}><Plus size={15}/> הוספה</button></form><div className="modal-footer"><button className="secondary" onClick={()=>setOpeningSchool(null)}>ביטול</button><button className="primary" onClick={()=>void saveOpening()}>שמירת צ׳קליסט</button></div></div></div>}
  </main>;
}
