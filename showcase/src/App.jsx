import React,{useState} from 'react';
import {ArrowRight,CalendarDays,Check,ClipboardCheck,Github,Heart,Home,KeyRound,Leaf,LockKeyhole,Menu,Plus,RotateCcw,ShieldCheck,ShoppingBasket,Sparkles,UsersRound,Wallet,X} from 'lucide-react';

const REPO='https://github.com/MichaelWave369/FamilyVault';
const nav=[
  ['home','Home',Home,'main'],['calendar','Calendar',CalendarDays,'everyday'],
  ['tasks','Chore board',ClipboardCheck,'everyday'],['shopping','Shopping lists',ShoppingBasket,'everyday'],
  ['family','Our people',UsersRound,'household'],['expenses','Expenses',Wallet,'household'],
  ['medical','Medical',Heart,'private'],['vault','Private vault',LockKeyhole,'private']
];
const seedTasks=[
  {id:1,name:'Water the garden',who:'Riley',tone:'lilac',done:false,when:'Today'},
  {id:2,name:'Take out recycling',who:'Avery',tone:'peach',done:true,when:'Today'},
  {id:3,name:'Put away clean laundry',who:'Jordan',tone:'sage',done:false,when:'Tomorrow'},
  {id:4,name:'Plan Sunday breakfast',who:'Casey',tone:'butter',done:false,when:'This week'}
];
const seedList=[
  {id:1,name:'Sourdough bread',kind:'Bakery',done:false},
  {id:2,name:'Strawberries',kind:'Produce',done:false},
  {id:3,name:'Oat milk',kind:'Dairy & more',done:true},
  {id:4,name:'Fresh flowers',kind:'Something nice',done:false},
  {id:5,name:'Pasta',kind:'Pantry',done:false}
];
const seedEvents=[
  {id:1,day:0,time:'9:30 AM',name:'Morning coffee together',kind:'Family time',tone:'peach'},
  {id:2,day:0,time:'4:00 PM',name:'Soccer practice',kind:'Activities',tone:'sage'},
  {id:3,day:1,time:'6:30 PM',name:'Pasta night',kind:'Dinner plans',tone:'butter'},
  {id:4,day:3,time:'11:00 AM',name:'Farmers market',kind:'Out & about',tone:'lilac'},
  {id:5,day:5,time:'7:00 PM',name:'Family movie night',kind:'Family time',tone:'peach'}
];
const people=[
  ['Avery','Owner','AV','peach','Keeps us all connected'],
  ['Jordan','Adult','JO','sage','Keeper of the calendar'],
  ['Riley','Teen','RI','lilac','Resident creative mind'],
  ['Casey','Child','CA','butter','The sunshine committee']
];
const expenseRows=[['Groceries',420,'sage'],['Home',280,'peach'],['Activities',165,'lilac'],['Other',95,'butter']];
function dateFor(offset){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d;}
const pretty=(date,opts)=>new Intl.DateTimeFormat('en-US',opts).format(date);
function Avatar({initials,tone='sage',large=false}){return <span className={'avatar '+tone+(large?' avatar-large':'')}>{initials}</span>;}
function Heading({eyebrow,title,action}){return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>;}
function HouseArt(){return <svg className="house-art" viewBox="0 0 460 340" role="img" aria-label="Warm illustrated house with trees and a golden sun">
  <circle cx="358" cy="79" r="55" fill="#f0c985"/><circle cx="358" cy="79" r="39" fill="#eebd72"/>
  <path d="M0 298Q115 258 230 301t230 0v39H0Z" fill="#9bb499"/><path d="M0 326q125-29 250 3t210-17v28H0Z" fill="#618b79"/>
  <rect x="126" y="150" width="207" height="161" rx="9" fill="#f9e5ca"/>
  <path d="M103 165 231 58l127 107-18 18-109-92-109 92Z" fill="#a76356"/>
  <path d="M125 150 231 72l103 78" fill="none" stroke="#824d43" strokeWidth="4"/>
  <rect x="150" y="190" width="55" height="61" rx="5" fill="#749e9c"/><path d="M177 191v60m-27-30h55" stroke="#fff2dc" strokeWidth="6"/>
  <rect x="267" y="190" width="49" height="61" rx="5" fill="#749e9c"/><path d="M291 191v60m-24-30h49" stroke="#fff2dc" strokeWidth="6"/>
  <path d="M210 311v-86q0-18 19-18h8q19 0 19 18v86" fill="#42695b"/><circle cx="243" cy="263" r="4" fill="#eac98b"/>
  <path d="M42 308V182m373 132V207" stroke="#416e58" strokeWidth="12" strokeLinecap="round"/>
  <circle cx="40" cy="173" r="57" fill="#6e9981"/><circle cx="14" cy="201" r="36" fill="#87ad8d"/><circle cx="78" cy="202" r="34" fill="#84a88c"/>
  <circle cx="409" cy="192" r="50" fill="#679481"/><circle cx="372" cy="219" r="32" fill="#84ad92"/><circle cx="441" cy="215" r="33" fill="#8caf93"/>
  <g fill="#f5dfbb"><circle cx="101" cy="312" r="5"/><circle cx="88" cy="325" r="6"/><circle cx="369" cy="312" r="5"/><circle cx="389" cy="322" r="5"/></g>
</svg>;}
export default function App(){
  const [tab,setTab]=useState('home');
  const [tasks,setTasks]=useState(seedTasks);
  const [list,setList]=useState(seedList);
  const [events,setEvents]=useState(seedEvents);
  const [day,setDay]=useState(0);
  const [filter,setFilter]=useState('all');
  const [mobile,setMobile]=useState(false);
  const [counter,setCounter]=useState(0);
  const pending=tasks.filter(t=>!t.done).length;
  const needed=list.filter(t=>!t.done).length;
  const complete=tasks.length-pending;
  const active=nav.find(item=>item[0]===tab);
  function go(next){setTab(next);setMobile(false);window.scrollTo({top:0,behavior:'smooth'});}
  function reset(){setTasks(seedTasks);setList(seedList);setEvents(seedEvents);setFilter('all');setDay(0);setCounter(0);}
  function addTask(){const names=['Choose a board game','Set the dinner table','Feed the houseplants','Sort the bookshelf'];setTasks(a=>[...a,{id:'new-'+counter,name:names[counter%names.length],who:'Avery',tone:'peach',done:false,when:'Just added'}]);setCounter(c=>c+1);setFilter('all');}
  function addItem(){setList(a=>[...a,{id:'item-'+a.length,name:'Fresh lemons',kind:'Produce',done:false}]);}
  function addEvent(){setEvents(a=>[...a,{id:'event-'+a.length,day,time:'3:00 PM',name:'Afternoon walk',kind:'Family time',tone:'sage'}]);}
  function TaskRows({short=false}){const show=short?tasks.slice(0,3):tasks.filter(t=>filter==='all'||(filter==='open'?!t.done:t.done));return <div className="rows">{show.map(t=><div className={'task-row'+(t.done?' completed':'')} key={t.id}>
    <button className={'check'+(t.done?' checked':'')} aria-label={(t.done?'Mark incomplete: ':'Complete: ')+t.name} aria-pressed={t.done} onClick={()=>setTasks(a=>a.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>{t.done&&<Check size={14}/>}</button>
    <span className="row-main"><strong>{t.name}</strong><small>{t.when}</small></span><Avatar initials={t.who.slice(0,2).toUpperCase()} tone={t.tone}/>
  </div>)}{!show.length&&<p className="empty">No chores here. Enjoy the breathing room.</p>}</div>;}
  function ListRows({short=false}){return <div className="rows">{(short?list.slice(0,4):list).map(t=><div className={'list-row'+(t.done?' completed':'')} key={t.id}><button className={'check'+(t.done?' checked':'')} aria-label={(t.done?'Uncheck ':'Check ')+t.name} aria-pressed={t.done} onClick={()=>setList(a=>a.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>{t.done&&<Check size={14}/>}</button><strong>{t.name}</strong><small>{t.kind}</small></div>)}</div>;}
  function EventRows({short=false}){const show=short?events.slice(0,3):events.filter(e=>e.day===day);return <div className="events">{show.map(e=><div className="event-row" key={e.id}><span className="event-time">{e.time}</span><span className={'event-dot '+e.tone}></span><span><strong>{e.name}</strong><small>{e.kind}{short?' · '+pretty(dateFor(e.day),{weekday:'short'}):''}</small></span></div>)}{!show.length&&<p className="empty">Nothing on the calendar today. A lovely little pause.</p>}</div>;}
  return <div className="app">
    <aside className={'sidebar'+(mobile?' open':'')}>
      <div className="brand-row"><button className="brand" onClick={()=>go('home')} aria-label="FamilyVault home"><span className="brand-icon"><Home size={23}/><span>♥</span></span><span className="brand-name">family<b>vault</b><small>HOME, HELD TOGETHER.</small></span></button><button className="mobile-close" aria-label="Close navigation" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="family-switch"><span className="switch-icon"><Leaf size={20}/></span><span><strong>The Willow House</strong><small>Fictional demo household</small></span></div>
      <nav aria-label="Main navigation">{['main','everyday','household','private'].map(group=><div className="nav-group" key={group}>{group!=='main'&&<div className="nav-caption">{group==='everyday'?'EVERYDAY LIFE':group==='household'?'OUR HOUSEHOLD':'PROTECTED SPACES'}</div>}{nav.filter(x=>x[3]===group).map(([id,title,Icon])=><button key={id} className={'nav-btn'+(id===tab?' active':'')} onClick={()=>go(id)} aria-current={id===tab?'page':undefined}><Icon size={19} strokeWidth={1.9}/><span>{title}</span>{id==='tasks'&&pending>0&&<span className="nav-counter">{pending}</span>}{(id==='vault'||id==='medical')&&<LockKeyhole size={12} className="nav-lock"/>}</button>)}</div>)}</nav>
      <div className="sidebar-end"><div className="security-card"><ShieldCheck size={21}/><span><strong>Privacy belongs at home.</strong><small>Real records never appear on this public preview.</small></span></div><a href={REPO} target="_blank" rel="noopener noreferrer" className="github-link"><Github size={16}/> View source code <ArrowRight size={14}/></a></div>
    </aside>
    {mobile&&<button className="scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
    <div className="main-wrap">
      <div className="demo-ribbon"><span className="pulse"/><strong>INTERACTIVE PREVIEW</strong><span>Fictional data · Memory only · No backend connected</span><button onClick={reset}><RotateCcw size={13}/> Reset demo</button></div>
      <header className="topbar"><div><button className="hamburger" onClick={()=>setMobile(true)} aria-label="Open navigation"><Menu/></button><span className="crumb">The Willow House</span><span className="slash">/</span><strong>{active[1]}</strong></div><div className="topbar-right"><span className="top-date"><CalendarDays size={15}/>{pretty(new Date(),{month:'short',day:'numeric',year:'numeric'})}</span><Avatar initials="AV" tone="peach"/></div></header>
      <main className="content">
      {tab==='home'&&<>
        <div className="welcome-line"><span className="eyebrow">YOUR LITTLE CORNER OF CALM</span><span>{pretty(new Date(),{weekday:'long',month:'long',day:'numeric'})}</span></div>
        <section className="hero"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15}/> A home for all the little things</span><h1>Life together,<br/><em>a little lighter.</em></h1><p>Plans, people, everyday to-dos, and the moments that matter. One gentle place to keep the whole household in sync.</p><div className="hero-actions"><button className="btn primary" onClick={()=>go('calendar')}>Explore the planner <ArrowRight size={17}/></button><button className="btn quiet" onClick={()=>go('vault')}>Our privacy promise <ArrowRight size={16}/></button></div></div><div className="hero-image"><HouseArt/><span className="art-caption"><Heart size={13} fill="currentColor"/> Made for real life</span></div></section>
        <div className="stats"><button onClick={()=>go('calendar')} className="stat"><span className="stat-icon peach"><CalendarDays size={21}/></span><strong>{events.length}</strong><span>Things coming up</span><small>See the calendar <ArrowRight size={14}/></small></button><button onClick={()=>go('tasks')} className="stat"><span className="stat-icon sage"><ClipboardCheck size={21}/></span><strong>{pending}</strong><span>Chores on the board</span><small>{complete} done already <ArrowRight size={14}/></small></button><button onClick={()=>go('shopping')} className="stat"><span className="stat-icon lilac"><ShoppingBasket size={21}/></span><strong>{needed}</strong><span>Things to pick up</span><small>See the shopping list <ArrowRight size={14}/></small></button></div>
        <div className="dashboard-grid"><section className="surface"><Heading eyebrow="THE DAYS AHEAD" title="On the calendar" action={<button className="link-action" onClick={()=>go('calendar')}>View all <ArrowRight size={15}/></button>}/><EventRows short/></section><section className="surface"><Heading eyebrow="SMALL WINS ADD UP" title="Around the house" action={<button className="link-action" onClick={()=>go('tasks')}>All chores <ArrowRight size={15}/></button>}/><TaskRows short/></section></div>
        <div className="bottom-grid"><section className="surface"><Heading eyebrow="A LITTLE REMINDER" title="The shopping list" action={<button className="link-action" onClick={()=>go('shopping')}>Full list <ArrowRight size={15}/></button>}/><ListRows short/></section><section className="quote-card"><span className="quote-symbol">✳</span><p>“The best things in life aren't things. They're the people we share them with.”</p><small>ROOM FOR WHAT MATTERS</small><button onClick={()=>go('family')}>Meet the household <ArrowRight size={15}/></button></section></div>
      </>}
      {tab==='calendar'&&<><div className="page-intro"><span className="eyebrow">MAKE SPACE FOR THE GOOD STUFF</span><h1>Our shared <em>calendar.</em></h1><p>Little moments, big plans, and all the things in between.</p></div><section className="surface wide"><Heading eyebrow="A LOOK AHEAD" title="The next seven days" action={<button className="small-action" onClick={addEvent}><Plus size={16}/> Add sample event</button>}/><div className="week-strip">{Array.from({length:7},(_,i)=><button className={'day-card'+(day===i?' selected':'')} key={i} onClick={()=>setDay(i)} aria-pressed={day===i}><span>{pretty(dateFor(i),{weekday:'short'})}</span><strong>{dateFor(i).getDate()}</strong><i className={events.some(e=>e.day===i)?'marked':''}/></button>)}</div><div className="agenda"><h3>{pretty(dateFor(day),{weekday:'long',month:'long',day:'numeric'})}</h3><EventRows/></div><div className="inline-tip"><Sparkles size={16}/> Select a day or add an example event to try the planner.</div></section></>}
      {tab==='tasks'&&<><div className="page-intro"><span className="eyebrow">EVERY HAND MAKES A HOME</span><h1>Little jobs, <em>shared joy.</em></h1><p>Keep track of everyday work without turning it into work.</p></div><section className="surface wide"><Heading eyebrow="HOUSEHOLD TO-DOS" title="Chore board" action={<button className="small-action" onClick={addTask}><Plus size={16}/> Add sample chore</button>}/><div className="progress-caption"><span><strong>{complete} of {tasks.length}</strong> chores done</span><strong>{Math.round(complete/tasks.length*100)}%</strong></div><div className="progress"><div style={{width:(complete/tasks.length*100)+'%'}}/></div><div className="filters" role="group" aria-label="Filter chores">{[['all','All chores'],['open','To do'],['done','Completed']].map(([id,label])=><button className={filter===id?'selected':''} key={id} onClick={()=>setFilter(id)} aria-pressed={filter===id}>{label}</button>)}</div><TaskRows/></section></>}
      {tab==='shopping'&&<><div className="page-intro"><span className="eyebrow">PICKING UP THE LITTLE THINGS</span><h1>Good things <em>on the list.</em></h1><p>Everything for the week, together in one place.</p></div><section className="surface wide"><Heading eyebrow="OUR WEEKLY BASKET" title="Grocery run" action={<button className="small-action" onClick={addItem}><Plus size={16}/> Add sample item</button>}/><div className="shopping-progress"><span><ShoppingBasket size={35}/></span><div><strong>{list.length-needed} of {list.length} picked up</strong><p>{needed?needed+' little things still to find':'All done! Time to head home.'}</p></div></div><ListRows/></section></>}
      {tab==='family'&&<><div className="page-intro"><span className="eyebrow">THE HEART OF THE HOME</span><h1>Our favorite <em>people.</em></h1><p>One household, different roles, everyone with a place.</p></div><div className="people">{people.map(([name,role,initials,tone,subtitle])=><div className="person" key={name}><Avatar initials={initials} tone={tone} large/><h3>{name}</h3><span className="role">{role}</span><p>{subtitle}</p></div>)}</div><div className="info-card"><ShieldCheck size={24}/><div><strong>Respectful access, by design</strong><p>The real backend enforces different permissions for owners, adults, teens, children, and guests. Demo profiles are fictional, not real accounts.</p></div></div></>}
      {tab==='expenses'&&<><div className="page-intro"><span className="eyebrow">A CLEARER VIEW OF THE EVERYDAY</span><h1>Household <em>spending.</em></h1><p>A gentle snapshot of where things go. No spreadsheets at the dinner table required.</p></div><section className="surface wide"><Heading eyebrow="EXAMPLE MONTH" title="Where the budget goes" action={<span className="sample-tag">Fictional amounts</span>}/><div className="expense-total"><span>Total recorded</span><strong>$960<small>.00</small></strong><small>USD · Sample figures only</small></div><div className="expense-bars">{expenseRows.map(([name,value,tone])=><div className="expense-line" key={name}><div><strong>{name}</strong><span>{'$'+value}</span></div><div className="bar-track"><span className={tone} style={{width:(value/420*100)+'%'}}/></div></div>)}</div></section></>}
      {(tab==='medical'||tab==='vault')&&<><div className="page-intro"><span className="eyebrow">SOME THINGS ARE JUST FOR FAMILY</span><h1>{tab==='medical'?<>Care deserves <em>privacy.</em></>:<>Private by <em>default.</em></>}</h1><p>{tab==='medical'?'Important health information should never become public website content.':'The things you want to remember, protected by real authentication.'}</p></div><div className="locked-card"><div className="lock-art"><span><LockKeyhole size={38}/></span></div><span className="eyebrow">NOT AVAILABLE IN PUBLIC PREVIEW</span><h2>{tab==='medical'?'Health records stay behind the door.':'A vault is only a vault when it stays private.'}</h2><p>This is a visual overview only. Actual {tab==='medical'?'medical notes, files and profiles':'secrets, folders and explicitly shared items'} are handled by the separately deployed, authenticated FamilyVault backend, never by GitHub Pages.</p><div className="security-pills"><span><ShieldCheck size={16}/> Authenticated access</span><span><KeyRound size={16}/> Server-side encryption</span><span><LockKeyhole size={16}/> Role-aware permissions</span></div><a href={REPO+'/blob/main/SECURITY.md'} target="_blank" rel="noopener noreferrer" className="btn primary">Read security model <ArrowRight size={16}/></a><small>Server-side encryption is not end-to-end encryption. Production hardening and a dedicated security review are still required.</small></div></>}
      <footer><span><Heart size={14}/> FamilyVault · Home, held together.</span><span>Public demo · No real data · No persistence</span><a href={REPO} target="_blank" rel="noopener noreferrer">Source <ArrowRight size={13}/></a></footer>
      </main>
    </div>
  </div>;
}
