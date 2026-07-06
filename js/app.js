/* ============ Constants ============ */
function hasKeyword(text, kw){
  // Single words use word-boundary matching so short keywords like "sport" don't
  // false-positive inside unrelated words like "passport". Multi-word phrases
  // keep simple substring matching since they're specific enough already.
  if(kw.indexOf(' ')===-1){
    return new RegExp('\\b'+kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b').test(text);
  }
  return text.includes(kw);
}
const SKILLS = [
  {id:'knowledge', icon:'📚', name:'Knowledge', title:'Scholar'},
  {id:'strength', icon:'💪', name:'Strength', title:'Warrior'},
  {id:'discipline', icon:'🎯', name:'Discipline', title:'Monk'},
  {id:'organization', icon:'🏠', name:'Organization', title:'Architect'},
  {id:'relationships', icon:'🤝', name:'Relationships', title:'Diplomat'},
  {id:'wellbeing', icon:'❤️', name:'Wellbeing', title:'Sage'},
  {id:'finance', icon:'💰', name:'Finance', title:'Merchant'},
  {id:'creativity', icon:'🎨', name:'Creativity', title:'Creator'},
  {id:'productivity', icon:'⚡', name:'Productivity', title:'Engineer'}
];
const SKILL_MAP = Object.fromEntries(SKILLS.map(s=>[s.id,s]));
/* Each skill needs an actual meaning, not just a name, or the AI has nothing
   to reason against besides vibes. These definitions are fed straight into
   the AI prompt so it judges "does this task genuinely do X" against a real
   standard instead of guessing from surface words. */
const SKILL_DEFINITIONS = {
  knowledge: 'Award XP when a task genuinely increases understanding — studying, reading, watching educational content, learning a language, research, taking notes, revision.',
  strength: 'Anything improving physical capability — gym, sport, walking, running, stretching, swimming, cycling.',
  discipline: 'Doing something because it should be done, independent of motivation in the moment — morning routine, folding washing, going to the gym, brushing teeth, paying bills, sticking to a habit.',
  organization: 'Improving order in a physical or digital space or system — cleaning a room, filing documents, meal prep, planning the week, budgeting, organizing a desk, folding laundry.',
  relationships: 'Anything that strengthens, maintains, or repairs a connection with another specific person or group — calling or texting a parent, partner, friend, sibling, or colleague; meeting up, a date, a family dinner, a birthday, hosting or attending a gathering; helping someone, volunteering, checking in on someone, sending a thoughtful or overdue message, apologizing or making amends, a difficult conversation, team sports, staying in touch while apart, gift-giving, remembering an occasion. The key test: does this involve another named or implied person, and does it build or maintain that bond? If yes, this almost always applies — don\'t under-credit it just because the task also involves a phone, an event, or an errand-shaped verb.',
  wellbeing: 'Improving physical or mental wellbeing — sleep, relaxing, therapy, meditation, time in nature, healthy meals, taking a break, socialising, listening to music, journaling.',
  finance: 'Anything improving financial literacy or security — opening a savings account, budgeting, saving money, investing, tracking expenses, learning about finance, comparing banks.',
  creativity: 'Creating something original — drawing, music, photography, writing, designing, brainstorming, cooking creatively.',
  productivity: 'Completing useful work and clearing obligations — finishing a project, completing an assignment, replying to emails, planning, admin, errands.'
};
const SKILL_KEYWORDS = {
  knowledge: ['study','read','learn','research','revise','revision','course','lecture','homework','essay','exam','quiz','notes','textbook','biology','history','math','chemistry','physics','tutorial','flashcard','memorize','lesson','assignment','thesis','dissertation','coursework','review notes','audiobook','documentary','podcast episode','language app','duolingo'],
  strength: ['gym','workout','run','jog','lift','training','sport','swim','cycle','hike','climb','row','squat','deadlift','bench','pushup','pull-up','sprint','martial arts','boxing'],
  discipline: ['plan tomorrow','routine','wake up early','discipline','schedule tomorrow','declutter inbox','no snooze','cold shower','meal plan','stick to budget','quit habit','brush teeth','shower','make the bed','early night','no phone','digital detox','stick to plan'],
  organization: ['clean','tidy','organize','organise','declutter','sort','file','laundry','fold','dishes','inbox','label','plan week','calendar','to-do list','filing cabinet','closet','desk','pantry','garage','meal prep','car service','mot','insurance renewal','paperwork','admin','unpack','pack'],
  relationships: ['call','text','message','reply to','write back to','meet up','coffee with','dinner with','lunch with','friend','family','partner','girlfriend','boyfriend','wife','husband','fiancé','fiancée','roommate','housemate','colleague','coworker','teammate','date night','birthday','anniversary','wedding','reunion','party','gathering','host','invite','visit','catch up','check in on','check on','reach out','hang out','video call','facetime','zoom call','phone call','grandma','grandpa','mom','mum','dad','sibling','brother','sister','cousin','aunt','uncle','in-laws','kids','parents','neighbor','neighbour','negotiate','difficult conversation','apologize','apologise','make amends','make up with','reconcile','write a letter','thank you card','thank you note','gift for','send a gift','support a friend','listen to','group chat','double date','playdate','game night','book club'],
  wellbeing: ['sleep','water','walk','journal','rest','relax','therapy','doctor','meditat','health','healthy habit','wellness','self care','selfcare','vitamin','medication','nap','hydrate','nutrition','diet','mental health','skincare','stretch','yoga','exercise','habit','breathing','dentist','checkup','massage','spa','sunlight','fresh air','break','take a break','unwind','decompress','time off'],
  finance: ['budget','pay bill','invoice','bank','save money','saving','savings','invest','spending','tax','rent','mortgage','loan','credit card','financial advisor','retirement','pension','stocks','crypto','net worth','expense tracker','subscription','insurance'],
  creativity: ['draw','paint','write','design','music','create','compose','sketch','photo','song','craft','knit','sew','pottery','instrument','poem','story','film','video edit','build a model'],
  productivity: ['finish','complete','submit','deadline','ship','deploy','organize project','prioritize','clear inbox','batch task','automate','email','presentation','pitch','public speaking','interview','feedback','apply for','job application','cover letter','resume','cv','follow up','invoice client','renew','admin task']
};
const HIGH_EFFORT_WORDS = ['essay','exam','project','revision','deep','presentation','thesis','report','workout','marathon','deadline','assignment','dissertation','intense','advanced','hardcore','challenging'];
const LOW_EFFORT_WORDS = ['quick','tidy','water plants','dishes','text','check email','wipe','easy','simple','light','beginner'];
const DURATION_RE = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i;
const WORD_DURATION_MAP = [
  { re:/\bhalf an? hour\b|\bhalf hour\b/i, minutes:30 },
  { re:/\bquarter of an hour\b|\bquarter hour\b/i, minutes:15 },
  { re:/\ban? hour and a half\b|\b1\.5\s*hours?\b/i, minutes:90 },
  { re:/\bcouple of hours\b|\ba couple hours\b/i, minutes:120 },
  { re:/\ban? hour\b/i, minutes:60 },
  { re:/\ball (morning|afternoon)\b/i, minutes:180 },
  { re:/\ball day\b/i, minutes:360 },
  { re:/\bfive minutes\b/i, minutes:5 },
  { re:/\bten minutes\b/i, minutes:10 },
  { re:/\bfifteen minutes\b/i, minutes:15 },
  { re:/\btwenty minutes\b/i, minutes:20 },
  { re:/\bthirty minutes\b/i, minutes:30 },
  { re:/\bforty five minutes\b|\bforty-five minutes\b/i, minutes:45 },
];
const LEVEL_RE = /\blevel\s*(\d+)\b/i;

/* ============ Task categories ============
   Primary category is separate from skills: it's used for organisation and
   filtering, while skills track which parts of life the task actually grows. */
const CATEGORIES = [
  {id:'study', icon:'📚', name:'Study'},
  {id:'health', icon:'💪', name:'Health'},
  {id:'chores', icon:'🏠', name:'Chores'},
  {id:'work', icon:'💼', name:'Work'},
  {id:'personal', icon:'🌱', name:'Personal'},
  {id:'finance', icon:'💰', name:'Finance'},
  {id:'social', icon:'🤝', name:'Social'}
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
const CATEGORY_KEYWORDS = {
  study: ['study','read','revise','revision','course','lecture','homework','essay','exam','quiz','notes','textbook','biology','history','math','chemistry','physics','learn','research','assignment','thesis','dissertation','coursework'],
  health: ['gym','workout','run','jog','lift','training','sport','swim','cycle','walk','stretch','yoga','meditat','doctor','therapy','sleep','nap','water','hydrate','nutrition','diet','vitamin','medication','wellness','self care','selfcare','mental health','skincare','breathing','exercise'],
  chores: ['clean','tidy','organize','organise','declutter','sort','file','laundry','wash','fold','dishes','vacuum','bin','trash','garden','mow','bedroom','kitchen','bathroom','groceries','shopping list','car service','mot','meal prep','pack','unpack'],
  work: ['meeting','email','client','project','presentation','report','deadline','office','shift','interview','resume','cv','colleague','boss','standup','deploy','ship','apply for','job application','cover letter','follow up','invoice client'],
  personal: ['journal','hobby','plan tomorrow','routine','reflect','goal','habit','relax','rest','declutter inbox'],
  finance: ['budget','pay bill','invoice','bank','save money','invest','spending','tax','rent','bill','subscription','expense'],
  social: ['call','text','message','meet up','coffee with','dinner with','friend','family','partner','colleague','coworker','date night','birthday','anniversary','party','gathering','host','visit','catch up','reach out','hang out','video call','check in on','group chat']
};
/* ============ Local recognition (no AI, deterministic) ============
   These give real recognition capability — recurrence and vagueness —
   entirely offline. Cheap, instant, and free, so they run on every
   keystroke rather than being reserved for an AI call. */
const DAILY_RECUR_RE = /\bevery ?day\b|\bdaily\b|\beach day\b|\bevery morning\b|\bevery night\b|\bevery evening\b/i;
const WEEKLY_RECUR_RE = /\bevery ?week\b|\bweekly\b|\beach week\b|\bevery (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
function detectLocalRecurrence(t){
  if(DAILY_RECUR_RE.test(t)) return 'daily';
  if(WEEKLY_RECUR_RE.test(t)) return 'weekly';
  return 'none';
}
const VAGUE_TITLES = new Set(['stuff','things','todo','to do','misc','miscellaneous','random stuff','school stuff','work stuff','life stuff','chores','errands','school','work','life','tasks','sort my life out','get organized','get organised','be better','do better','fix everything']);
function isVagueTitle(t){
  const clean = t.trim().toLowerCase().replace(/[.!?]+$/,'');
  if(VAGUE_TITLES.has(clean)) return true;
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length<=2 && /^(stuff|things|misc|chores|errands|school|work|life|tasks)$/i.test(words[words.length-1]||'');
}
function localCategorize(t){
  const learned = learnedSignalFor(t);
  const scored = CATEGORIES.map(c=>{
    const kws = CATEGORY_KEYWORDS[c.id] || [];
    let score = 0;
    kws.forEach(k=>{ if(hasKeyword(t,k)) score += k.length; });
    score += (learned.catScores[c.id]||0) * 4; // learned signal fills gaps the hardcoded list misses
    return { id:c.id, score };
  }).sort((a,b)=>b.score-a.score);
  return scored[0].score>0 ? scored[0].id : 'personal';
}

/* ============ Smart Tags ============
   Freeform, searchable tags generated from whatever category/skill keywords
   actually matched, plus the category name itself. Kept independent of any
   life-area concept — just a lightweight local fallback for when there's no
   API key; the AI path generates much richer, intent-based tags itself. */
function titleCaseWord(w){ return w.replace(/\b\w/g, c=>c.toUpperCase()); }
function localSmartTags(t, categoryId, skillIds){
  const tags = new Set();
  const allKeywordSets = [CATEGORY_KEYWORDS[categoryId]||[]].concat(skillIds.map(s=>SKILL_KEYWORDS[s]||[]));
  allKeywordSets.forEach(kws=> kws.forEach(k=>{ if(hasKeyword(t,k)) tags.add(titleCaseWord(k)); }));
  if(CATEGORY_MAP[categoryId]) tags.add(CATEGORY_MAP[categoryId].name);
  return Array.from(tags).slice(0,6);
}

const DEFAULT_REWARDS = [
  {id:'r1', name:'Coffee', cost:200, type:'coins', icon:'☕'},
  {id:'r2', name:'Gaming time', cost:300, type:'coins', icon:'🎮'},
  {id:'r3', name:'Takeaway meal', cost:600, type:'coins', icon:'🍔'},
  {id:'r4', name:'Movie night', cost:800, type:'coins', icon:'🎬'},
  {id:'r5', name:'Bike ride', cost:400, type:'xp', icon:'🚴'},
];
const QUEST_POOL = [
  {id:'q1', skill:'knowledge', name:'Study for 45 minutes', icon:'📖', target:60},
  {id:'q2', skill:'knowledge', name:'Read 10 pages', icon:'📰', target:40},
  {id:'q3', skill:'productivity', name:'Complete three tasks', icon:'✅', target:90},
  {id:'q4', skill:'strength', name:'Get a workout in', icon:'🏋️', target:70},
  {id:'q5', skill:'wellbeing', name:'Journal for 5 minutes', icon:'📓', target:30},
  {id:'q6', skill:'wellbeing', name:'Drink enough water today', icon:'💧', target:20},
  {id:'q7', skill:'wellbeing', name:'Take a walk outside', icon:'🚶', target:30},
  {id:'q8', skill:'organization', name:'Tidy or organize a space', icon:'🧹', target:35},
  {id:'q9', skill:'relationships', name:'Reach out to someone', icon:'📞', target:35},
  {id:'q10', skill:'finance', name:'Review your spending', icon:'🧾', target:40},
  {id:'q11', skill:'creativity', name:'Make something', icon:'🎨', target:60},
  {id:'q13', skill:'discipline', name:'Plan tomorrow tonight', icon:'🗓️', target:30},
];
const BUILTIN_HABIT_IDS = ['nh1','nh2','nh3','nh4','nh5','nh6'];
const BUILTIN_CHALLENGES = [
  { id:'weekly', name:'Weekly Challenge', desc:'Earn 500 XP this week', icon:'🚩', kind:'builtin', period:'weekly', conditionType:'xp', targetXp:500, reward:150 },
  { id:'monthly', name:'Monthly Challenge', desc:'Earn 2000 XP this month', icon:'👑', kind:'builtin', period:'monthly', conditionType:'xp', targetXp:2000, reward:500 }
];
const MASTERY_TIERS = ['Bronze','Silver','Gold','Platinum','Diamond','Master','Grandmaster','Legendary'];
const TIER_COLORS = ['#C08A4E','#B9C2CE','#E8B54D','#8FE3D9','#8CC7F0','#C9A4F5','#F0A8D8','#FFD86B'];
const TIER_REWARDS = [
  {xp:30,  coins:15,  rarity:'small'},
  {xp:60,  coins:30,  rarity:'small'},
  {xp:120, coins:60,  rarity:'medium', title:true},
  {xp:220, coins:110, rarity:'medium', title:true},
  {xp:380, coins:190, rarity:'rare',   title:true},
  {xp:600, coins:300, rarity:'rare',   title:true, bonus:true},
  {xp:900, coins:450, rarity:'exclusive', title:true, bonus:true, celebration:true},
  {xp:1400,coins:700, rarity:'exclusive', title:true, bonus:true, celebration:true}
];
const MASTERY_SCALES = {
  small:    [5,10,25,50,100,200,400,750],
  med:      [10,25,50,100,250,500,1000,2000],
  large:    [25,50,100,250,500,1000,2500,5000],
  huge:     [50,100,250,500,1000,2500,5000,10000],
  currency: [500,1500,3500,7500,15000,35000,75000,150000],
  level:    [3,5,10,15,20,30,40,50],
  streak:   [3,7,14,30,60,100,200,365]
};
const GAMEPLAY_BONUS_POOL = ['xp2x_2h','coins2x_2h','streak_shield','fine_waiver','extra_quest','mystery_chest','free_token'];
const MASTERIES = [
  { id:'study_sessions', category:'study', icon:'📖', name:'Study Sessions', desc:'Complete tasks in the Study category', skills:['knowledge','discipline'], scale:'large',
    compute:()=> completedTasks().filter(t=>t.category==='study').length },
  { id:'exams_completed', category:'study', icon:'🎓', name:'Exams Completed', desc:'Complete tasks tagged as an exam', skills:['knowledge'], scale:'small',
    compute:()=> completedTasks().filter(t=>t.tag==='exam').length },
  { id:'tasks_completed', category:'productivity', icon:'✅', name:'Tasks Completed', desc:'Complete tasks of any kind', skills:['productivity'], scale:'huge',
    compute:()=> completedTasks().length },
  { id:'perfect_days', category:'productivity', icon:'🌟', name:'Perfect Days', desc:'Finish every task due in a day', skills:['discipline','productivity'], scale:'small',
    compute:()=> state.perfectDaysCount||0 },
  { id:'gym_sessions', category:'health', icon:'🏋️', name:'Gym Sessions', desc:'Complete workout-flavoured Health tasks', skills:['strength','discipline'], scale:'large',
    compute:()=> completedTasks().filter(t=>t.category==='health' && /gym|workout|lift|train|run|jog|swim|cycle|exercise/i.test(t.title)).length },
  { id:'health_tasks', category:'health', icon:'❤️', name:'Wellbeing Tasks', desc:'Complete any Health-category task', skills:['wellbeing'], scale:'large',
    compute:()=> completedTasks().filter(t=>t.category==='health').length },
  { id:'daily_streak', category:'discipline', icon:'🔥', name:'Daily Streaks', desc:'Keep your daily streak alive', skills:['discipline'], scale:'streak',
    compute:()=> state.streak.longest||0 },
  { id:'weekly_goals', category:'discipline', icon:'🗓️', name:'Weekly Goals', desc:'Claim the weekly challenge', skills:['discipline','productivity'], scale:'small',
    compute:()=> Object.keys(state.challengeClaims||{}).filter(k=>/^\d{4}-W\d+$/.test(k)).length },
  { id:'monthly_goals', category:'discipline', icon:'📆', name:'Monthly Goals', desc:'Claim the monthly challenge', skills:['discipline'], scale:'small',
    compute:()=> Object.keys(state.challengeClaims||{}).filter(k=>/^\d{4}-M\d+$/.test(k)).length },
  { id:'chores_done', category:'life', icon:'🏠', name:'Chores Done', desc:'Complete Chores-category tasks', skills:['organization'], scale:'large',
    compute:()=> completedTasks().filter(t=>t.category==='chores').length },
  { id:'social_life', category:'life', icon:'🤝', name:'Social Life', desc:'Complete Social-category tasks', skills:['relationships'], scale:'med',
    compute:()=> completedTasks().filter(t=>t.category==='social').length },
  { id:'finance_tasks', category:'life', icon:'💰', name:'Budgeting', desc:'Complete Finance-category tasks', skills:['finance'], scale:'med',
    compute:()=> completedTasks().filter(t=>t.category==='finance').length },
  { id:'level_progression', category:'special', icon:'⭐', name:'Level Progression', desc:'Reach new Life Levels', skills:[], scale:'level',
    compute:()=> lifeStats().level },
  { id:'coins_earned', category:'special', icon:'🪙', name:'Coins Earned', desc:'Earn coins over your lifetime', skills:['finance'], scale:'currency',
    compute:()=> totalCoinsEarned() },
  { id:'rewards_claimed', category:'special', icon:'🎁', name:'Rewards Claimed', desc:'Claim rewards from the shop', skills:[], scale:'small',
    compute:()=> state.claims.length },
  { id:'quests_claimed', category:'special', icon:'🧭', name:'Missions Claimed', desc:'Claim daily missions', skills:[], scale:'med',
    compute:()=> Object.keys(state.questClaims||{}).length }
];
const MASTERY_CATEGORIES = [
  {id:'study', icon:'📚', name:'Study'}, {id:'productivity', icon:'⚡', name:'Productivity'},
  {id:'health', icon:'💪', name:'Health'}, {id:'discipline', icon:'🎯', name:'Discipline'},
  {id:'life', icon:'🌱', name:'Life'}, {id:'special', icon:'✨', name:'Special'}, {id:'custom', icon:'📝', name:'Custom'}
];
const LOCAL_NOTIFS = {
  low: ['Nice, one less thing ✅', 'Small win — still counts.', 'Cleared.'],
  moderate: ['Solid work 💪', 'Good momentum.', 'That\u2019s progress.'],
  high: ['That was a big one 🔥', 'Serious effort — well earned.', 'Strong session.']
};

/* ============ Level curve ============ */
function levelCurve(xp, baseNeed, growth){
  let level=1, need=baseNeed, remain=Math.max(0,xp);
  while(remain>=need){ remain-=need; level++; need=Math.round(need*growth); }
  return {level, into:remain, need};
}
function skillCurve(xp){ return levelCurve(xp, 100, 1.15); }
function lifeCurve(xp){ return levelCurve(xp, 400, 1.12); }

/* ============ State ============ */
const STORAGE_KEY = 'lifexp-data-v2';
let state = null;
let syncTimer = null;
let dragCtx = null;
let swipeCtx = null;
let openSwipeRow = null;

function defaultState(){
  const skills = {}; SKILLS.forEach(s=> skills[s.id] = 0);
  return {
    tasks: [], taskOrder: [],
    onboardingComplete: false,
    googleAuth: null,
    skills,
    rewards: DEFAULT_REWARDS, claims: [],
    streak: { current:0, longest:0, last:null },
    achievements: {},
    masteries: {}, customMasteries: [], perfectDaysCount: 0,
    streakShields: 0, fineWaivers: 0, extraQuestDate: null,
    questClaims: {}, challengeClaims: {}, customChallenges: [],
    customQuests: [], archivedQuestIds: [], deletedQuestIds: [], questDisplayOrder: {}, questHistory: [],
    archivedChallengeIds: [], challengeHistory: [],
    archivedHabitIds: [],
    negativeHabits: [
      {id:'nh1', name:'Skipped study', fine:25},
      {id:'nh2', name:'Skipped workout', fine:20},
      {id:'nh3', name:'Missed habit', fine:10},
      {id:'nh4', name:'Overslept', fine:10},
      {id:'nh5', name:'Too much social media', fine:10},
      {id:'nh6', name:'Late bedtime', fine:10}
    ],
    fines: [],
    rewardEvents: [],
    timeline: [],
    recurringTasks: [],
    lastGeneratedDate: null,
    courtEnabled: true,
    courtCases: [],
    courtCaseSeq: 0,
    lastCourtCheckDate: null,
    activeFocus: null,
    dismissedInsightDate: null,
    activeBuffs: [],
    aiMemory: { facts: [] },
    aiInsight: null,
    lastInsightGenDate: null,
    aiCache: {},
    learnedWords: {},
    webhookUrl: '', geminiApiKey: '', userName: '',
    profile: { avatar:null, username:'', email:'', joinDate: Date.now() },
    joinDate: Date.now(),
    settings: {
      soundOn:true, soundMode:'immersive', hapticOn:true, soundVolume:0.6, hapticStrength:'medium',
      layoutPreset:'balanced',
      home: {
        visible: { courtAlert:true, aiSuggestions:true, summary:true, focus:true, streak:true, nextUp:true, calendarPreview:false, dailyQuest:true },
        collapsed: {},
        order: ['courtAlert','focus','aiSuggestions','summary','streak','nextUp','calendarPreview','dailyQuest'],
        view: 'comfortable'
      },
      appearance: { theme:'cozy', accent:'#D99A3F', preset:'honey', cornerStyle:'soft', glassIntensity:0, transparency:0, glowIntensity:130, iconStyle:'outline', navIconsOnly:false, brightness:100, warmth:0, bgStyle:'none', bgOpacity:8, bgImageUrl:'', custom:{ bg:'#0B0F17', card:'#141B28', card2:'#1B2434', text:'#F2F3F7' } },
      animations: {
        mode:'standard',
        xpAnim:true, coinAnim:true, levelUpAnim:true, achievementAnim:true, questAnim:true,
        confetti:true, particles:true, screenTransitions:true
      },
      notifications: { dailyReminder:false, smartAi:false, study:false, habit:false, streakWarnings:false, quietHours:'22:00–07:00' },
      gamification: {
        xpAnim:true, coinAnim:true, achievementPopups:true, questNotif:true, fineSystem:true, courtEnabled:true,
        showSkillXp:true, showLevelProgress:true, showDailyQuests:true, showWeeklyChallenges:true, showLifeBalanceWheel:true
      },
      ai: {
        suggestions:true, dailyPlanning:false, memoryTimeline:false, smartCategorization:true, autoClassification:true, autoDailyGen:true,
        smartScheduling:false, reminderFrequency:'normal', motivationMessages:true, coachingStyle:'balanced'
      },
      calendar: { weekStart:'monday', defaultDuration:'30 min', autoSchedule:true, autoMoveMissed:true, timeFormat:'24', density:'standard' },
      privacy: { appLockEnabled:false, appLockPin:null, hideSensitive:false },
      accessibility: { textSize:'medium', reduceMotion:false, highContrast:false, colorBlindMode:false },
      advanced: { betaFeatures:false, devOptions:false },
      widgets: { lockScreen:false, homeScreen:false, quickAdd:false, quickFocus:false, dailyProgress:false, streakWidget:false, xpWidget:false }
    },
    completedOpen: false,
    summaryOpen: false
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ state = { ...defaultState(), ...JSON.parse(raw) }; if(state.onboardingComplete===undefined) state.onboardingComplete = true; }
    else{ state = defaultState(); }
  }catch(e){ console.error('load failed', e); state = defaultState(); }
  SKILLS.forEach(s=>{ if(typeof state.skills[s.id] !== 'number') state.skills[s.id]=0; });
  const defSettings = defaultState().settings;
  if(!state.settings){ state.settings = defSettings; }
  Object.keys(defSettings).forEach(k=>{
    if(typeof defSettings[k]==='object' && defSettings[k]!==null){
      state.settings[k] = { ...defSettings[k], ...(state.settings[k]||{}) };
    } else if(state.settings[k]===undefined){ state.settings[k] = defSettings[k]; }
  });
  if(state.settings.soundVolume==null){ state.settings.soundVolume = 0.6; }
  if(!state.profile){ state.profile = { avatar:null, username:'', email:'', joinDate: state.joinDate || Date.now() }; }
  if(!state.joinDate){ state.joinDate = state.profile.joinDate || Date.now(); }
  if(!state.profile.joinDate){ state.profile.joinDate = state.joinDate; }
  if(!state.taskOrder){ state.taskOrder = state.tasks.filter(t=>!t.completed).map(t=>t.id); }
  if(!state.recurringTasks){ state.recurringTasks = []; }
  if(!state.courtCases){ state.courtCases = []; }
  if(state.courtEnabled==null){ state.courtEnabled = true; }
  if(!state.courtCaseSeq){ state.courtCaseSeq = 0; }
  if(!state.masteries){ state.masteries = {}; }
  if(!state.customMasteries){ state.customMasteries = []; }
  if(state.perfectDaysCount==null){ state.perfectDaysCount = 0; }
  if(state.streakShields==null){ state.streakShields = 0; }
  if(state.fineWaivers==null){ state.fineWaivers = 0; }
  if(!state.customQuests){ state.customQuests = []; }
  if(!state.archivedQuestIds){ state.archivedQuestIds = []; }
  if(!state.deletedQuestIds){ state.deletedQuestIds = []; }
  if(!state.questDisplayOrder){ state.questDisplayOrder = {}; }
  if(!state.questHistory){ state.questHistory = []; }
  if(!state.archivedChallengeIds){ state.archivedChallengeIds = []; }
  if(!state.challengeHistory){ state.challengeHistory = []; }
  if(!state.archivedHabitIds){ state.archivedHabitIds = []; }
  if(!state.aiMemory){ state.aiMemory = { facts: [] }; }
  if(state.settings.soundMode===undefined){ state.settings.soundMode = state.settings.soundOn===false ? 'silent' : 'immersive'; }
  if(!state.aiMemory.facts){ state.aiMemory.facts = []; }
  if(state.aiInsight===undefined){ state.aiInsight = null; }
  if(state.lastInsightGenDate===undefined){ state.lastInsightGenDate = null; }
  if(state.settings.appearance && state.settings.appearance.glowIntensity===undefined){ state.settings.appearance.glowIntensity = 130; }
  if(state.settings.appearance && !state.settings.appearance.iconStyle){ state.settings.appearance.iconStyle = 'outline'; }
  if(state.settings.appearance && !state.settings.appearance.custom){ state.settings.appearance.custom = { bg:'#0B0F17', card:'#141B28', card2:'#1B2434', text:'#F2F3F7' }; }
  if(state.settings.appearance && state.settings.appearance.brightness===undefined){ state.settings.appearance.brightness = 100; }
  if(state.settings.appearance && state.settings.appearance.warmth===undefined){ state.settings.appearance.warmth = 0; }
  if(state.settings.appearance && !state.settings.appearance.bgStyle){ state.settings.appearance.bgStyle = 'none'; }
  if(state.settings.appearance && state.settings.appearance.bgOpacity===undefined){ state.settings.appearance.bgOpacity = 8; }
  if(state.settings.appearance && Number(state.settings.appearance.bgOpacity)>30){ state.settings.appearance.bgOpacity = 30; }
  if(state.settings.appearance && state.settings.appearance.bgImageUrl===undefined){ state.settings.appearance.bgImageUrl = ''; }
  if(!state.learnedWords){ state.learnedWords = {}; }
  if(!state.aiCache){ state.aiCache = {}; }
  if(!state.aiCache){ state.aiCache = {}; }
  if(state.settings.home){
    if(!state.settings.home.order.includes('courtAlert')) state.settings.home.order.unshift('courtAlert');
    if(state.settings.home.visible.courtAlert===undefined) state.settings.home.visible.courtAlert = true;
    if(!state.settings.home.collapsed) state.settings.home.collapsed = {};
  }
  state.customChallenges.forEach(c=>{
    if(!c.period) c.period = 'once';
    if(!c.conditionType) c.conditionType = 'xp';
    if(!c.icon) c.icon = '🚩';
    if(c.desc==null) c.desc = 'Earn '+(c.targetXp||0)+' XP';
    if(c.archived==null) c.archived = false;
  });
  state.tasks.forEach(t=>{ if(!t.category || !CATEGORY_MAP[t.category]) t.category = localCategorize((t.title||'').toLowerCase()); });
  runDailyGeneration();
  applyAppearance();
  applyAccessibility();
  if(state.settings.privacy && state.settings.privacy.appLockEnabled && state.settings.privacy.appLockPin){
    document.getElementById('lockOverlay').classList.add('open');
  }
  render();
  setTimeout(gcalTryAutoReconnect, 400);
  if(!state.onboardingComplete){ setTimeout(openOnboarding, 350); }
  if(state.webhookUrl){
    document.getElementById('webhookUrl').value = state.webhookUrl;
    updateSyncStatus(true);
    syncNow(true);
    syncTimer = setInterval(()=>syncNow(true), 30000);
  }
}
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.error('save failed', e); } }

/* ============ Local heuristic scorer ============ */
function detectSkills(t){
  const learned = learnedSignalFor(t);
  const scored = SKILLS.map(s=>{
    const kws = SKILL_KEYWORDS[s.id] || [];
    let score = 0;
    kws.forEach(k=>{ if(hasKeyword(t,k)) score += k.length; }); // longer/more specific phrases count more
    score += (learned.skillScores[s.id]||0) * 4;
    return { skill: s.id, score };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!scored.length) return [{ skill:'productivity', score:1 }];
  const top = scored[0].score;
  // keep other categories only if they're a genuinely strong secondary match, not noise
  return scored.filter(x=>x.score >= top*0.35).slice(0,3);
}
function parseDurationMinutes(t){
  const m = t.match(DURATION_RE);
  if(m){
    const n = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    return unit[0]==='h' ? n*60 : n;
  }
  for(const w of WORD_DURATION_MAP){ if(w.re.test(t)) return w.minutes; }
  return null;
}
function localScoreTask(title){
  const t = (title||'').toLowerCase();
  const matches = detectSkills(t);
  let difficulty = 'moderate';
  const levelMatch = t.match(LEVEL_RE);
  const minutes = parseDurationMinutes(t);

  if(levelMatch){
    const lvl = parseInt(levelMatch[1],10);
    difficulty = lvl<=2 ? 'low' : lvl>=5 ? 'high' : 'moderate';
  } else if(HIGH_EFFORT_WORDS.some(w=>t.includes(w)) || title.length>55){
    difficulty = 'high';
  } else if(LOW_EFFORT_WORDS.some(w=>t.includes(w))){
    difficulty = 'low';
  } else if(minutes!=null){
    difficulty = minutes<=15 ? 'low' : minutes>=60 ? 'high' : 'moderate';
  }

  let xp = difficulty==='low' ? 25 : difficulty==='high' ? 170 : 75;
  if(minutes!=null){
    // nudge within the difficulty band based on actual stated duration, capped so it can't runaway
    const scaled = Math.round(minutes * 1.8);
    xp = Math.round((xp + Math.max(15, Math.min(240, scaled))) / 2);
  }
  if(matches.length>=2){ xp = Math.round(xp * 1.12); } // compound tasks touching 2+ skills are genuinely more valuable
  const learned = learnedSignalFor(t);
  if(learned.avgLearnedXp!=null){
    // blend toward what real AI answers for similar words actually looked like, without letting one outlier swing it
    xp = Math.round(xp*0.6 + Math.min(220, Math.max(10, learned.avgLearnedXp))*0.4);
  }
  const coins = Math.round(xp/6);
  const totalScore = matches.reduce((s,m)=>s+m.score,0);
  const skillGains = matches.map(m=>({ skill:m.skill, xp: Math.max(1, Math.round(xp*(m.score/totalScore))) }));
  const roundedSum = skillGains.reduce((s,g)=>s+g.xp,0);
  skillGains[0].xp += (xp - roundedSum); // keep the total exact
  const category = localCategorize(t);
  const tags = localSmartTags(t, category, skillGains.map(g=>g.skill));
  return { difficulty, xp, coins, skillGains, skill: skillGains[0].skill, category, tags };
}
function pickLocalNotification(difficulty){
  const arr = LOCAL_NOTIFS[difficulty] || LOCAL_NOTIFS.moderate;
  return arr[Math.floor(Math.random()*arr.length)];
}
function localResolve(task){
  const cached = getCachedTaskScore(task.title);
  if(cached){
    const r = JSON.parse(JSON.stringify(cached.result));
    r.active_buffs = null;
    r._fromCache = true;
    return aiResultToReward(r, task.title);
  }
  const sc = localScoreTask(task.title);
  return { xp:sc.xp, coins:sc.coins, skillGains:sc.skillGains, difficulty:sc.difficulty, category:sc.category, tags:sc.tags, notification: pickLocalNotification(sc.difficulty), buff:null, source:'local' };
}

/* ============ Quick Add (parse & create) ============ */
function parseQuickAddText(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const cleaned = lines.map(l=> l.replace(/^([-*•●▪]|\d+[\.\)]|\[\s?\]|\[x\]|☐|☑)\s*/i,'').trim()).filter(Boolean);
  return cleaned.length ? cleaned : (text.trim() ? [text.trim()] : []);
}
let qaState = { due:null, recurrence:'none', tag:null, reminderLeadDays:null };
let qaItems = [];
let qaAnalyses = [];
function openQuickAdd(){
  document.getElementById('quickAddText').value = '';
  document.getElementById('quickAddPreview').innerHTML = '';
  document.getElementById('qaLocalHints').innerHTML = '';
  document.getElementById('qaAiSuggestions').innerHTML = '';
  qaState = { due:null, recurrence:'none', tag:null, reminderLeadDays:null };
  qaItems = []; qaAnalyses = [];
  document.querySelectorAll('#qaChips .qa-chip').forEach(b=>b.classList.remove('active','has-value'));
  document.getElementById('qaDateInput').value = '';
  document.getElementById('qaReminderSelect').value = '0';
  renderQaEnhanceButton();
  const bdLink = document.getElementById('qaBrainDumpLink');
  if(bdLink) bdLink.style.display = hasAiKey() ? '' : 'none';
  document.getElementById('quickAddModalBack').classList.add('open');
  setTimeout(()=> document.getElementById('quickAddText').focus(), 80);
}
function renderQaEnhanceButton(){
  const wrap = document.getElementById('qaAiEnhanceWrap');
  if(!wrap) return;
  wrap.innerHTML = hasAiKey() ? '<button type="button" class="qa-enhance-btn" id="qaEnhanceBtn" onclick="enhanceQuickAdd()">✨ Let AI check these before adding</button>' : '';
}
function toggleQaChip(el){
  const k = el.dataset.k, v = el.dataset.v;
  const isActive = el.classList.contains('active');
  document.querySelectorAll('#qaChips .qa-chip[data-k="'+k+'"]').forEach(b=>b.classList.remove('active'));
  if(isActive){ qaState[k] = (k==='recurrence') ? 'none' : null; }
  else{ el.classList.add('active'); qaState[k] = v; }
  if(k==='due'){ const inp=document.getElementById('qaDateInput'); if(inp){ inp.value=''; inp.parentElement.classList.remove('has-value'); } }
}
function setQaSpecificDate(val){
  const wrap = document.getElementById('qaDateInput').parentElement;
  if(!val){ wrap.classList.remove('has-value'); return; }
  document.querySelectorAll('#qaChips .qa-chip[data-k="due"]').forEach(b=>b.classList.remove('active'));
  qaState.due = val;
  wrap.classList.add('has-value');
}
function setQaReminderDays(val){
  const n = parseInt(val,10) || 0;
  qaState.reminderLeadDays = n || null;
  document.getElementById('qaReminderSelect').parentElement.classList.toggle('has-value', n>0);
}
document.addEventListener('input', e=>{
  if(e.target && e.target.id==='quickAddText'){
    const items = parseQuickAddText(e.target.value);
    const preview = document.getElementById('quickAddPreview');
    if(items.length<=1){ preview.innerHTML=''; } else {
      preview.innerHTML = items.map(it=>{
        const sc = localScoreTask(it);
        return '<div class="qa-preview-row"><span>'+escapeHtml(it)+'</span><span>~'+sc.xp+' XP</span></div>';
      }).join('');
    }
    const hintsWrap = document.getElementById('qaLocalHints');
    if(hintsWrap){
      const hints = [];
      if(items.length){
        const recurs = items.map(detectLocalRecurrence).filter(r=>r!=='none');
        if(recurs.length && qaState.recurrence==='none'){
          hints.push('🔁 Sounds recurring — tap <b>Daily</b>/<b>Weekly</b> above to repeat it automatically.');
        }
        const vague = items.filter(isVagueTitle);
        if(vague.length){
          hints.push('💭 "'+escapeHtml(vague[0])+'" is pretty broad — more specific titles score better and are easier to plan around.');
        }
      }
      hintsWrap.innerHTML = hints.map(h=>'<div class="qa-local-hint">'+h+'</div>').join('');
    }
    if(qaAnalyses.length && JSON.stringify(items)!==JSON.stringify(qaItems)){
      qaItems = []; qaAnalyses = [];
      document.getElementById('qaAiSuggestions').innerHTML = '';
      renderQaEnhanceButton();
    }
  }
});
function submitQuickAdd(){
  const raw = document.getElementById('quickAddText').value;
  const items = parseQuickAddText(raw);
  if(!items.length) return;
  const noGoalYet = !state.tasks.some(t=>!t.completed && t.starredGoal);
  let dueDate = qaState.due==='today' ? todayISO() : qaState.due==='tomorrow' ? tomorrowISO() : (/^\d{4}-\d{2}-\d{2}$/.test(qaState.due||'') ? qaState.due : null);
  items.forEach((title,i)=>{
    let templateId = null;
    let taskDue = dueDate;
    if(qaState.recurrence !== 'none'){
      const tpl = { id:'rt'+Date.now().toString(36)+i, title, recurrence:qaState.recurrence, weekday:new Date().getDay(), createdAt:Date.now() };
      state.recurringTasks.push(tpl);
      templateId = tpl.id;
      taskDue = taskDue || todayISO();
    }
    const t = makeTaskFromTitle(title, { starredGoal:(noGoalYet && i===0), dueDate:taskDue, tag:qaState.tag, recurringTemplateId:templateId, reminderLeadDays: taskDue ? qaState.reminderLeadDays : null });
    state.tasks.push(t); state.taskOrder.push(t.id);
    maybeGoogleSync(t);
  });
  saveState(); render();
  closeModal('quickAddModalBack');
  showToast(items.length>1 ? '+'+items.length+' tasks added' : 'Task added');
}

/* ============ Task Intelligence (AI recognition on Quick Add) ============
   Looks at what the user typed and recognises type, priority, whether the
   wording could be clearer, and whether a task is really several tasks in
   one. Suggestions are shown, never auto-applied — the user taps to accept. */
function buildQuickAddIntelligencePrompt(items){
  return `${AI_TONE_PREAMBLE}

You are the task-recognition layer inside LifeXP. The user is about to add these task(s). For EACH one, recognise what it really is and whether anything about it could be improved before it's saved. Don't invent problems — most tasks are fine as-is; only flag genuinely useful improvements.

What you remember about this user:
${buildMemoryContext()}

Tasks (in order): ${JSON.stringify(items)}

For each task, decide:
- type: one of task, habit, goal, project, event, reminder, chore
- priority: one of critical, high, medium, low, someday
- looks_recurring: true only if the wording itself implies repetition (e.g. "daily", "every morning", "weekly") — not a guess
- better_title: a clearer/more specific rewording, ONLY if the original is genuinely vague or awkward (e.g. "do the thing" or "stuff for school"). Otherwise null — don't rewrite titles that are already clear.
- subtasks: an array of 2-5 smaller task strings, ONLY if the task is clearly too large/broad for one sitting (e.g. "revise for finals", "plan the trip"). Otherwise an empty array.

Respond with STRICT JSON ONLY, no markdown fences:
{ "items": [ { "type":"string", "priority":"string", "looks_recurring":boolean, "better_title":"string|null", "subtasks":["string"] } ] }`;
}
async function enhanceQuickAdd(){
  const raw = document.getElementById('quickAddText').value;
  const items = parseQuickAddText(raw);
  if(!items.length) return;
  const btn = document.getElementById('qaEnhanceBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Thinking…'; }
  try{
    const r = await callAiJson(buildQuickAddIntelligencePrompt(items), 900);
    const analyses = Array.isArray(r.items) ? r.items : [];
    qaItems = items.slice();
    qaAnalyses = items.map((it,i)=> analyses[i] || null);
    renderQaSuggestions();
  }catch(e){
    showToast('AI check failed — try again');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = '✨ Let AI check these before adding'; }
  }
}
function renderQaSuggestions(){
  const wrap = document.getElementById('qaAiSuggestions');
  if(!wrap) return;
  if(!qaItems.length){ wrap.innerHTML=''; return; }
  wrap.innerHTML = qaItems.map((title,i)=>{
    const a = qaAnalyses[i];
    if(!a) return '';
    const badges = [a.type, a.priority].filter(Boolean).map(b=>'<span class="qa-sugg-badge">'+escapeHtml(b)+'</span>').join('');
    const actions = [];
    if(a.better_title && a.better_title.trim() && a.better_title.trim()!==title){
      actions.push('<button type="button" class="qa-sugg-action" onclick="applyQaBetterTitle('+i+')">Use: "'+escapeHtml(a.better_title.trim().slice(0,40))+'"</button>');
    }
    if(Array.isArray(a.subtasks) && a.subtasks.length>1){
      actions.push('<button type="button" class="qa-sugg-action" onclick="applyQaSplit('+i+')">Split into '+a.subtasks.length+' tasks</button>');
    }
    const recurNote = a.looks_recurring ? '<div class="qa-sugg-note">Looks recurring — try a 🔁 chip above</div>' : '';
    return '<div class="qa-sugg-card"><div class="qa-sugg-title">'+escapeHtml(title)+'</div>' +
      '<div class="qa-sugg-badges">'+badges+'</div>' +
      (actions.length ? '<div class="qa-sugg-actions">'+actions.join('')+'</div>' : '') +
      recurNote + '</div>';
  }).join('');
}
function syncQaTextareaFromItems(){
  document.getElementById('quickAddText').value = qaItems.join('\n');
  document.getElementById('quickAddText').dispatchEvent(new Event('input'));
}
function applyQaBetterTitle(i){
  const a = qaAnalyses[i];
  if(!a || !a.better_title) return;
  qaItems[i] = a.better_title.trim();
  syncQaTextareaFromItems();
  renderQaSuggestions();
}
function applyQaSplit(i){
  const a = qaAnalyses[i];
  if(!a || !Array.isArray(a.subtasks) || a.subtasks.length<2) return;
  qaItems.splice(i, 1, ...a.subtasks);
  qaAnalyses.splice(i, 1, ...a.subtasks.map(()=>null));
  syncQaTextareaFromItems();
  renderQaSuggestions();
}

/* ============ Goal Extraction (Brain Dump) ============
   For messy, multi-goal input ("exams soon, need to save money, want to
   lose weight..."). Instead of treating it as one task, or asking Gemini
   to plan everything in a single opaque step, this does its own two-step
   decomposition: pull out distinct goals grouped by life area, then break
   each goal into a small ordered set of concrete first tasks. Nothing is
   added until the user reviews and taps Add Everything. */
let bdGoals = [];
function openBrainDump(){
  closeModal('quickAddModalBack');
  document.getElementById('brainDumpText').value = '';
  document.getElementById('brainDumpResults').innerHTML = '';
  bdGoals = [];
  document.getElementById('brainDumpModalBack').classList.add('open');
  setTimeout(()=> document.getElementById('brainDumpText').focus(), 80);
}
function buildGoalExtractionPrompt(text){
  const areaList = CATEGORIES.map(c=>c.id);
  return `${AI_TONE_PREAMBLE}

You are the goal-extraction layer inside LifeXP. The user just brain-dumped everything on their mind in one messy block of text — unrelated goals, worries, and to-dos all mixed together. Your job is to untangle it, not to plan every detail.

Today's date is ${todayISO()}.

Step 1 — extract distinct goals. Each genuinely separate thing the user wants to achieve or handle becomes its own goal (e.g. "exams soon" and "need to start saving" are two different goals, even mentioned in the same sentence).
Step 2 — for each goal, break it into 2-4 small, concrete first tasks — not a full plan, just realistic first steps someone could actually start on today. Order them logically (research before opening an account, revision before practice questions, etc).
Step 3 — group each goal under the life area it best fits: ${areaList.join(', ')}.
Step 4 — if the user mentioned an overall timeframe for ALL of this (e.g. "for tomorrow", "by next week", "this weekend"), work out the actual calendar date from today's date above. If no timeframe was mentioned anywhere, leave this null — never guess one.

What you remember about this user:
${buildMemoryContext()}

Brain dump: ${JSON.stringify(text)}

Respond with STRICT JSON ONLY, no markdown fences:
{
  "when": "YYYY-MM-DD, only if the user actually stated a timeframe for everything — otherwise null",
  "goals": [
    { "area": "one of: ${areaList.join(', ')}", "goal_title": "short goal name, e.g. 'Chemistry exam'", "tasks": ["concrete first task", "concrete next task"] }
  ]
}`;
}
let bdWhen = null;
async function extractGoals(){
  const text = document.getElementById('brainDumpText').value.trim();
  if(!text){ showToast('Type something first'); return; }
  if(!hasAiKey()){ showToast('Add a Gemini key in Settings first'); return; }
  const btn = document.getElementById('brainDumpExtractBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Thinking…'; }
  try{
    const r = await callAiJson(buildGoalExtractionPrompt(text), 1200);
    const rawGoals = Array.isArray(r.goals) ? r.goals : [];
    bdWhen = (typeof r.when==='string' && /^\d{4}-\d{2}-\d{2}$/.test(r.when)) ? r.when : null;
    bdGoals = rawGoals.filter(g=>g.goal_title && Array.isArray(g.tasks) && g.tasks.length).map((g,gi)=>({
      id:'bdg'+gi,
      area: CATEGORY_MAP[g.area] ? g.area : localCategorize((g.goal_title||'').toLowerCase()),
      goalTitle: g.goal_title,
      tasks: g.tasks.slice(0,6).map((t,ti)=>({ id:'bdt'+gi+'_'+ti, title:t, checked:true }))
    }));
    renderBrainDumpResults();
  }catch(e){
    showToast('Extraction failed — try again');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = '✨ Extract goals'; }
  }
}
function renderBrainDumpResults(){
  const wrap = document.getElementById('brainDumpResults');
  if(!wrap) return;
  if(!bdGoals.length){ wrap.innerHTML=''; return; }
  const byArea = {};
  bdGoals.forEach(g=>{ (byArea[g.area]=byArea[g.area]||[]).push(g); });
  const totalTasks = bdGoals.reduce((s,g)=>s+g.tasks.length,0);
  const whenLabel = bdWhen ? new Date(bdWhen+'T00:00:00').toLocaleDateString(undefined,{weekday:'long', month:'short', day:'numeric'}) : null;
  let html = '<div class="bd-summary-line">Found '+bdGoals.length+' goal'+(bdGoals.length>1?'s':'')+', '+totalTasks+' tasks'+(whenLabel?' — scheduled for '+whenLabel:'')+'. Uncheck anything you don\'t want.</div>';
  Object.keys(byArea).forEach(area=>{
    const catDef = CATEGORY_MAP[area];
    html += '<div class="bd-area-group"><div class="bd-area-title">'+(catDef?catDef.icon+' '+catDef.name:escapeHtml(area))+'</div>';
    byArea[area].forEach(g=>{
      html += '<div class="bd-goal-card"><div class="bd-goal-title">🎯 '+escapeHtml(g.goalTitle)+'</div>';
      g.tasks.forEach(t=>{
        html += '<label class="bd-task-row'+(t.checked?'':' unchecked')+'"><input type="checkbox" '+(t.checked?'checked':'')+' onchange="toggleBdTask(\''+g.id+'\',\''+t.id+'\')"><span>'+escapeHtml(t.title)+'</span></label>';
      });
      html += '</div>';
    });
    html += '</div>';
  });
  html += '<button class="bd-add-all-btn" onclick="addAllExtractedGoals()">Add Everything</button>';
  wrap.innerHTML = html;
}
function toggleBdTask(goalId, taskId){
  const g = bdGoals.find(g=>g.id===goalId); if(!g) return;
  const t = g.tasks.find(t=>t.id===taskId); if(!t) return;
  t.checked = !t.checked;
  renderBrainDumpResults();
}
function addAllExtractedGoals(){
  const noGoalYetBefore = !state.tasks.some(t=>!t.completed && t.starredGoal);
  let firstAdded = false, added = 0;
  bdGoals.forEach(g=>{
    g.tasks.filter(t=>t.checked).forEach(t=>{
      const task = makeTaskFromTitle(t.title, { projectTitle: g.goalTitle, starredGoal:(noGoalYetBefore && !firstAdded), dueDate: bdWhen || null });
      task.category = CATEGORY_MAP[g.area] ? g.area : task.category;
      state.tasks.push(task); state.taskOrder.push(task.id);
      maybeGoogleSync(task);
      firstAdded = true; added++;
    });
  });
  if(!added){ showToast('Nothing checked'); return; }
  saveState(); render();
  closeModal('brainDumpModalBack');
  showToast('+'+added+' tasks added from '+bdGoals.length+' goals'+(bdWhen?' for '+bdWhen:''));
}

/* ============ Derived stats ============ */
function totalXpAll(){ return SKILLS.reduce((s,sk)=>s+(state.skills[sk.id]||0),0); }
function totalCoinsEarned(){
  const fromTasks = state.tasks.filter(t=>t.completed).reduce((s,t)=>s+(t.coins||0),0);
  const fromEvents = state.rewardEvents.reduce((s,e)=>s+(e.coins||0),0);
  return fromTasks + fromEvents;
}
function xpSpent(){ return state.claims.filter(c=>c.type==='xp').reduce((s,c)=>s+c.cost,0); }
function coinsSpent(){ return state.claims.filter(c=>c.type==='coins').reduce((s,c)=>s+c.cost,0); }
function activeFinesTotal(){ return (state.fines||[]).filter(f=>!f.resolved).reduce((s,f)=>s+f.amount,0); }
function availableXp(){ return totalXpAll() - xpSpent(); }
function availableCoins(){ return Math.max(0, totalCoinsEarned() - coinsSpent() - activeFinesTotal()); }
function lifeStats(){ return lifeCurve(totalXpAll()); }

function todayKey(d){ return (d||new Date()).toDateString(); }
function yesterdayKey(){ const y=new Date(); y.setDate(y.getDate()-1); return y.toDateString(); }
function isoWeekKey(d){
  d = new Date(d||Date.now()); d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - ((d.getDay()+6)%7));
  const week1 = new Date(d.getFullYear(),0,4);
  const wk = 1 + Math.round(((d-week1)/86400000 - 3 + ((week1.getDay()+6)%7))/7);
  return d.getFullYear()+'-W'+wk;
}
function monthKey(d){ d=new Date(d||Date.now()); return d.getFullYear()+'-M'+(d.getMonth()+1); }
function startOfWeekTs(){ const d=new Date(); d.setHours(0,0,0,0); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.getTime(); }
function startOfMonthTs(){ const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1).getTime(); }
function startOfTodayTs(){ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
function isoDate(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

/* ============ Life Heatmap ============
   Colours each day by a Growth Score, not raw busyness — volume of tiny
   tasks doesn't outscore a smaller number of meaningful, balanced ones.
   Growth Score = XP + half of coins + a difficulty bonus + a balance
   bonus for touching multiple life skills in the same day. */
function hexToRgb(hex){
  const h = (hex||'#E8B54D').replace('#','');
  const full = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
  const n = parseInt(full,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
const DIFFICULTY_BONUS = { low:0, moderate:8, high:20 };
function computeDayGrowth(dateISO){
  const dayTasks = state.tasks.filter(t=>t.completed && t.completedAt && isoDate(new Date(t.completedAt))===dateISO);
  if(!dayTasks.length) return { score:0, xp:0, coins:0, count:0, tasks:[], skillTotals:{} };
  let xp=0, coins=0;
  const skillTotals = {};
  dayTasks.forEach(t=>{
    xp += t.xp||0; coins += t.coins||0;
    (t.skillGains||[]).forEach(g=>{ if(SKILL_MAP[g.skill]) skillTotals[g.skill] = (skillTotals[g.skill]||0) + g.xp; });
  });
  const difficultyBonus = dayTasks.reduce((s,t)=> s + (DIFFICULTY_BONUS[t.difficulty]||5), 0);
  const uniqueSkills = Object.keys(skillTotals).length;
  const balanceBonus = Math.max(0, uniqueSkills-1) * 12; // rewards spreading growth across life areas, not just volume
  const score = Math.round(xp + coins*0.5 + difficultyBonus + balanceBonus);
  return { score, xp, coins, count:dayTasks.length, tasks:dayTasks, skillTotals };
}
function todayISO(){ return isoDate(new Date()); }
function tomorrowISO(){ const d=new Date(); d.setDate(d.getDate()+1); return isoDate(d); }
function yesterdayISO(){ const d=new Date(); d.setDate(d.getDate()-1); return isoDate(d); }
function isoFromTs(ts){ return isoDate(new Date(ts)); }

function makeTaskFromTitle(title, extra){
  const sc = localScoreTask(title);
  const id = 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  return { id, title, createdAt:Date.now(), starredGoal:false, completed:false, completedAt:null,
    estXp:sc.xp, estCoins:sc.coins, estSkill:sc.skill, estSkillGains:sc.skillGains,
    xp:0, coins:0, skillGains:[], dueDate:null, tag:null, recurringTemplateId:null, missedCount:0,
    reminderLeadDays:null, lastReminderNotifiedDate:null, overdueCaseOpened:false,
    category: sc.category, tags: sc.tags, ...extra };
}

function runDailyGeneration(){
  const today = todayISO();
  if(state.lastGeneratedDate === today) return;
  const isFirstRunEver = !state.lastGeneratedDate;
  let added = 0, rolled = 0;
  const calPrefs = state.settings.calendar || {};

  if(calPrefs.autoSchedule!==false){
    state.recurringTasks.forEach(tpl=>{
      const applies = tpl.recurrence==='daily' || (tpl.recurrence==='weekly' && new Date().getDay()===tpl.weekday);
      if(!applies) return;
      const already = state.tasks.some(t=>t.recurringTemplateId===tpl.id && t.dueDate===today);
      if(already) return;
      const t = makeTaskFromTitle(tpl.title, { dueDate: today, recurringTemplateId: tpl.id });
      state.tasks.push(t); state.taskOrder.push(t.id);
      maybeGoogleSync(t);
      added++;
    });
  }

  if(!isFirstRunEver && calPrefs.autoMoveMissed!==false){
    const yesterday = yesterdayISO();
    const dueYesterday = state.tasks.filter(t=>t.dueDate===yesterday);
    const anyMissedYesterday = dueYesterday.some(t=>!t.completed);
    const completedYesterday = state.tasks.some(t=>t.completed && isoFromTs(t.completedAt)===yesterday);
    if(!anyMissedYesterday && completedYesterday){ state.perfectDaysCount = (state.perfectDaysCount||0)+1; }
    state.tasks.forEach(t=>{
      if(!t.completed && t.dueDate===yesterday){ t.dueDate = today; t.rolledOver = true; t.missedCount = (t.missedCount||0)+1; rolled++; }
    });
  }

  if(added>0 || rolled>0){
    let msg = "Today's list prepared";
    const bits = [];
    if(added) bits.push(added+' recurring');
    if(rolled) bits.push(rolled+' rolled over');
    if(bits.length) msg += ' — '+bits.join(', ');
    logTimelineEvent('system', msg, 0, 0);
  }
  state.lastGeneratedDate = today;
  saveState();
  if(!isFirstRunEver) runCourtCheck(false);
}


function completedTasks(){ return state.tasks.filter(t=>t.completed); }
function xpInPeriod(fromTs){ return completedTasks().filter(t=>t.completedAt>=fromTs).reduce((s,t)=>s+t.xp,0); }
function todayXp(){ return xpInPeriod(startOfTodayTs()); }
function skillXpToday(skillId){
  const start = startOfTodayTs(); let sum=0;
  completedTasks().forEach(t=>{ if(t.completedAt>=start){ (t.skillGains||[]).forEach(g=>{ if(g.skill===skillId) sum+=g.xp; }); } });
  return sum;
}

function questPoolForToday(){
  const dow = new Date().getDay();
  const builtins = QUEST_POOL.filter(q=>!state.archivedQuestIds.includes(q.id) && !state.deletedQuestIds.includes(q.id));
  const customs = state.customQuests.filter(q=>!q.archived && !state.archivedQuestIds.includes(q.id) &&
    (q.schedule==null || q.schedule==='daily' || q.schedule===dow));
  return builtins.concat(customs.map(q=>({...q, custom:true})));
}
function todaysQuests(){
  const dateStr = todayKey();
  const pool = questPoolForToday();
  let s=0; for(let i=0;i<dateStr.length;i++) s=(s*31+dateStr.charCodeAt(i))|0; s=Math.abs(s);
  const idx = pool.map((_,i)=>i); let seed=s;
  function rnd(){ seed=(seed*9301+49297)%233280; return seed/233280; }
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  const count = Math.min(pool.length, (state.extraQuestDate===todayISO()) ? 4 : 3);
  let picked = idx.slice(0,count).map(i=>({ ...pool[i], key: pool[i].id+'|'+todayISO() }));
  const order = state.questDisplayOrder[todayISO()];
  if(order && order.length){
    picked.sort((a,b)=>{
      const ai = order.indexOf(a.key), bi = order.indexOf(b.key);
      return (ai<0?999:ai) - (bi<0?999:bi);
    });
  }
  return picked;
}
function reorderTodayQuest(fromKey, toKey){
  const today = todayISO();
  const current = todaysQuests().map(q=>q.key);
  const order = (state.questDisplayOrder[today] && state.questDisplayOrder[today].length) ? state.questDisplayOrder[today].slice() : current.slice();
  current.forEach(k=>{ if(!order.includes(k)) order.push(k); });
  const from = order.indexOf(fromKey), to = order.indexOf(toKey);
  if(from<0 || to<0) return;
  order.splice(from,1); order.splice(to,0,fromKey);
  state.questDisplayOrder[today] = order;
  saveState(); renderQuests();
}

function getStats(){
  const skillLevels = {}; SKILLS.forEach(sk=> skillLevels[sk.id] = skillCurve(state.skills[sk.id]||0).level);
  const byDay = {};
  completedTasks().forEach(t=>{ const k=todayKey(new Date(t.completedAt)); byDay[k]=(byDay[k]||0)+1; });
  const maxTasksInDay = Object.values(byDay).reduce((m,v)=>Math.max(m,v),0);
  const hasNightOwl = completedTasks().some(t=>{ const h=new Date(t.completedAt).getHours(); return h>=0 && h<4; });
  const hasEarlyBird = completedTasks().some(t=>new Date(t.completedAt).getHours()<6);
  return {
    totalEntries: completedTasks().length, totalXp: totalXpAll(), totalCoinsEarned: totalCoinsEarned(),
    life: lifeStats(), streak: state.streak, skillLevels,
    questsClaimed: Object.keys(state.questClaims).length, challengesClaimed: Object.keys(state.challengeClaims).length,
    rewardsClaimed: state.claims.length, maxTasksInDay, hasNightOwl, hasEarlyBird
  };
}
function strongestSkillTitle(){
  let best = SKILLS[0], bestXp = -1;
  SKILLS.forEach(s=>{ const xp = state.skills[s.id]||0; if(xp>bestXp){ bestXp=xp; best=s; } });
  const levelsAtOrAbove3 = SKILLS.filter(s=>skillCurve(state.skills[s.id]||0).level>=3).length;
  const secondBest = SKILLS.filter(s=>s.id!==best.id).reduce((m,s)=>Math.max(m, state.skills[s.id]||0), 0);
  if(bestXp>0 && secondBest > bestXp*0.75 && levelsAtOrAbove3>=4) return 'Polymath';
  if(bestXp<=0) return 'Beginner';
  return best.title;
}

/* ============ Streak ============ */
const TIMELINE_ICONS = { task:'✅', achievement:'🏆', mastery:'🏅', quest:'🧭', challenge:'🚩', levelup:'⭐', reward_claim:'🎁', fine:'⚠️', fine_cleared:'✔️', system:'🌅', court_case:'⚖️', court_resolved:'✔️' };
function logTimelineEvent(type, title, xp, coins, ts){
  state.timeline.unshift({ id:'tl'+Date.now().toString(36)+Math.random().toString(36).slice(2,5), type, title, xp:xp||0, coins:coins||0, ts: ts||Date.now() });
  if(state.timeline.length > 600) state.timeline.length = 600;
}
function bumpStreak(){
  const t = todayKey();
  if(state.streak.last === t) return;
  const y = yesterdayKey();
  if(state.streak.last === y){
    state.streak.current += 1;
  } else if(state.streak.last && state.streakShields>0){
    state.streakShields -= 1;
    state.streak.current += 1;
    showToast('🛡️ Streak Shield used — streak protected', 'teal');
  } else {
    state.streak.current = 1;
  }
  state.streak.last = t;
  state.streak.longest = Math.max(state.streak.longest||0, state.streak.current);
}
function allMasteryDefs(){
  const custom = (state.customMasteries||[]).map(c=>({
    id:c.id, category:'custom', icon:c.icon||'📝', name:c.name, desc:c.desc||'', skills:c.skills||[],
    milestones:c.milestones, custom:true, compute:()=> c.completions||0
  }));
  return MASTERIES.map(m=>({...m, milestones: MASTERY_SCALES[m.scale]})).concat(custom);
}
function masteryRecord(id){
  if(!state.masteries[id]) state.masteries[id] = { claimedTiers:[], history:[] };
  return state.masteries[id];
}
function masteryTierIndex(def, value){
  let idx = -1;
  def.milestones.forEach((m,i)=>{ if(value>=m) idx=i; });
  return idx; // -1 = not yet Bronze
}
function grantGameplayBonus(type){
  const now = Date.now();
  if(type==='xp2x_2h') state.activeBuffs.push({type:'xp2x', expiresAt: now+2*3600000});
  else if(type==='coins2x_2h') state.activeBuffs.push({type:'coins2x', expiresAt: now+2*3600000});
  else if(type==='streak_shield') state.streakShields = (state.streakShields||0)+1;
  else if(type==='fine_waiver') state.fineWaivers = (state.fineWaivers||0)+1;
  else if(type==='extra_quest') state.extraQuestDate = todayISO();
  else if(type==='mystery_chest'){
    const coins = 50+Math.floor(Math.random()*250), xp = 30+Math.floor(Math.random()*120);
    const weakest = SKILLS.reduce((min,s)=> (state.skills[s.id]||0) < (state.skills[min.id]||0) ? s : min, SKILLS[0]);
    state.skills[weakest.id] = (state.skills[weakest.id]||0)+xp;
    state.rewardEvents.push({ id:'mc'+now, label:'Mystery Chest', coins, ts:now });
    logTimelineEvent('reward_claim', 'Mystery Chest opened', xp, coins);
  } else if(type==='free_token' && state.rewards.length){
    const r = state.rewards[Math.floor(Math.random()*state.rewards.length)];
    state.claims.unshift({ id:'c'+now+Math.random().toString(36).slice(2,6), rewardId:r.id, rewardName:r.name+' (free token)', cost:0, type:r.type, ts:now });
    logTimelineEvent('reward_claim', r.name+' — free token', 0, 0);
  }
  return type;
}
const BONUS_LABELS = {
  xp2x_2h:'⚡ 2× XP for 2 hours', coins2x_2h:'🪙 2× Coins for 2 hours', streak_shield:'🛡️ Streak Shield earned',
  fine_waiver:'🕊️ Fine Waiver earned', extra_quest:'🧭 Extra Daily Mission unlocked', mystery_chest:'🎁 Mystery Chest opened', free_token:'🎟️ Free Reward Token earned'
};
function checkMasteries(){
  const showPopups = state.settings.gamification ? state.settings.gamification.achievementPopups!==false : true;
  const animOn = state.settings.animations ? state.settings.animations.achievementAnim!==false : true;
  let bestTierUp = null;
  allMasteryDefs().forEach(def=>{
    const value = def.compute();
    const rec = masteryRecord(def.id);
    const tierIdx = masteryTierIndex(def, value);
    for(let i=0;i<=tierIdx;i++){
      if(!rec.claimedTiers.includes(i)){
        rec.claimedTiers.push(i);
        rec.history.unshift({ tier:i, ts:Date.now() });
        rec.history = rec.history.slice(0,20);
        const reward = TIER_REWARDS[i];
        (def.skills.length?def.skills:['productivity']).forEach((sk,si)=>{
          if(SKILL_MAP[sk]) state.skills[sk] = (state.skills[sk]||0) + Math.round(reward.xp / (def.skills.length||1));
        });
        state.rewardEvents.push({ id:'mt'+Date.now()+i, label:def.name+' — '+MASTERY_TIERS[i], coins:reward.coins, ts:Date.now() });
        let bonusType = null;
        if(reward.bonus) bonusType = grantGameplayBonus(GAMEPLAY_BONUS_POOL[Math.floor(Math.random()*GAMEPLAY_BONUS_POOL.length)]);
        logTimelineEvent('mastery', def.name+' reached '+MASTERY_TIERS[i], reward.xp, reward.coins);
        if(showPopups && animOn && (!bestTierUp || i>bestTierUp.tier)){
          bestTierUp = { def, tier:i, reward, bonusType, celebration: !!reward.celebration };
        }
      }
    }
  });
  saveState();
  if(bestTierUp){
    setTimeout(()=>{
      if(bestTierUp.celebration){ triggerMasteryCelebration(bestTierUp); }
      else {
        showToast(bestTierUp.def.icon+' '+bestTierUp.def.name+' → '+MASTERY_TIERS[bestTierUp.tier], 'gold');
        playTone('achievement'); vibrate([20,40,20]);
      }
      if(bestTierUp.bonusType){ setTimeout(()=> showToast(BONUS_LABELS[bestTierUp.bonusType]||'Bonus earned', 'teal'), bestTierUp.celebration?400:900); }
    }, 900);
  }
}
function triggerMasteryCelebration(info){
  document.getElementById('celebrateLevelNum').textContent = info.def.icon;
  document.getElementById('celebrateTitle').textContent = info.def.name+' — '+MASTERY_TIERS[info.tier];
  const anim = state.settings.animations || {};
  if(anim.confetti!==false) spawnConfetti();
  document.getElementById('celebrateOverlay').classList.add('open');
  playTone('levelup'); vibrate([30,60,30,60,80]);
}

/* ============ AI Orchestrator (invisible) ============ */
/* ============ AI Behavior & Memory (shared across all AI calls) ============
   Golden rules the AI follows everywhere: understand intent before acting,
   reward growth not time, automate repetitive work but never personal
   choices without permission, keep responses short and honest, ask only
   when it materially helps. Memory is a short rolling list of facts about
   the user's routines/preferences, fed into every prompt so the AI's
   recognition improves over time without re-explaining context each call. */
const AI_TONE_PREAMBLE = `You are calm, supportive, honest, and efficient — never childish, never overly excited, never robotic. Keep any written text short, useful, and specific to this person, not generic. If you're not confident about something, say so plainly rather than guessing.`;
function buildMemoryContext(){
  const facts = (state.aiMemory && state.aiMemory.facts) || [];
  if(!facts.length) return 'No stored memory yet.';
  return facts.slice(-12).map(f=>'- '+f).join('\n');
}
function rememberFact(fact){
  if(!fact || typeof fact!=='string') return;
  if(!state.aiMemory) state.aiMemory = { facts: [] };
  const f = fact.trim().slice(0,140);
  if(!f) return;
  state.aiMemory.facts = state.aiMemory.facts.filter(x=>x.toLowerCase()!==f.toLowerCase());
  state.aiMemory.facts.push(f);
  if(state.aiMemory.facts.length>20) state.aiMemory.facts = state.aiMemory.facts.slice(-20);
}
function buildSingleTaskPrompt(title){
  const skillList = SKILLS.map(s=>s.id);
  const categoryList = CATEGORIES.map(c=>c.id);
  const skillDefsBlock = SKILLS.map(s=>`- ${s.id} (${s.name}): ${SKILL_DEFINITIONS[s.id]}`).join('\n');
  const skillLevels = {}; SKILLS.forEach(s=> skillLevels[s.id] = skillCurve(state.skills[s.id]||0).level);
  const buffs = (state.activeBuffs||[]).filter(b=>b.expiresAt>Date.now()).map(b=>({ type:b.type, expires_in_min: Math.round((b.expiresAt-Date.now())/60000) }));
  const userStats = { life_level: lifeStats().level, coins: availableCoins(), streak_days: state.streak.current, skill_levels: skillLevels, active_buffs: buffs };

  return `${AI_TONE_PREAMBLE}

You are the ScholarPulse Orchestrator embedded in LifeXP, a task manager with an invisible RPG progression layer. The user just checked off one task. You have broad real-world knowledge — use it. Don't just pattern-match on surface words; understand what the task actually involves and reason like a thoughtful, well-informed coach who has seen thousands of real tasks before.

What you remember about this user so far (use it to recognise routines/preferences, don't restate it back to them):
${buildMemoryContext()}

Task title (this is ALL the user typed — infer everything else): ${JSON.stringify(title)}
User Stats: ${JSON.stringify(userStats)}

MOST IMPORTANT RULE: Never try to find the single best category for a task. Instead, determine every meaningful way the task contributes to the user's growth. Real-world tasks almost always improve multiple skills simultaneously. Category is only used for organising the task list — it plays no role in deciding skills or XP.

Don't think like a classifier ("which bucket does this go in?"). Think like this instead, in order:

1. INTENT — what is the user actually trying to achieve by doing this? Not what words are in the title — what's the underlying goal. "Take a break with friends" isn't a scheduling event, it's someone deliberately choosing rest and connection over grinding.
2. POSITIVE OUTCOMES — given that intent, what genuinely good things does completing this task produce? For "take a break with friends": reduced stress, social connection, a healthier relationship with work. List these before touching skills — they're what skills should be scored against.
3. SKILLS IMPROVED — go through every skill definition below and ask "does this task's positive outcomes genuinely match this skill's definition, and how strongly?" Assign each skill an internal confidence from 0-100% based on that match. Skill definitions (use these as the real standard, not vibes):
${skillDefsBlock}
Only keep skills where your confidence is 35% or higher — this stops trivial or unrelated skills getting forced onto a task just to look thorough. Split the XP across the kept skills roughly in proportion to their confidence. Most tasks genuinely land on 1-3 skills; don't pad, and don't undersell a task that truly spans multiple (e.g. "take a break with friends" should hit both Wellbeing and Relationships hard, and might touch Discipline lightly if it followed a healthy routine — but Productivity or Finance would score near 0% and should be dropped entirely).
4. DIFFICULTY — Low (chores, simple admin): 0.5x; Moderate (routine study/work, review): 1.0x; High (complex problem-solving, essays, intense exercise, deep revision): 1.5x-2.0x. Weigh any duration mentioned (e.g. "45 min", "2 hours") and any explicit level/intensity language (e.g. "Level 3", "advanced", "beginner", "quick") heavily. Also weigh what you know about the activity itself: a "beginner 5K" and an "ultramarathon" both say "run" but are wildly different loads.
5. REWARDS — trivial ~15-35 XP, moderate ~50-100 XP, high-effort ~120-250 XP, before adjustment. Coins ≈ XP/6, rounded. Apply a 10-25% bonus if active_buffs are present.
6. PRIMARY CATEGORY (organisational only, decided last, doesn't influence anything above) — exactly one of ${categoryList.join(', ')}.
7. SMART TAGS — 3-6 short, natural, searchable tags a person might use to search for this task later. Specific to the task's actual subject matter, not generic restatements of category/skill names — e.g. "Open a savings account" → Money, Savings, Bank, Adulting, Financial Literacy, Future.
8. Estimate exam_weight (low/medium/high — how much this matters for exams/deadlines) and a one-phrase life_balance_impact, for internal tracking only.
9. Only set active_buffs.type to a short non-null label when this task is an unusually strong or consistent effort worth a temporary boost (duration_hours 12-48). Otherwise null/0. Buffs should feel rare and earned.

Philosophy: encouragement over strict accuracy, but never inflate trivial tasks — honesty keeps the system trustworthy. Your classifications should feel like they came from someone who actually understood the task and its outcomes, not someone who ran a keyword scan.

Respond with STRICT JSON ONLY, no markdown fences, no commentary:
{
  "analysis": { "intent": "one sentence: what the user is actually trying to achieve", "positive_outcomes": ["short phrase", "short phrase"], "category": "one of: ${categoryList.join(', ')}", "difficulty": "low | moderate | high", "multiplier_applied": float, "exam_weight": "low | medium | high", "life_balance_impact": "string", "reasoning": "one or two sentences on why these specific skills were chosen" },
  "rewards": { "xp_earned": integer, "coins_earned": integer },
  "skill_gains": [ { "skill": "one of: ${skillList.join(', ')}", "confidence": float (0-1), "xp": integer } ],
  "tags": [ "3-6 short freeform searchable tags as strings, specific to this task's subject matter" ],
  "active_buffs": { "type": "string | null", "duration_hours": integer },
  "memory_note": "string | null — ONLY if this task reveals a genuinely reusable routine or preference worth remembering (a recurring habit, a subject they study, a workout style). Otherwise null. Under 12 words, factual.",
  "notification": "a short, warm, coach-style line reacting to this specific task"
}
Only include skill_gains entries with confidence >= 0.35 — omit the rest rather than including them at 0.`;
}
/* ============ AI provider layer ============
   Two supported providers: Gemini (free tier, preferred when a key is set)
   and Anthropic (paid). Both get the exact same prompts — only the
   transport/response-shape differs. If a Gemini key is present it's used
   first since it's free; Anthropic is the fallback/alternative. */
async function callGeminiRaw(prompt, maxTokens){
  const model = 'gemini-2.5-flash';
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+encodeURIComponent(state.geminiApiKey), {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      contents: [{ role:'user', parts:[{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } }
    })
  });
  if(!res.ok){ const body = await res.text().catch(()=>''); throw new Error('Gemini API error '+res.status+(body?': '+body.slice(0,200):'')); }
  const data = await res.json();
  const cand = (data.candidates||[])[0];
  if(!cand) throw new Error('Gemini: no candidates — '+(data.promptFeedback ? JSON.stringify(data.promptFeedback).slice(0,150) : 'empty response'));
  const text = cand.content && cand.content.parts ? cand.content.parts.map(p=>p.text||'').join('') : '';
  if(!text){
    if(cand.finishReason==='MAX_TOKENS') throw new Error('Gemini: hit token limit before producing output — retry with a larger budget');
    if(cand.finishReason==='SAFETY') throw new Error('Gemini: response blocked by safety filters');
    throw new Error('Gemini: empty response (finishReason: '+(cand.finishReason||'unknown')+')');
  }
  return text;
}
function hasAiKey(){ return !!state.geminiApiKey; }
async function testAiConnection(){
  const dot = document.getElementById('aiTestDot');
  const text = document.getElementById('aiTestStatusText');
  const btn = document.getElementById('aiTestBtn');
  const gKey = document.getElementById('geminiApiKeyInput').value.trim();
  if(!gKey){ dot.classList.remove('on'); text.textContent = 'No key entered — using built-in estimate'; return; }
  dot.classList.remove('on');
  text.textContent = 'Testing…';
  btn.disabled = true;
  try{
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(gKey), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{role:'user',parts:[{text:'Reply with the single word: ok'}]}], generationConfig:{maxOutputTokens:30, thinkingConfig:{thinkingBudget:0}} })
    });
    if(!res.ok){ const body = await res.text().catch(()=> ''); throw new Error('Gemini '+res.status+(body?': '+body.slice(0,150):'')); }
    const data = await res.json();
    const cand = (data.candidates||[])[0];
    const replyText = cand && cand.content && cand.content.parts ? cand.content.parts.map(p=>p.text||'').join('') : '';
    if(!replyText) throw new Error('Gemini responded but sent no text (finishReason: '+(cand&&cand.finishReason||'unknown')+')');
    dot.classList.add('on'); text.textContent = 'Gemini key works ✓';
  }catch(e){
    dot.classList.remove('on'); text.textContent = 'Failed — '+(e.message||'network/CORS error');
  }finally{
    btn.disabled = false;
  }
}
async function callAiJson(prompt, maxTokens){
  const text = await callGeminiRaw(prompt, maxTokens);
  return JSON.parse(text.replace(/```json|```/g,'').trim());
}
/* ---- Response cache. Same task title -> same AI classification is
   pure waste to re-fetch every time (recurring habits especially: "Gym",
   "Fold washing" repeat verbatim constantly). Cache the raw AI result per
   normalized title, capped and LRU-evicted, so repeats cost nothing. ---- */
const AI_CACHE_MAX = 300;
function normalizeCacheKey(title){ return (title||'').trim().toLowerCase().replace(/\s+/g,' '); }
function getCachedTaskScore(title){
  const key = normalizeCacheKey(title);
  if(!key || !state.aiCache) return null;
  return state.aiCache[key] || null;
}
function setCachedTaskScore(title, result){
  const key = normalizeCacheKey(title);
  if(!key) return;
  if(!state.aiCache) state.aiCache = {};
  state.aiCache[key] = { result, ts: Date.now() };
  const keys = Object.keys(state.aiCache);
  if(keys.length > AI_CACHE_MAX){
    keys.sort((a,b)=> state.aiCache[a].ts - state.aiCache[b].ts);
    keys.slice(0, keys.length-AI_CACHE_MAX).forEach(k=> delete state.aiCache[k]);
  }
}
async function callScholarPulseSingle(title){
  const cached = getCachedTaskScore(title);
  if(cached){
    const r = JSON.parse(JSON.stringify(cached.result));
    r.active_buffs = null; // don't replay a buff every time a cached title repeats
    r._fromCache = true;
    return r;
  }
  const r = await callAiJson(buildSingleTaskPrompt(title), 1200);
  setCachedTaskScore(title, r);
  learnFromAiResult(title, r);
  return r;
}
/* ============ Local learning layer ============
   Every fresh, real AI answer teaches the local (free, offline) scorer a
   little — which words tend to go with which category/skill, and roughly
   what XP band they land in. Over time the local fallback stops being
   just fixed keyword lists and starts reflecting real answers you've
   actually gotten, for words the hardcoded lists never covered. */
const STOPWORDS = new Set(['the','a','an','to','for','and','or','of','in','on','at','my','me','with','about','from','into','up','out','some','this','that','it','be','do','get','go','go to','need','want','have','has','had','then','today','tomorrow','later','again']);
const LEARNED_WORDS_MAX = 600;
function significantWords(title){
  return (title||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w=> w.length>=4 && !STOPWORDS.has(w));
}
function learnFromAiResult(title, r){
  const a = r.analysis||{}; const rw = r.rewards||{};
  const category = CATEGORY_MAP[a.category] ? a.category : null;
  const gains = Array.isArray(r.skill_gains) ? r.skill_gains.filter(g=>SKILL_MAP[g.skill] && (g.confidence==null || g.confidence>=0.35)) : [];
  const xp = Math.max(0, Math.round(Number(rw.xp_earned)||0));
  if(!category && !gains.length) return;
  if(!state.learnedWords) state.learnedWords = {};
  significantWords(title).forEach(w=>{
    if(!state.learnedWords[w]) state.learnedWords[w] = { n:0, cat:{}, skill:{}, xpSum:0, ts:Date.now() };
    const entry = state.learnedWords[w];
    entry.n += 1; entry.ts = Date.now();
    entry.xpSum += xp;
    if(category) entry.cat[category] = (entry.cat[category]||0) + 1;
    gains.forEach(g=>{ entry.skill[g.skill] = (entry.skill[g.skill]||0) + 1; });
  });
  const keys = Object.keys(state.learnedWords);
  if(keys.length > LEARNED_WORDS_MAX){
    keys.sort((x,y)=> state.learnedWords[x].ts - state.learnedWords[y].ts);
    keys.slice(0, keys.length-LEARNED_WORDS_MAX).forEach(k=> delete state.learnedWords[k]);
  }
}
function learnedSignalFor(title){
  // Returns learned category/skill hints for words the hardcoded keyword
  // lists may not cover, only using words seen enough times to trust.
  const words = significantWords(title).filter(w=> state.learnedWords && state.learnedWords[w] && state.learnedWords[w].n>=2);
  const catScores = {}; const skillScores = {}; let xpVotes = [];
  words.forEach(w=>{
    const entry = state.learnedWords[w];
    Object.keys(entry.cat).forEach(c=> catScores[c] = (catScores[c]||0) + entry.cat[c]);
    Object.keys(entry.skill).forEach(s=> skillScores[s] = (skillScores[s]||0) + entry.skill[s]);
    if(entry.n) xpVotes.push(entry.xpSum/entry.n);
  });
  return { catScores, skillScores, avgLearnedXp: xpVotes.length ? xpVotes.reduce((a,b)=>a+b,0)/xpVotes.length : null };
}
function aiResultToReward(r, fallbackTitle){
  const rw = r.rewards||{}; const a = r.analysis||{};
  const CONFIDENCE_THRESHOLD = 0.35;
  const gains = (r.skill_gains||[])
    .filter(g=>SKILL_MAP[g.skill])
    .filter(g=> g.confidence==null || Number(g.confidence)>=CONFIDENCE_THRESHOLD)
    .map(g=>({ skill:g.skill, xp:Math.max(0,Math.round(Number(g.xp)||0)) }));
  const lowerTitle = (fallbackTitle||'').toLowerCase();
  const category = CATEGORY_MAP[a.category] ? a.category : localCategorize(lowerTitle);
  let tags = Array.isArray(r.tags) ? r.tags.map(t=>String(t||'').trim()).filter(Boolean).slice(0,6) : [];
  if(!tags.length) tags = localSmartTags(lowerTitle, category, gains.map(g=>g.skill));
  return {
    xp: Math.max(0,Math.round(Number(rw.xp_earned)||0)),
    coins: Math.max(0,Math.round(Number(rw.coins_earned)||0)),
    skillGains: gains.length?gains:[{skill:'productivity', xp:Math.max(0,Math.round(Number(rw.xp_earned)||0))}],
    difficulty: a.difficulty||'moderate',
    examWeight: a.exam_weight||null,
    category,
    tags,
    notification: r.notification || 'Logged!',
    buff: (r.active_buffs && r.active_buffs.type && Number(r.active_buffs.duration_hours)>0) ? r.active_buffs : null,
    memoryNote: (typeof r.memory_note==='string' && r.memory_note.trim()) ? r.memory_note.trim() : null,
    source: r._fromCache ? 'cache' : 'ai'
  };
}
function resolveTaskReward(task){
  if(!hasAiKey()) return Promise.resolve(localResolve(task));
  const aiPromise = callScholarPulseSingle(task.title).then(r=>aiResultToReward(r, task.title)).catch(()=>localResolve(task));
  const timeoutPromise = new Promise(res=> setTimeout(()=> res(localResolve(task)), 4500));
  return Promise.race([aiPromise, timeoutPromise]);
}
function applyBuffMultipliers(result){
  const active = (state.activeBuffs||[]).filter(b=>b.expiresAt>Date.now());
  const xp2x = active.some(b=>b.type==='xp2x');
  const coins2x = active.some(b=>b.type==='coins2x');
  if(!xp2x && !coins2x) return result;
  if(xp2x){ result.xp = Math.round(result.xp*2); result.skillGains = (result.skillGains||[]).map(g=>({...g, xp: Math.round(g.xp*2)})); }
  if(coins2x){ result.coins = Math.round(result.coins*2); }
  return result;
}

/* ============ Sound / haptics / celebration ============ */
let audioCtx = null;
function unlockAudioContext(){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
}
['touchstart','click'].forEach(evt=> document.addEventListener(evt, unlockAudioContext, { once:true, passive:true }));
const SOUND_DESIGN = {
  task:            { wave:'sine',     gain:0.11, tier:'minimal', notes:[{f:587,t:0,   d:0.09},{f:880,t:0.06,d:0.14}] },
  quest:           { wave:'sine',     gain:0.13, tier:'immersive', notes:[{f:523,t:0,   d:0.10},{f:659,t:0.06,d:0.10},{f:784,t:0.12,d:0.16}] },
  achievement:     { wave:'triangle', gain:0.12, tier:'minimal', notes:[{f:659,t:0,   d:0.09},{f:988,t:0.07,d:0.09},{f:1319,t:0.14,d:0.22}] },
  levelup:         { wave:'sine',     gain:0.16, shimmer:true, tier:'minimal', notes:[{f:523,t:0,d:0.12},{f:659,t:0.09,d:0.12},{f:784,t:0.18,d:0.12},{f:1047,t:0.27,d:0.32}] },
  coins:           { wave:'sine',     gain:0.09, clink:true, tier:'immersive', notes:[{f:1568,t:0,d:0.05},{f:1976,t:0.045,d:0.08}] },
  reward:          { wave:'sine',     gain:0.13, tier:'minimal', notes:[{f:784,t:0,   d:0.10},{f:659,t:0.07,d:0.09},{f:988,t:0.15,d:0.20}] },
  streak:          { wave:'triangle', gain:0.13, tier:'immersive', notes:[{f:494,t:0,   d:0.08},{f:659,t:0.07,d:0.08},{f:880,t:0.14,d:0.08},{f:1109,t:0.21,d:0.22}] },
  fine:            { wave:'sine',     gain:0.10, thud:true, tier:'minimal', notes:[{f:180,t:0, d:0.16}] },
  fineRemoved:     { wave:'sine',     gain:0.12, tier:'minimal', notes:[{f:698,t:0,   d:0.07},{f:1046,t:0.06,d:0.16}] },
  navTick:         { wave:'sine',     gain:0.035, tier:'immersive', notes:[{f:1200,t:0,d:0.035}] }
};
function setSoundMode(mode){
  state.settings.soundMode = mode;
  state.settings.soundOn = mode!=='silent';
  saveState();
  if(mode!=='silent') previewVolume();
  renderSettingsPage();
}
function soundVolume(){ return state.settings.soundVolume!=null ? state.settings.soundVolume : 0.6; }
function soundAllowedForTier(tier){
  const mode = state.settings.soundMode || (state.settings.soundOn===false ? 'silent' : 'immersive');
  if(mode==='silent') return false;
  if(mode==='minimal') return tier==='minimal';
  return true; // immersive plays everything
}
function playTone(kind){
  if(state.settings.soundOn===false) return;
  const cfg = SOUND_DESIGN[kind] || SOUND_DESIGN.task;
  if(!soundAllowedForTier(cfg.tier||'immersive')) return;
  const master = soundVolume() * cfg.gain;
  if(master<=0) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    // Tiny per-play randomization (pitch + timing) so repeated sounds never feel robotically identical
    const detune = 0.985 + Math.random()*0.03;
    const jitter = () => (Math.random()-0.5)*0.012;
    cfg.notes.forEach(n=>{
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type=cfg.wave; osc.frequency.value=n.f*detune;
      const start=audioCtx.currentTime+Math.max(0,n.t+jitter());
      gain.gain.setValueAtTime(0.0001,start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0003,master), start+Math.min(0.02,n.d*0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, start+n.d);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(start); osc.stop(start+n.d+0.02);
      if(cfg.shimmer){
        const osc2=audioCtx.createOscillator(), gain2=audioCtx.createGain();
        osc2.type='sine'; osc2.frequency.value=n.f*2.005*detune;
        gain2.gain.setValueAtTime(0.0001,start);
        gain2.gain.exponentialRampToValueAtTime(Math.max(0.0002,master*0.35), start+0.02);
        gain2.gain.exponentialRampToValueAtTime(0.0001, start+n.d);
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.start(start); osc2.stop(start+n.d+0.02);
      }
    });
    if(cfg.clink) playClink(master);
    if(cfg.thud) playThud(master);
  }catch(e){}
}
function playThud(master){
  // A soft, muted low thud for fines — "oh", not a harsh buzzer
  try{
    const size = Math.floor(audioCtx.sampleRate*0.14);
    const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<size;i++){ data[i] = (Math.random()*2-1) * Math.pow(1-i/size, 4); }
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=220;
    const gain = audioCtx.createGain(); gain.gain.value = master*0.6;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
  }catch(e){}
}
function playClink(master){
  try{
    const size = Math.floor(audioCtx.sampleRate*0.05);
    const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<size;i++){ data[i] = (Math.random()*2-1) * Math.pow(1-i/size, 3); }
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type='highpass'; filter.frequency.value=2500;
    const gain = audioCtx.createGain(); gain.gain.value = master*0.5;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
  }catch(e){}
}
function vibrate(pattern){
  if(!state.settings.hapticOn || !navigator.vibrate) return;
  const strength = (state.settings.hapticStrength)||'medium';
  const mult = strength==='light' ? 0.5 : strength==='strong' ? 1.6 : 1;
  const scaled = Array.isArray(pattern) ? pattern.map(p=>Math.round(p*mult)) : Math.round(pattern*mult);
  navigator.vibrate(scaled);
}
function triggerLevelUp(newLevel){
  document.getElementById('celebrateLevelNum').textContent = newLevel;
  document.getElementById('celebrateTitle').textContent = strongestSkillTitle();
  logTimelineEvent('levelup', 'Level '+newLevel+' reached', 0, 0);
  saveState();
  const anim = state.settings.animations || {};
  if(anim.confetti!==false) spawnConfetti();
  if(anim.levelUpAnim===false){ playTone('levelup'); vibrate([30,60,30,60,80]); return; }
  document.getElementById('celebrateOverlay').classList.add('open');
  playTone('levelup'); vibrate([30,60,30,60,80]);
}
function closeCelebration(){ document.getElementById('celebrateOverlay').classList.remove('open'); }
function spawnConfetti(){
  const overlay = document.getElementById('celebrateOverlay');
  overlay.querySelectorAll('.confetti-piece').forEach(el=>el.remove());
  const colors = ['#E8B54D','#35C6B4','#6FCBEA','#9B8CF0'];
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animMode = (state.settings.animations && state.settings.animations.mode) || 'standard';
  const particlesOn = !(state.settings.animations && state.settings.animations.particles===false);
  const baseCount = animMode==='minimal' ? 18 : animMode==='rich' ? 60 : 44;
  const count = (reduced || !particlesOn) ? 0 : baseCount;
  for(let i=0;i<count;i++){
    const p = document.createElement('div');
    p.className='confetti-piece'; p.style.left=(Math.random()*100)+'%'; p.style.background=colors[i%colors.length];
    p.style.animationDuration=(1.6+Math.random()*1.4)+'s'; p.style.animationDelay=(Math.random()*0.4)+'s';
    p.style.transform='rotate('+Math.floor(Math.random()*360)+'deg)';
    overlay.appendChild(p);
  }
}

/* ============ Task completion (inline reward, no popups) ============ */
async function completeTask(id){
  const task = state.tasks.find(t=>t.id===id);
  if(!task || task.completed) return;
  const rowWrap = document.querySelector('.task-row-wrap[data-task-id="'+id+'"]');
  const row = rowWrap ? rowWrap.querySelector('.task-row') : null;
  const checkbox = row ? row.querySelector('.task-checkbox') : null;
  if(checkbox) checkbox.classList.add('checked');
  if(row) row.classList.add('completing');
  vibrate([12]);

  const beforeLife = lifeStats();
  const result = await resolveTaskReward(task);
  applyBuffMultipliers(result);

  task.completed = true; task.completedAt = Date.now();
  task.xp = result.xp; task.coins = result.coins; task.skillGains = result.skillGains; task.difficulty = result.difficulty;
  task.scoredBy = result.source || 'local';
  if(result.category && CATEGORY_MAP[result.category]) task.category = result.category;
  task.tags = (result.tags||[]).length ? result.tags : task.tags || [];
  result.skillGains.forEach(g=>{ if(SKILL_MAP[g.skill]) state.skills[g.skill] = (state.skills[g.skill]||0) + g.xp; });
  if(task.starredGoal) task.starredGoal = false;
  state.taskOrder = state.taskOrder.filter(tid=>tid!==id);
  bumpStreak();
  logTimelineEvent('task', task.title+' complete', task.xp, task.coins, task.completedAt);
  if(result.buff){ state.activeBuffs.push({ type: result.buff.type, expiresAt: Date.now() + Number(result.buff.duration_hours)*3600000 }); }
  if(result.memoryNote){ rememberFact(result.memoryNote); }
  saveState();

  const afterLife = lifeStats();
  const questsComplete = todaysQuests().filter(q=>skillXpToday(q.skill)>=q.target).length;
  const deltaPct = Math.max(1, Math.round((task.xp / beforeLife.need) * 100));
  const topSkill = result.skillGains.slice().sort((a,b)=>b.xp-a.xp)[0];
  const topSkillDef = topSkill ? SKILL_MAP[topSkill.skill] : null;

  if(row){
    row.querySelector('.task-title').classList.add('done');
    const strip = row.querySelector('.reward-strip');
    const skillLines = result.skillGains.filter(g=>g.xp>0).map(g=> SKILL_MAP[g.skill] ? SKILL_MAP[g.skill].icon+' '+SKILL_MAP[g.skill].name+' +'+g.xp : '').filter(Boolean).join('   ');
    const tags = [];
    if(state.streak.current>=1) tags.push('🔥 '+state.streak.current+' day'+(topSkillDef?' '+topSkillDef.name:'')+' streak');
    if(questsComplete>0) tags.push('Daily mission '+questsComplete+'/3');
    tags.push('Life level +'+deltaPct+'%');
    tags.push(task.scoredBy==='ai' ? '✨ AI-scored' : task.scoredBy==='cache' ? '💾 Cached (instant)' : '⚡ Estimate');
    const smartTagChips = (task.tags||[]).slice(0,5);
    const detailTags = tags.concat(smartTagChips.map(t=>'#'+t));
    strip.innerHTML = '<div class="reward-strip-inner">' +
      '<div class="rs-xp-line">✨ +'+task.xp+' XP <span class="rs-coin">+'+task.coins+' 🪙</span></div>' +
      (skillLines ? '<div class="rs-skills">'+skillLines+'</div>' : '') +
      '<div class="rs-notif">'+escapeHtml(result.notification)+'</div>' +
      (detailTags.length ? '<button type="button" class="rs-details-toggle" onclick="this.nextElementSibling.classList.toggle(\'rs-tags-collapsed\');this.style.display=\'none\';">Details ▾</button>' +
      '<div class="rs-tags rs-tags-collapsed">'+detailTags.map(t=>'<span class="rs-tag">'+escapeHtml(t)+'</span>').join('')+'</div>' : '') +
    '</div>';
    strip.classList.add('show');
    const anim = state.settings.animations || {};
    if(anim.xpAnim!==false){
      const fly = document.createElement('div');
      fly.className='float-num'; fly.textContent='+'+task.xp+' XP';
      row.appendChild(fly);
      setTimeout(()=> fly.remove(), 1000);
    }
    if(task.coins>0 && anim.coinAnim!==false){
      const flyC = document.createElement('div');
      flyC.className='float-num'; flyC.style.top='30px'; flyC.style.color='var(--coin)'; flyC.textContent='+'+task.coins+' 🪙';
      row.appendChild(flyC);
      setTimeout(()=> flyC.remove(), 1000);
    }
  }
  playTone('task');
  if(task.coins>0) setTimeout(()=> playTone('coins'), 110);
  renderHeaderStats();
  checkMasteries();

  setTimeout(()=>{
    if(row) row.classList.add('leaving');
    setTimeout(()=>{
      render();
      if(afterLife.level > beforeLife.level){ setTimeout(()=> triggerLevelUp(afterLife.level), 200); }
    }, 380);
  }, 1500);
}

/* ============ Today's Focus (Home hero card) ============
   The single "what should I do" target: the starred goal task, else the
   next pending task in the user's own ordering. Tapping the card scrolls
   to it in the list; the button completes it directly — no timer step. */
function heroTargetTask(){
  const dateOk = t => !t.dueDate || t.dueDate<=todayISO();
  return state.tasks.find(t=>!t.completed && t.starredGoal && dateOk(t)) ||
    state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).find(t=>t && !t.completed && dateOk(t)) || null;
}
function heroTargetReason(t){
  if(t.starredGoal) return '⭐ Your starred goal for today';
  if(t.tag==='exam') return '🎓 Exam coming up — this one matters';
  if(t.tag==='deadline') return '⚠️ Deadline — worth clearing first';
  if(t.dueDate && t.dueDate<=todayISO()) return '📅 Due today';
  return 'Next up in your list';
}
function renderFocusBar(){
  const wrap = document.getElementById('focusBarWrap');
  const target = heroTargetTask();
  if(!target){
    wrap.innerHTML = '<div class="hero-card"><div class="hero-eyebrow">Today\'s Focus</div>' +
      '<div class="hero-empty" style="margin-top:12px;">🎉 Nothing left — you\'re all caught up.</div></div>';
    return;
  }
  const pending = state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).filter(t=>t && !t.completed && (!t.dueDate || t.dueDate<=todayISO()));
  const doneToday = state.tasks.filter(t=>t.completed && t.completedAt>=startOfTodayTs()).length;
  const totalToday = doneToday + pending.length;
  const dayPct = totalToday ? Math.round((doneToday/totalToday)*100) : 0;
  wrap.innerHTML = '<div class="hero-card"><div class="hero-eyebrow" onclick="scrollToTask(\''+target.id+'\')">Today\'s Focus</div>' +
    '<div class="hero-title" onclick="scrollToTask(\''+target.id+'\')">'+escapeHtml(target.title)+'</div>' +
    '<div class="hero-reason" onclick="scrollToTask(\''+target.id+'\')">'+heroTargetReason(target)+'</div>' +
    '<div class="hero-sub" onclick="scrollToTask(\''+target.id+'\')">+'+target.estXp+' XP · '+doneToday+'/'+totalToday+' done today</div>' +
    '<div class="hero-bar"><div class="hero-bar-fill" style="width:'+dayPct+'%"></div></div>' +
    '<button class="hero-btn" onclick="completeTask(\''+target.id+'\')">✓ Mark done</button></div>';
}

function toggleStar(id){
  const already = state.tasks.find(t=>t.id===id && t.starredGoal);
  state.tasks.forEach(t=>{ t.starredGoal = false; });
  if(!already){ const t = state.tasks.find(t=>t.id===id); if(t) t.starredGoal = true; }
  saveState(); render();
}
function deleteTask(id){
  state.tasks = state.tasks.filter(t=>t.id!==id);
  state.taskOrder = state.taskOrder.filter(tid=>tid!==id);
  saveState(); render();
}

/* ============ Quests & Challenges ============ */
function claimQuest(key, target, skill){
  if(state.questClaims[key]) return;
  const progress = skillXpToday(skill);
  if(progress < target) return;
  const bonus = Math.round(target/4);
  const q = todaysQuests().find(q=>q.key===key);
  const questName = q ? q.name : 'Daily mission';
  const questIcon = q ? q.icon : '🧭';
  state.questClaims[key] = Date.now();
  state.rewardEvents.push({ id:'qb'+Date.now(), label:'Mission bonus', coins:bonus, ts:Date.now() });
  logTimelineEvent('quest', questName+' complete', 0, bonus);
  state.questHistory.unshift({ name:questName, icon:questIcon, coins:bonus, ts:Date.now() });
  state.questHistory = state.questHistory.slice(0,200);
  saveState(); checkMasteries(); render();
  const notifyOn = (state.settings.gamification ? state.settings.gamification.questNotif!==false : true) && (state.settings.animations ? state.settings.animations.questAnim!==false : true);
  if(notifyOn) showToast(questIcon+' Mission claimed · +'+bonus+' coins', 'teal');
  playTone('quest'); vibrate([15]);
}
function allChallengeDefs(){
  const builtins = BUILTIN_CHALLENGES.map(c=>({...c, archived: state.archivedChallengeIds.includes(c.id)}));
  const customs = state.customChallenges.map(c=>({...c, kind:'custom', archived: !!c.archived || state.archivedChallengeIds.includes(c.id)}));
  return builtins.concat(customs);
}
/* Recurring, XP-based goals (daily/weekly/monthly) live in the Missions panel
   alongside daily quests. One-time goals and mastery-linked goals live in the
   Challenges panel. Same underlying data — just grouped by what kind of goal it is. */
function isMissionChallenge(c){ return c.conditionType!=='mastery' && c.period!=='once'; }
function challengePeriodKey(c){
  if(c.period==='daily') return todayISO();
  if(c.period==='weekly') return isoWeekKey();
  if(c.period==='monthly') return monthKey();
  return 'once';
}
function challengeClaimKey(c){ const pk = challengePeriodKey(c); return pk==='once' ? c.id : c.id+'|'+pk; }
function challengeProgress(c){
  if(c.conditionType==='mastery'){
    const def = allMasteryDefs().find(d=>d.id===c.masteryId);
    if(!def) return { progress:0, target:1 };
    const value = def.compute();
    const tierIdx = masteryTierIndex(def, value);
    return { progress: tierIdx+1, target: (c.masteryTier!=null?c.masteryTier:7)+1 };
  }
  let from;
  if(c.period==='daily') from = startOfTodayTs();
  else if(c.period==='weekly') from = startOfWeekTs();
  else if(c.period==='monthly') from = startOfMonthTs();
  else from = c.createdAt||0;
  return { progress: xpInPeriod(from), target: c.targetXp||1 };
}
function claimChallengeUnified(id){
  const c = allChallengeDefs().find(c=>c.id===id); if(!c) return;
  const claimKey = challengeClaimKey(c);
  if(state.challengeClaims[claimKey]) return;
  const {progress,target} = challengeProgress(c);
  if(progress<target) return;
  state.challengeClaims[claimKey] = Date.now();
  state.rewardEvents.push({ id:'cb'+Date.now(), label:c.name+' bonus', coins:c.reward, ts:Date.now() });
  logTimelineEvent('challenge', c.name+' complete', 0, c.reward);
  state.challengeHistory.unshift({ id:c.id, name:c.name, icon:c.icon, reward:c.reward, period:c.period, ts:Date.now() });
  state.challengeHistory = state.challengeHistory.slice(0,200);
  saveState(); checkMasteries(); render();
  showToast(c.icon+' '+c.name+' claimed · +'+c.reward+' coins', 'violet'); playTone('quest'); vibrate([15,30,15]);
}
let editingChallengeId = null;
function setChallengeConditionType(type){
  document.querySelectorAll('#challengeConditionSeg button').forEach(b=>b.classList.toggle('active', b.dataset.type===type));
  document.getElementById('challengeXpFieldWrap').style.display = type==='xp' ? '' : 'none';
  document.getElementById('challengeMasteryFieldWrap').style.display = type==='mastery' ? '' : 'none';
}
function populateChallengeMasterySelects(selMasteryId, selTier){
  const defs = allMasteryDefs();
  document.getElementById('challengeMasterySelect').innerHTML = defs.map(d=>'<option value="'+d.id+'"'+(d.id===selMasteryId?' selected':'')+'>'+d.icon+' '+d.name+'</option>').join('');
  document.getElementById('challengeMasteryTierSelect').innerHTML = MASTERY_TIERS.map((t,i)=>'<option value="'+i+'"'+(i===selTier?' selected':'')+'>'+t+'</option>').join('');
}
function openCustomChallengeModal(challengeId){
  editingChallengeId = challengeId || null;
  const c = editingChallengeId ? state.customChallenges.find(c=>c.id===editingChallengeId) : null;
  document.getElementById('challengeModalTitle').textContent = editingChallengeId ? 'Edit challenge' : 'New challenge';
  document.getElementById('challengeName').value = c ? c.name : '';
  document.getElementById('challengePeriodSelect').value = c ? c.period : 'once';
  document.getElementById('challengeTarget').value = c ? c.targetXp : '';
  document.getElementById('challengeReward').value = c ? c.reward : '';
  populateChallengeMasterySelects(c ? c.masteryId : null, c ? c.masteryTier : 4);
  setChallengeConditionType(c && c.conditionType==='mastery' ? 'mastery' : 'xp');
  document.getElementById('challengeModalBack').classList.add('open');
}
function submitCustomChallenge(){
  const name = document.getElementById('challengeName').value.trim();
  const period = document.getElementById('challengePeriodSelect').value;
  const conditionType = document.querySelector('#challengeConditionSeg button.active').dataset.type;
  const reward = parseInt(document.getElementById('challengeReward').value,10);
  if(!name || !reward) return;
  let extra = {};
  if(conditionType==='xp'){
    const target = parseInt(document.getElementById('challengeTarget').value,10);
    if(!target) return;
    extra = { conditionType:'xp', targetXp: target, desc:'Earn '+target+' XP'+(period!=='once'?' '+period.replace('once',''):'') };
  } else {
    const masteryId = document.getElementById('challengeMasterySelect').value;
    const masteryTier = parseInt(document.getElementById('challengeMasteryTierSelect').value,10);
    const def = allMasteryDefs().find(d=>d.id===masteryId);
    extra = { conditionType:'mastery', masteryId, masteryTier, desc:'Reach '+MASTERY_TIERS[masteryTier]+' in '+(def?def.name:'a mastery') };
  }
  if(editingChallengeId){
    const c = state.customChallenges.find(c=>c.id===editingChallengeId);
    if(c){ Object.assign(c, { name, period, reward }, extra); }
  } else {
    state.customChallenges.push({ id:'cc'+Date.now().toString(36), name, icon:'🚩', period, reward, createdAt:Date.now(), archived:false, ...extra });
  }
  saveState(); render(); closeModal('challengeModalBack');
  showToast(editingChallengeId ? 'Challenge updated' : 'Challenge added');
  editingChallengeId = null;
}
function archiveChallenge(id){
  if(!state.archivedChallengeIds.includes(id)) state.archivedChallengeIds.push(id);
  const c = state.customChallenges.find(c=>c.id===id); if(c) c.archived = true;
  saveState(); render();
  showToast('Challenge archived');
}
function restoreChallenge(id){
  state.archivedChallengeIds = state.archivedChallengeIds.filter(x=>x!==id);
  const c = state.customChallenges.find(c=>c.id===id); if(c) c.archived = false;
  saveState(); render();
  showToast('Challenge restored');
}
function deleteCustomChallenge(id){
  state.customChallenges = state.customChallenges.filter(c=>c.id!==id);
  state.archivedChallengeIds = state.archivedChallengeIds.filter(x=>x!==id);
  saveState(); render();
}
let challengeFilter = 'all';
let challengeStatusFilter = 'open';
function setChallengeStatusFilter(f){ challengeStatusFilter = f; renderChallenges(); }
let challengesCompletedOpen = false, challengesHistoryOpen = false, challengesArchivedOpen = false;
function setChallengeFilter(f){ challengeFilter = f; renderChallenges(); }
function toggleChallengesCompleted(){ challengesCompletedOpen = !challengesCompletedOpen; renderChallenges(); }
function toggleChallengesHistory(){ challengesHistoryOpen = !challengesHistoryOpen; renderChallenges(); }
function toggleChallengesArchived(){ challengesArchivedOpen = !challengesArchivedOpen; renderChallenges(); }

/* ============ Negative habits & fines ============ */
function logNegativeHabit(id){
  const h = state.negativeHabits.find(h=>h.id===id); if(!h) return;
  if(state.fineWaivers>0){
    state.fineWaivers -= 1;
    logTimelineEvent('fine_cleared', h.name+' — fine waived', 0, 0);
    saveState(); render();
    showToast('🕊️ Fine Waiver used — no coins lost', 'teal');
    vibrate([15]);
    return;
  }
  state.fines.unshift({ id:'f'+Date.now().toString(36), habitId:id, habitName:h.name, amount:h.fine, ts:Date.now(), resolved:false });
  logTimelineEvent('fine', h.name+' — fine applied', 0, -h.fine);
  saveState(); render();
  showToast('−'+h.fine+' coins · '+h.name);
  playTone('fine');
  vibrate([25]);
}
function resolveFine(id){
  const f = state.fines.find(f=>f.id===id);
  if(!f || f.resolved) return;
  f.resolved = true; f.resolvedAt = Date.now();
  logTimelineEvent('fine_cleared', f.habitName+' fine removed', 0, 0);
  saveState(); render();
  showToast('✔ Fine removed', 'teal'); playTone('fineRemoved'); vibrate([15]);
}
function openNegHabitModal(){
  document.getElementById('negHabitName').value = '';
  document.getElementById('negHabitFine').value = '';
  document.getElementById('negHabitModalBack').classList.add('open');
}
function submitNegHabit(){
  const name = document.getElementById('negHabitName').value.trim();
  const fine = parseInt(document.getElementById('negHabitFine').value,10);
  if(!name || !fine || fine<=0) return;
  state.negativeHabits.push({ id:'nh'+Date.now().toString(36), name, fine });
  saveState(); render(); closeModal('negHabitModalBack');
}
function deleteNegHabit(id){
  if(BUILTIN_HABIT_IDS.includes(id)){ archiveHabit(id); return; }
  state.negativeHabits = state.negativeHabits.filter(h=>h.id!==id);
  state.archivedHabitIds = state.archivedHabitIds.filter(x=>x!==id);
  saveState(); render();
}
function archiveHabit(id){
  if(!state.archivedHabitIds.includes(id)) state.archivedHabitIds.push(id);
  saveState(); render();
  showToast('Archived');
}
function restoreHabit(id){
  state.archivedHabitIds = state.archivedHabitIds.filter(x=>x!==id);
  saveState(); render();
  showToast('Restored');
}
let habitArchivedOpen = false, fineHistoryOpen = false;
function toggleHabitArchived(){ habitArchivedOpen = !habitArchivedOpen; renderNegHabits(); }
function toggleFineHistory(){ fineHistoryOpen = !fineHistoryOpen; renderNegHabits(); }

/* ============ Accountability Court ============
   Optional, encouraging accountability layer. The AI Judge reviews recent
   activity for genuinely meaningful lapses (never small missed tasks) and,
   when warranted, opens a "case" with a fair fine and a recovery path that
   waives it. Philosophy: progress over perfection, consistency over punishment. */
function collectCourtSignals(){
  const signals = [];
  state.tasks.forEach(t=>{
    if(t.completed || !(t.missedCount>0)) return;
    const important = t.tag==='exam' || t.tag==='deadline' || t.starredGoal || t.estXp>=120;
    if(!important && t.missedCount<2) return; // small, one-off misses don't warrant a case
    const alreadyCased = state.courtCases.some(c=>c.sourceType==='task' && c.sourceId===t.id && c.status==='open');
    if(alreadyCased) return;
    signals.push({ type:'task', id:t.id, title:t.title, tag:t.tag, missedCount:t.missedCount, estXp:t.estXp, important });
  });
  const fiveDaysAgo = Date.now() - 5*86400000;
  const recentFines = (state.fines||[]).filter(f=>!f.resolved && f.ts>=fiveDaysAgo);
  const alreadyPileupCased = state.courtCases.some(c=>c.sourceType==='habit_pileup' && c.status==='open');
  if(recentFines.length>=3 && !alreadyPileupCased){
    signals.push({ type:'habit_pileup', count:recentFines.length, names:[...new Set(recentFines.map(f=>f.habitName))] });
  }
  return signals;
}
function buildCourtPrompt(signals){
  return `You are the AI Judge for the "Accountability Court" feature inside LifeXP, a gamified productivity app. Your tone is warm, encouraging, and never shaming. The app's philosophy is "progress over perfection, consistency over punishment." Never say things like "you failed" — instead something like "Life happens. Here's the easiest way to get back on track."

You are reviewing recently detected signals to decide if a case should be opened. Small, one-off missed tasks should NOT trigger a case — only genuinely meaningful lapses: an important/high-priority task or deadline that was missed, or a repeated pattern of procrastination or missed habits.

Signals detected: ${JSON.stringify(signals)}
User's currently available coins: ${availableCoins()}

Decide if a case is warranted given these signals (they were already pre-filtered for meaningfulness, so usually yes — but use judgment). Then write it up like a lighthearted courtroom case file.

Respond with STRICT JSON ONLY, no markdown fences, no commentary:
{
  "open_case": boolean,
  "charge": "short courtroom-style charge naming the specific thing missed",
  "reason": "one factual sentence on why this mattered",
  "fine_coins": integer between 5 and 60, scaled to severity and never more than the user can comfortably afford,
  "ai_message": "one warm, encouraging, non-shaming sentence from the judge",
  "recovery_options": [ { "kind": "complete_linked_task | complete_tasks_count | earn_xp | clear_fines", "count": integer or null, "label": "short human-readable label for this recovery action" } ],
  "recovery_hours": integer between 12 and 48 — how long before the fine locks in
}
Use "complete_linked_task" only if the signals include a specific task with an "id". Include 1-2 recovery_options, ranked easiest first.`;
}
async function callCourtJudge(signals){
  return callAiJson(buildCourtPrompt(signals), 900);
}
function localCourtVerdict(signals){
  const taskSig = signals.find(s=>s.type==='task' && s.important) || signals.find(s=>s.type==='task');
  if(taskSig){
    const fine = taskSig.tag==='exam' ? 30 : taskSig.tag==='deadline' ? 25 : taskSig.important ? 20 : 12;
    return {
      open_case: true,
      charge: 'Missed '+(taskSig.tag==='exam' ? 'exam prep' : taskSig.tag==='deadline' ? 'a deadline' : 'a scheduled item')+': '+taskSig.title,
      reason: taskSig.important ? 'This was marked as high priority.' : 'This has now been missed more than once.',
      fine_coins: fine,
      ai_message: "Life happens. Here's the easiest way to get back on track.",
      recovery_options: [
        { kind:'complete_linked_task', count:null, label:'Finish "'+taskSig.title+'" today' },
        { kind:'earn_xp', count:60, label:'Earn 60 XP some other way today' }
      ],
      recovery_hours: 24
    };
  }
  const habitSig = signals.find(s=>s.type==='habit_pileup');
  if(habitSig){
    return {
      open_case: true,
      charge: 'Repeated missed habits ('+habitSig.count+' unresolved)',
      reason: 'A few accountability fines have piled up recently.',
      fine_coins: 10,
      ai_message: "No shame here — just a nudge to reset the pattern.",
      recovery_options: [ { kind:'clear_fines', count:null, label:'Clear your pending fines' } ],
      recovery_hours: 24
    };
  }
  return { open_case: false };
}
async function runCourtCheck(force){
  if(!state.courtEnabled) return;
  const today = todayISO();
  if(!force && state.lastCourtCheckDate===today) return;
  state.lastCourtCheckDate = today;
  const signals = collectCourtSignals();
  if(!signals.length){ saveState(); if(force) showToast('No cases warranted right now', 'teal'); return; }

  let verdict;
  if(hasAiKey()){
    try{
      verdict = await Promise.race([
        callCourtJudge(signals),
        new Promise((_,rej)=> setTimeout(()=> rej(new Error('timeout')), 7000))
      ]);
    }catch(e){ verdict = localCourtVerdict(signals); }
  } else {
    verdict = localCourtVerdict(signals);
  }
  saveState();
  if(!verdict || !verdict.open_case){ if(force) showToast('Judge reviewed — no case today', 'teal'); return; }

  const taskSig = signals.find(s=>s.type==='task');
  const wantsLinkedTask = (verdict.recovery_options||[]).some(r=>r.kind==='complete_linked_task');
  const linkedTask = (wantsLinkedTask && taskSig) ? taskSig : null;

  state.courtCaseSeq = (state.courtCaseSeq||0) + 1;
  const caseObj = {
    id: 'case'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    num: 100 + state.courtCaseSeq,
    ts: Date.now(),
    status: 'open',
    charge: verdict.charge || 'Accountability review',
    reason: verdict.reason || '',
    aiMessage: verdict.ai_message || "Life happens. Here's the easiest way to get back on track.",
    fineCoins: Math.max(5, Math.min(75, Math.round(Number(verdict.fine_coins)||15))),
    recoveryOptions: (verdict.recovery_options||[]).slice(0,3).map((r,i)=>({
      id:'ro'+i, kind:r.kind||'earn_xp', count: r.count||null, label: r.label || 'Recovery action', done:false
    })),
    recoveryDeadline: Date.now() + Math.max(6, Math.min(72, Number(verdict.recovery_hours)||24))*3600000,
    sourceType: linkedTask ? 'task' : (taskSig ? 'task' : 'habit_pileup'),
    sourceId: linkedTask ? linkedTask.id : null,
    resolvedTs: null, resolution: null
  };
  if(!caseObj.recoveryOptions.length){
    caseObj.recoveryOptions = [{ id:'ro0', kind:'earn_xp', count:60, label:'Earn 60 XP today', done:false }];
  }
  state.courtCases.unshift(caseObj);
  logTimelineEvent('court_case', 'Case #'+caseObj.num+' opened — '+caseObj.charge, 0, 0);
  saveState();
  showToast('⚖️ New case opened — #'+caseObj.num);
  render();
}
/* ============ Reminders ============
   Set a lead time on a task with a due date (via the Quick Add reminder
   chip) and it surfaces here starting that many days before the due date,
   continuing every day up to and including the due date itself. Honest
   limit: browser Notification API only fires while this tab/app is actually
   open — there's no background push without a server, so the in-app banner
   below is the reliable path; the native notification is a bonus on top. */
function remindersActiveNow(){
  const today = todayISO();
  return state.tasks.filter(t=>{
    if(t.completed || !t.dueDate || !t.reminderLeadDays) return false;
    const due = new Date(t.dueDate+'T00:00:00');
    const start = new Date(due); start.setDate(start.getDate()-t.reminderLeadDays);
    const startIso = isoDate(start);
    return today>=startIso && today<=t.dueDate;
  }).sort((a,b)=> a.dueDate<b.dueDate ? -1 : 1);
}
function checkReminders(){
  const active = remindersActiveNow();
  if(!active.length) return;
  const today = todayISO();
  if(typeof Notification!=='undefined' && Notification.permission==='granted'){
    active.forEach(t=>{
      if(t.lastReminderNotifiedDate===today) return;
      t.lastReminderNotifiedDate = today;
      const daysLeft = Math.round((new Date(t.dueDate+'T00:00:00') - new Date(today+'T00:00:00'))/86400000);
      try{
        new Notification('LifeXP reminder', { body: t.title+(daysLeft>0?' — due in '+daysLeft+' day'+(daysLeft===1?'':'s'):' — due today'), tag:'lifexp-reminder-'+t.id });
      }catch(e){}
    });
    saveState();
  }
}
function requestReminderPermission(){
  if(typeof Notification==='undefined'){ showToast('Notifications aren\'t supported in this browser'); return; }
  Notification.requestPermission().then(p=>{
    showToast(p==='granted' ? 'Reminders enabled ✓' : 'Permission not granted');
    renderSettingsPage();
  });
}
function renderReminderAlertBanner(){
  const wrap = document.getElementById('reminderAlertWrap');
  if(!wrap) return;
  const active = remindersActiveNow();
  if(!active.length){ wrap.innerHTML=''; return; }
  const today = todayISO();
  wrap.innerHTML = '<div class="reminder-banner"><div class="reminder-row" style="font-weight:700;color:var(--text);padding-top:0;">🔔 Coming up</div>' +
    active.slice(0,4).map(t=>{
      const daysLeft = Math.round((new Date(t.dueDate+'T00:00:00') - new Date(today+'T00:00:00'))/86400000);
      const label = daysLeft<=0 ? 'Due today' : daysLeft===1 ? 'Tomorrow' : 'In '+daysLeft+'d';
      return '<div class="reminder-row" onclick="scrollToTask(\''+t.id+'\')"><span><b>'+escapeHtml(t.title)+'</b></span><span class="reminder-days">'+label+'</span></div>';
    }).join('') +
  '</div>';
}

/* ============ Auto-fine for overdue tasks ============
   A task whose due date has passed while still incomplete automatically
   opens a Court case — same recovery mechanic as everything else in Court:
   complete it within the window and the fine is waived, let it expire and
   the fine applies. Each task only ever opens one case (overdueCaseOpened
   guards against re-firing every render). */
function checkOverdueTaskFines(){
  const today = todayISO();
  const now = Date.now();
  let changed = false;
  state.tasks.filter(t=>!t.completed && t.dueDate && t.dueDate<today && !t.overdueCaseOpened).forEach(t=>{
    t.overdueCaseOpened = true;
    state.courtCaseSeq = (state.courtCaseSeq||0) + 1;
    const caseObj = {
      id: 'case'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
      num: 100 + state.courtCaseSeq,
      ts: now,
      status: 'open',
      charge: 'Missed: '+t.title,
      reason: 'This was due '+t.dueDate+' and is still open.',
      aiMessage: "Life happens. Complete it now to clear this, or let the fine stand.",
      fineCoins: Math.max(5, Math.min(40, Math.round((t.estXp||40)/3))),
      recoveryOptions: [{ id:'ro0', kind:'complete_linked_task', count:null, label:'Complete "'+t.title+'"', done:false }],
      recoveryDeadline: now + 48*3600000,
      sourceType: 'task',
      sourceId: t.id,
      resolvedTs: null, resolution: null
    };
    state.courtCases.unshift(caseObj);
    logTimelineEvent('court_case', 'Case #'+caseObj.num+' opened — '+caseObj.charge, 0, 0);
    changed = true;
  });
  if(changed) saveState();
}
function checkCourtRecoveries(){
  let changed = false;
  const now = Date.now();
  (state.courtCases||[]).filter(c=>c.status==='open').forEach(c=>{
    c.recoveryOptions.forEach(r=>{
      if(r.done) return;
      if(r.kind==='complete_linked_task'){
        const t = state.tasks.find(t=>t.id===c.sourceId);
        if(t && t.completed && t.completedAt>=c.ts) r.done = true;
      } else if(r.kind==='complete_tasks_count'){
        const n = state.tasks.filter(t=>t.completed && t.completedAt>=c.ts).length;
        if(n>=(r.count||1)) r.done = true;
      } else if(r.kind==='earn_xp'){
        if(xpInPeriod(c.ts) >= (r.count||50)) r.done = true;
      } else if(r.kind==='clear_fines'){
        if(activeFinesTotal()===0) r.done = true;
      }
      if(r.done) changed = true;
    });
    if(c.status==='open' && c.recoveryOptions.some(r=>r.done)){
      c.status = 'recovered'; c.resolvedTs = now; c.resolution = 'recovered';
      logTimelineEvent('court_resolved', 'Case #'+c.num+' cleared — fine waived', 0, 0);
      changed = true;
    } else if(c.status==='open' && now > c.recoveryDeadline){
      c.status = 'expired'; c.resolvedTs = now; c.resolution = 'fine_applied';
      state.fines.unshift({ id:'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,5), habitId:null, habitName:'Case #'+c.num+' — '+c.charge, amount:c.fineCoins, ts:now, resolved:false, courtCaseId:c.id });
      logTimelineEvent('fine', 'Case #'+c.num+' — fine applied', 0, -c.fineCoins);
      playTone('fine');
      changed = true;
    }
  });
  if(changed) saveState();
}
function payCourtFine(id){
  const c = state.courtCases.find(c=>c.id===id);
  if(!c || c.status!=='open') return;
  c.status = 'paid'; c.resolvedTs = Date.now(); c.resolution = 'paid';
  state.fines.unshift({ id:'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,5), habitId:null, habitName:'Case #'+c.num+' — '+c.charge, amount:c.fineCoins, ts:Date.now(), resolved:false, courtCaseId:c.id });
  logTimelineEvent('fine', 'Case #'+c.num+' — fine paid', 0, -c.fineCoins);
  saveState(); render();
  showToast('−'+c.fineCoins+' coins · fine paid');
}
function markRecoveryDone(caseId, roId){
  const c = state.courtCases.find(c=>c.id===caseId);
  if(!c || c.status!=='open') return;
  const r = c.recoveryOptions.find(r=>r.id===roId);
  if(!r) return;
  r.done = true;
  checkCourtRecoveries();
  saveState(); render();
  showToast('✔ Recovery logged', 'teal'); playTone('reward'); vibrate([15]);
}
function toggleCourt(val){
  state.courtEnabled = val;
  saveState(); render();
}
function courtHoursLeft(c){ return Math.max(0, Math.round((c.recoveryDeadline-Date.now())/3600000)); }
function renderCaseCard(c){
  const hoursLeft = courtHoursLeft(c);
  const recoveryHtml = c.recoveryOptions.map(r=>
    '<div class="court-recovery-row'+(r.done?' done':'')+'"><span>'+(r.done?'✅ ':'▫️ ')+escapeHtml(r.label)+'</span>' +
    (r.done ? '' : '<button class="court-mark-btn" onclick="markRecoveryDone(\''+c.id+'\',\''+r.id+'\')">Mark done</button>') +
    '</div>'
  ).join('');
  return '<div class="court-case-card"><div class="court-case-top"><span class="court-case-num">Case #'+c.num+'</span><span class="court-case-fine">−'+c.fineCoins+' 🪙</span></div>' +
    '<div class="court-case-charge">'+escapeHtml(c.charge)+'</div>' +
    (c.reason ? '<div class="court-case-reason">'+escapeHtml(c.reason)+'</div>' : '') +
    '<div class="court-case-ai">🧠 '+escapeHtml(c.aiMessage)+'</div>' +
    '<div class="court-case-recovery-label">Recovery · '+hoursLeft+'h left before the fine locks in</div>' +
    recoveryHtml +
    '<button class="court-pay-btn" onclick="payCourtFine(\''+c.id+'\')">Just pay the fine now</button>' +
  '</div>';
}
function renderCourtHistoryRow(c){
  const outcome = c.resolution==='recovered' ? '✔ Recovered — fine waived' : c.resolution==='paid' ? '💳 Fine paid — −'+c.fineCoins+' coins' : '⏱ Deadline passed — −'+c.fineCoins+' coins';
  return '<div class="court-history-row"><div><div class="court-history-charge">Case #'+c.num+' · '+escapeHtml(c.charge)+'</div>' +
    '<div class="court-history-outcome">'+outcome+'</div></div><div class="court-history-date">'+fmtTime(c.resolvedTs||c.ts)+'</div></div>';
}
function renderCourtAlertBanner(){
  const wrap = document.getElementById('courtAlertWrap');
  if(!wrap) return;
  if(!state.courtEnabled){ wrap.innerHTML=''; return; }
  const open = (state.courtCases||[]).filter(c=>c.status==='open').sort((a,b)=>a.recoveryDeadline-b.recoveryDeadline);
  if(!open.length){ wrap.innerHTML=''; return; }
  const c = open[0];
  const hoursLeft = courtHoursLeft(c);
  const firstOpenRecovery = c.recoveryOptions.find(r=>!r.done);
  wrap.innerHTML = '<div class="court-alert-banner">' +
    '<div class="cab-top"><span class="cab-title">⚖️ Missed — '+hoursLeft+'h to recover</span><span class="cab-fine">−'+c.fineCoins+' 🪙</span></div>' +
    '<div class="cab-charge">'+escapeHtml(c.charge)+'</div>' +
    '<div class="cab-actions">' +
      (firstOpenRecovery ? '<button class="cab-recover-btn" onclick="markRecoveryDone(\''+c.id+'\',\''+firstOpenRecovery.id+'\')">'+escapeHtml(firstOpenRecovery.label)+'</button>' : '') +
      '<button class="cab-pay-link" onclick="payCourtFine(\''+c.id+'\')">Just pay the fine</button>' +
    '</div>' +
    (open.length>1 ? '<div class="cab-more">+'+(open.length-1)+' more open case'+(open.length>2?'s':'')+' — <a href="#" onclick="goTo(\'court\');return false;" style="color:var(--text-faint);">view all</a></div>' : '') +
  '</div>';
}
function renderCourt(){
  const wrap = document.getElementById('courtWrap');
  if(!wrap) return;
  const open = (state.courtCases||[]).filter(c=>c.status==='open');
  const history = (state.courtCases||[]).filter(c=>c.status!=='open').slice(0,30);

  let html = '<div class="court-toggle-row"><div><div class="court-toggle-title">Court system</div>' +
    '<div class="court-toggle-sub">Optional accountability with a way back — not punishment.</div></div>' +
    '<label class="switch"><input type="checkbox" '+(state.courtEnabled?'checked':'')+' onchange="toggleCourt(this.checked)"><span class="switch-track"></span></label></div>';

  if(!state.courtEnabled){
    html += '<div class="empty" style="margin-top:14px;">Court is off. Turn it on above to let the AI Judge open cases when something important slips — you can still see past history below.</div>';
  } else {
    html += '<button class="court-judge-btn" onclick="runCourtCheck(true)">🔍 Ask the Judge to review now</button>';
    html += '<div class="section-label" style="margin-top:18px;">Open cases</div>';
    html += open.length ? open.map(renderCaseCard).join('') : '<div class="empty">No open cases. Nothing to answer for right now.</div>';
  }

  html += '<div class="section-label" style="margin-top:18px;">Court history</div>';
  html += history.length ? history.map(renderCourtHistoryRow).join('') : '<div class="empty">Past cases will show up here.</div>';

  wrap.innerHTML = html;
}

/* ============ Sync ============ */
function updateSyncStatus(on, text){
  document.getElementById('syncDot').classList.toggle('on', on);
  document.getElementById('syncStatusText').textContent = text || (on ? 'Connected · syncing every 30s' : 'Not connected');
}
async function syncNow(silent){
  const url = state.webhookUrl; if(!url) return;
  updateSyncStatus(true, 'Syncing…');
  try{
    const res = await fetch(url, { method:'GET' });
    if(!res.ok) throw new Error('bad response');
    const remote = await res.json();
    if(!Array.isArray(remote)) throw new Error('unexpected format');
    const existingIds = new Set(state.tasks.map(t=>t.id));
    let added = 0;
    remote.forEach(e=>{
      if(e && e.id && !existingIds.has(e.id) && typeof e.xp === 'number'){
        const skill = SKILL_MAP[e.skill] ? e.skill : 'productivity';
        state.tasks.push({ id:e.id, title:e.name||'Untitled task', createdAt:e.ts||Date.now(), starredGoal:false, completed:true, completedAt:e.ts||Date.now(), estXp:e.xp, estCoins:Number(e.coins)||0, xp:e.xp, coins:Number(e.coins)||0, skillGains:[{skill, xp:e.xp}] });
        state.skills[skill] = (state.skills[skill]||0) + e.xp;
        existingIds.add(e.id); added++;
      }
    });
    if(added){ bumpStreak(); checkMasteries(); }
    saveState(); render();
    updateSyncStatus(true, added ? ('Synced · +'+added+' new') : 'Synced · up to date');
    if(added && !silent) showToast('+'+added+' synced');
  }catch(e){ updateSyncStatus(false, 'Sync failed — check URL'); }
}
function openSyncModal(){
  document.getElementById('webhookUrl').value = state.webhookUrl || '';
  document.getElementById('geminiApiKeyInput').value = state.geminiApiKey || '';
  updateSyncStatus(!!state.webhookUrl);
  document.getElementById('aiTestDot').classList.remove('on');
  document.getElementById('aiTestStatusText').textContent = state.geminiApiKey ? 'Not tested yet' : 'No key entered — using built-in estimate';
  document.getElementById('learnedWordCount').textContent = Object.keys(state.learnedWords||{}).length;
  document.getElementById('cachedTaskCount').textContent = Object.keys(state.aiCache||{}).length;
  document.getElementById('syncModalBack').classList.add('open');
}
function saveSyncSettings(){
  const url = document.getElementById('webhookUrl').value.trim();
  state.webhookUrl = url;
  state.geminiApiKey = document.getElementById('geminiApiKeyInput').value.trim();
  saveState();
  if(syncTimer) clearInterval(syncTimer);
  if(url){ syncNow(false); syncTimer = setInterval(()=>syncNow(true), 30000); } else { updateSyncStatus(false); }
  render();
  closeModal('syncModalBack');
  showToast('Saved');
}
function toggleSetting(key, val){ state.settings[key] = val; saveState(); }
function setVolume(val){ state.settings.soundVolume = Math.max(0, Math.min(1, val/100)); saveState(); }
function previewVolume(){ if(state.settings.soundOn) playTone('coins'); }

/* ============ Account & Settings pages ============ */
const AVATAR_OPTIONS = ['🦁','🦊','🐺','🦉','🐼','🐯','🐻','🦄','🐸','🐨','🌟','🔥','⚡','🎯','🚀'];
const RANKS = [
  {min:1, name:'Novice'}, {min:5, name:'Adept'}, {min:10, name:'Skilled'},
  {min:16, name:'Expert'}, {min:24, name:'Master'}, {min:34, name:'Grandmaster'}, {min:46, name:'Legend'}
];
function rankForLevel(lvl){
  let r = RANKS[0];
  RANKS.forEach(x=>{ if(lvl>=x.min) r=x; });
  return r.name;
}
function lifeBalanceScore(){
  const levels = SKILLS.map(s=>skillCurve(state.skills[s.id]||0).level);
  const total = levels.reduce((a,b)=>a+b,0);
  if(total<=0) return 0;
  const mean = total/levels.length;
  const variance = levels.reduce((s,l)=>s+Math.pow(l-mean,2),0)/levels.length;
  const stdev = Math.sqrt(variance);
  const score = Math.round(Math.max(0, 100 - stdev*22));
  return score;
}
function studyHoursEst(){
  const studyDone = completedTasks().filter(t=>t.category==='study');
  return Math.round((studyDone.length*0.75)*10)/10;
}
function lifetimeCompletionRate(){
  const total = state.tasks.length;
  if(!total) return 0;
  return Math.round((completedTasks().length/total)*100);
}
function openAccountView(){ goTo('account'); renderAccount(); }
function openSettingsView(){ goTo('settings'); renderSettingsPage(); }
function initialsFor(name){
  const n = (name||'').trim();
  if(!n) return '🙂';
  const parts = n.split(/\s+/);
  return (parts[0][0]+(parts[1]?parts[1][0]:'')).toUpperCase();
}
function renderAccount(){
  const wrap = document.getElementById('accountWrap');
  const ls = lifeStats();
  const title = strongestSkillTitle();
  const avatar = state.profile && state.profile.avatar ? state.profile.avatar : null;
  const joinDate = state.profile && state.profile.joinDate ? new Date(state.profile.joinDate).toLocaleDateString([], {month:'short', year:'numeric'}) : '—';
  const username = (state.profile && state.profile.username) ? '@'+state.profile.username : '@'+((state.userName||'you').toLowerCase().replace(/\s+/g,''));
  const strongest = SKILLS.reduce((best,s)=> (state.skills[s.id]||0) > (state.skills[best.id]||0) ? s : best, SKILLS[0]);
  const mastDefs = allMasteryDefs();
  const mastTierCount = mastDefs.reduce((s,d)=> s+((state.masteries[d.id]?.claimedTiers?.length)||0), 0);
  const mastMax = mastDefs.length * MASTERY_TIERS.length;

  wrap.innerHTML =
    '<div class="profile-header">' +
      '<div class="avatar-circle" onclick="openEditProfileModal()">'+(avatar||initialsFor(state.userName))+'</div>' +
      '<div class="profile-id">' +
        '<div class="profile-name">'+escapeHtml(state.userName||'Set your name')+'</div>' +
        '<div class="profile-username">'+escapeHtml(username)+(state.profile&&state.profile.email?' · '+escapeHtml(state.profile.email):'')+'</div>' +
        '<div class="profile-meta-row">' +
          '<span class="profile-meta-chip">Joined '+joinDate+'</span>' +
          '<span class="profile-meta-chip">Level '+ls.level+'</span>' +
          '<span class="profile-meta-chip">🔥 '+(state.streak.current||0)+' day streak</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="account-card" style="padding:14px 14px 6px;">' +
      '<div class="action-row" onclick="openEditProfileModal()"><div class="action-row-left"><span class="ar-icon">'+iconEdit()+'</span>Edit profile</div>'+chevSvg()+'</div>' +
      '<div class="action-row" onclick="openMasteriesModal()"><div class="action-row-left"><span class="ar-icon">🏅</span>Masteries</div><span class="action-row-right">'+mastTierCount+' / '+mastMax+'</span></div>' +
    '</div>' +

    '<div class="section-label">Account sign-in</div>' +
    '<div class="account-card" style="padding:14px;">' +
      (state.googleAuth ? (
        '<div class="action-row" style="cursor:default;"><div class="action-row-left">'+
          (state.googleAuth.picture ? '<img src="'+escapeHtml(state.googleAuth.picture)+'" style="width:26px;height:26px;border-radius:50%;margin-right:4px;">' : '<span class="ar-icon">✅</span>')+
          '<span>Signed in as '+escapeHtml(state.googleAuth.email)+'</span></div></div>' +
        '<button class="settings-danger-btn" onclick="googleSignOut()">Sign out</button>'
      ) : (
        '<div id="googleSignInBtn"></div>' +
        '<div class="qa-hint" style="margin-top:8px;">Signing in remembers your name, photo, and email on this device so you don\'t have to re-enter them. This never syncs your tasks to a server — everything still lives only in this browser.</div>'
      )) +
    '</div>' +

    '<div class="section-label">Statistics</div>' +
    '<div class="stat-grid">' +
      statTile('Total XP', totalXpAll().toLocaleString()) +
      statTile('Coins', availableCoins().toLocaleString()) +
      statTile('Tasks completed', completedTasks().length.toLocaleString()) +
      statTile('Study hours (est.)', studyHoursEst()) +
      statTile('Rewards claimed', state.claims.length.toLocaleString()) +
      statTile('Mastery tiers', mastTierCount+' / '+mastMax) +
      statTile('Longest streak', (state.streak.longest||0)+' days') +
      statTile('Completion rate', lifetimeCompletionRate()+'%') +
    '</div>' +

    '<div class="section-label">Character</div>' +
    '<div class="stat-grid">' +
      statTile('Life class', title) +
      statTile('Strongest skill', SKILL_MAP[strongest.id].icon+' '+SKILL_MAP[strongest.id].name) +
      statTile('Life balance', lifeBalanceScore()+' / 100') +
      statTile('Rank', rankForLevel(ls.level)) +
    '</div>' +

    '<div class="section-label">Account</div>' +
    '<div class="account-card">' +
      '<div class="action-row" onclick="openSyncModal()"><div class="action-row-left"><span class="ar-icon">🔗</span>Shortcuts relay &amp; AI key</div>'+chevSvg()+'</div>' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🔑</span>Change password</div><span class="action-row-right">Local only</span></div>' +
      '<div class="action-row" onclick="goTo(\'settings\');renderSettingsPage();openSettingsGroup(\'notifications\')"><div class="action-row-left"><span class="ar-icon">✉️</span>Email preferences</div>'+chevSvg()+'</div>' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🔌</span>Linked accounts</div><span class="soon-badge">Future</span></div>' +
      '<div class="action-row" onclick="backupData()"><div class="action-row-left"><span class="ar-icon">💾</span>Data backup</div>'+chevSvg()+'</div>' +
      '<div class="action-row" onclick="backupData()"><div class="action-row-left"><span class="ar-icon">📤</span>Export data</div>'+chevSvg()+'</div>' +
      '<div class="action-row danger" onclick="confirmDeleteAccount()"><div class="action-row-left"><span class="ar-icon">'+iconTrash()+'</span>Delete account</div>'+chevSvg()+'</div>' +
    '</div>' +

    '<div class="section-label">Subscription</div>' +
    '<div class="account-card">' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">💳</span>Current plan</div><span class="action-row-right">Free</span></div>' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">⬆️</span>Upgrade to Premium</div><span class="soon-badge">Future</span></div>' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🧾</span>Billing</div><span class="soon-badge">Future</span></div>' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">↩️</span>Restore purchases</div><span class="soon-badge">Future</span></div>' +
    '</div>' +

    '<div class="section-label">About</div>' +
    '<div class="account-card">' +
      '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">ℹ️</span>App version</div><span class="action-row-right">1.4.0</span></div>' +
      '<div class="action-row" onclick="showToast(\'Latest: profiles, stats & settings overhaul\')"><div class="action-row-left"><span class="ar-icon">📝</span>Release notes</div>'+chevSvg()+'</div>' +
      '<div class="action-row" onclick="showToast(\'All data stays on this device — nothing is sent anywhere unless you set a relay URL or AI key\')"><div class="action-row-left"><span class="ar-icon">🛡️</span>Privacy policy</div>'+chevSvg()+'</div>' +
      '<div class="action-row" onclick="showToast(\'LifeXP is provided as-is, for personal productivity use\')"><div class="action-row-left"><span class="ar-icon">📜</span>Terms of service</div>'+chevSvg()+'</div>' +
      '<div class="action-row" onclick="showToast(\'Use the feedback / support channel you received this app from\')"><div class="action-row-left"><span class="ar-icon">💬</span>Contact support</div>'+chevSvg()+'</div>' +
    '</div>';
  setTimeout(initGoogleSignIn, 0);
}
function statTile(label, value){
  return '<div class="summary-tile"><div class="summary-tile-label">'+escapeHtml(label)+'</div><div class="summary-tile-value">'+value+'</div></div>';
}
function chevSvg(){
  return '<svg class="action-row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
}
function iconEdit(){ return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>'; }
function iconArchive(){ return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8"/><path d="M10 13h4"/></svg>'; }
function iconTrash(){ return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6z"/><path d="M10 11v6M14 11v6"/></svg>'; }
function iconGrip(){ return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="8" cy="6" r="1.4"/><circle cx="16" cy="6" r="1.4"/><circle cx="8" cy="12" r="1.4"/><circle cx="16" cy="12" r="1.4"/><circle cx="8" cy="18" r="1.4"/><circle cx="16" cy="18" r="1.4"/></svg>'; }
/* ============ Google Sign-In ============
   Uses Google Identity Services (client-side only, no backend). Requires a
   real OAuth Client ID from Google Cloud Console, registered against the
   exact domain this file is hosted on — it will NOT work from a local
   file:// path or an in-chat preview sandbox. Replace the placeholder below
   with your own Client ID once you have one. */
const GOOGLE_CLIENT_ID = '72502977844-2q156o63br5p6dhvjtnvd6aeoccb0ea5.apps.googleusercontent.com';
function initGoogleSignIn(targetId){
  const btnEl = document.getElementById(targetId||'googleSignInBtn');
  if(!btnEl || state.googleAuth) return; // already signed in, nothing to render
  if(typeof google==='undefined' || !google.accounts || !google.accounts.id){
    btnEl.innerHTML = '<div class="qa-hint" style="margin:0;">Google Sign-In couldn\'t load — check your connection, or this page may be blocked from reaching accounts.google.com.</div>';
    return;
  }
  if(GOOGLE_CLIENT_ID.indexOf('YOUR_GOOGLE_OAUTH_CLIENT_ID')===0){
    btnEl.innerHTML = '<div class="qa-hint" style="margin:0;text-align:left;">' +
      '<b>Sign-in isn\'t set up yet for this copy of the app.</b><br><br>' +
      'This needs a one-time step from whoever set up this website: a free "Client ID" from ' +
      '<a href="https://console.cloud.google.com/" target="_blank" rel="noopener" style="color:var(--teal);">Google Cloud Console</a>, ' +
      'registered to this exact site\'s address, then pasted into the app\'s code. Until that\'s done, this button can\'t work — ' +
      'that\'s expected, not a bug you\'re missing. See the README for the exact steps.' +
    '</div>';
    return;
  }
  try{
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: true });
    google.accounts.id.renderButton(btnEl, { theme:'outline', size:'large', width:260, shape:'pill' });
  }catch(e){ console.error('Google Sign-In init failed:', e); }
}
function base64UrlDecode(str){
  let s = str.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length % 4) s += '=';
  return atob(s);
}
function handleGoogleCredential(response){
  try{
    const payload = JSON.parse(base64UrlDecode(response.credential.split('.')[1]));
    state.googleAuth = { email: payload.email, name: payload.name, picture: payload.picture, signedInAt: Date.now() };
    if(!state.userName && payload.given_name) state.userName = payload.given_name;
    if(!state.profile) state.profile = {};
    if(!state.profile.email) state.profile.email = payload.email;
    if(!state.profile.avatar && payload.picture) state.profile.avatar = null; // keep emoji/initials avatar system; picture shown separately on the account row
    saveState();
    showToast('Signed in as '+payload.email);
    renderAccount();
    render();
  }catch(e){ console.error('Failed to read Google credential:', e); showToast('Sign-in succeeded but reading your profile failed — check the console'); }
}
function googleSignOut(){
  state.googleAuth = null;
  saveState();
  if(typeof google!=='undefined' && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
  showToast('Signed out');
  renderAccount();
}

/* ============ Google Calendar Sync (one-way: LifeXP → Calendar) ============
   Separate from Sign-In above — Sign-In only proves who you are; writing to
   a calendar needs its own distinct permission grant, which is what this
   requests via Google's OAuth2 token client. One-way only: a task with a due
   date gets pushed as an event. Edits/deletes don't sync back either way —
   that's the two-way version, out of scope here on purpose. The access token
   lives only in memory (never localStorage) and expires in about an hour,
   so silently reconnecting on load (or needing to reconnect) is expected. */
let gcalAccessToken = null;
let gcalTokenClient = null;
function gcalInitTokenClient(){
  if(gcalTokenClient) return gcalTokenClient;
  if(typeof google==='undefined' || !google.accounts || !google.accounts.oauth2) return null;
  gcalTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: (resp)=>{
      if(resp && resp.access_token){
        gcalAccessToken = resp.access_token;
        if(!state.settings.calendar) state.settings.calendar = {};
        state.settings.calendar.googleSyncEnabled = true;
        saveState();
        showToast('Google Calendar connected ✓');
        renderSettingsPage();
        gcalSyncAllPending();
      }
    }
  });
  return gcalTokenClient;
}
function connectGoogleCalendar(){
  if(GOOGLE_CLIENT_ID.indexOf('YOUR_GOOGLE_OAUTH_CLIENT_ID')===0){ showToast('Needs a Google Client ID set up in the code first — see the README'); return; }
  const client = gcalInitTokenClient();
  if(!client){ showToast('Google API failed to load — check your connection'); return; }
  client.requestAccessToken();
}
function disconnectGoogleCalendar(){
  gcalAccessToken = null;
  if(!state.settings.calendar) state.settings.calendar = {};
  state.settings.calendar.googleSyncEnabled = false;
  saveState();
  showToast('Disconnected from Google Calendar');
  renderSettingsPage();
}
function gcalTryAutoReconnect(){
  if(!(state.settings.calendar && state.settings.calendar.googleSyncEnabled)) return;
  if(GOOGLE_CLIENT_ID.indexOf('YOUR_GOOGLE_OAUTH_CLIENT_ID')===0) return;
  const client = gcalInitTokenClient();
  if(!client) return;
  try{ client.requestAccessToken({ prompt:'' }); }catch(e){}
}
async function pushTaskToGoogleCalendar(task){
  if(!gcalAccessToken || task.gcalEventId) return;
  const eventDate = task.dueDate || todayISO(); // undated tasks are treated as "today" everywhere else in the app — same rule here
  try{
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method:'POST',
      headers: { 'Authorization':'Bearer '+gcalAccessToken, 'Content-Type':'application/json' },
      body: JSON.stringify({ summary: task.title, description:'Added from LifeXP', start:{date:eventDate}, end:{date:eventDate} })
    });
    if(!res.ok){ if(res.status===401) gcalAccessToken = null; return; }
    const data = await res.json();
    task.gcalEventId = data.id;
    saveState();
  }catch(e){ console.error('Calendar push failed:', e); }
}
function maybeGoogleSync(task){
  if(state.settings.calendar && state.settings.calendar.googleSyncEnabled && gcalAccessToken){
    pushTaskToGoogleCalendar(task);
  }
}
async function gcalSyncAllPending(){
  if(!gcalAccessToken) return;
  const candidates = state.tasks.filter(t=>!t.completed && t.dueDate && !t.gcalEventId);
  for(const t of candidates){ await pushTaskToGoogleCalendar(t); }
  if(candidates.length) showToast('Synced '+candidates.length+' task'+(candidates.length===1?'':'s')+' to Google Calendar');
}
function openEditProfileModal(){
  const picker = document.getElementById('avatarPicker');
  const current = state.profile && state.profile.avatar;
  picker.innerHTML = AVATAR_OPTIONS.map(a=>'<div class="avatar-opt'+(a===current?' active':'')+'" data-avatar="'+a+'" onclick="pickAvatar(this)">'+a+'</div>').join('');
  document.getElementById('profileNameInput').value = state.userName || '';
  document.getElementById('profileUsernameInput').value = (state.profile && state.profile.username) || '';
  document.getElementById('profileEmailInput').value = (state.profile && state.profile.email) || '';
  document.getElementById('editProfileModalBack').classList.add('open');
}
let pendingAvatar = null;
function pickAvatar(el){
  document.querySelectorAll('.avatar-opt').forEach(o=>o.classList.remove('active'));
  el.classList.add('active');
  pendingAvatar = el.dataset.avatar;
}
function saveProfile(){
  state.userName = document.getElementById('profileNameInput').value.trim();
  if(!state.profile) state.profile = {};
  if(pendingAvatar) state.profile.avatar = pendingAvatar;
  state.profile.username = document.getElementById('profileUsernameInput').value.trim().replace(/[^a-z0-9_.]/gi,'');
  state.profile.email = document.getElementById('profileEmailInput').value.trim();
  pendingAvatar = null;
  saveState(); render(); renderAccount();
  closeModal('editProfileModalBack');
  showToast('Profile saved');
}
function backupData(){
  try{
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lifexp-backup-'+todayISO()+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  }catch(e){ showToast('Backup failed'); }
}
function importDataFile(input){
  const file = input.files && input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const imported = JSON.parse(reader.result);
      if(!imported || typeof imported !== 'object') throw new Error('bad file');
      state = { ...defaultState(), ...imported };
      saveState(); render(); renderSettingsPage();
      showToast('Data imported');
    }catch(e){ showToast('Import failed — invalid file'); }
  };
  reader.readAsText(file);
  input.value = '';
}
let deleteConfirmStage = 0;
function confirmDeleteAccount(){
  if(!confirm('This permanently deletes all local LifeXP data on this device (tasks, XP, rewards, history). This cannot be undone. Continue?')) return;
  if(!confirm('Are you absolutely sure? Consider using Data Backup first.')) return;
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  location.reload();
}
function clearCache(){
  showToast('Cache cleared');
}
function resetTutorial(){
  state.dismissedInsightDate = null;
  state.onboardingComplete = false;
  saveState();
  showToast('Tutorial will show again next time you open the app');
}
const ONBOARD_STEPS = [
  { icon:'👋', title:'Welcome to LifeXP', body:'A task manager that quietly keeps score — the more real, meaningful things you get done, the more it shows.' },
  { icon:'✨', title:'Add a task, your way', body:'Tap the <b>+</b> button any time. Just type naturally — "study chemistry for Friday" works fine, no fields to fill in. Paste a whole list and it splits into separate tasks automatically.' },
  { icon:'🎯', title:"Today's Focus", body:'Your home screen highlights one task worth doing next, with everything else in your list right below it — not everything competing for attention at once.' },
  { icon:'🔗', title:'Sign in with Google', body:'Optional. Lets LifeXP remember your name and photo, and unlocks pushing tasks straight into your Google Calendar later (Settings → Calendar). Skip it and everything still works exactly the same.',
    extraHtml: '<div id="onboardGoogleBtn" style="margin-top:14px;display:flex;justify-content:center;min-height:44px;"></div>',
    onRender: function(){ setTimeout(function(){ initGoogleSignIn('onboardGoogleBtn'); }, 0); }
  },
  { icon:'🤖', title:'A few optional power-ups', body:
    '<div style="text-align:left;">' +
    '<b>✨ AI scoring</b> — a free key from Google (<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--teal);">aistudio.google.com/apikey</a>) unlocks smart scoring, daily planning, and insights. Paste it into <b>Settings → AI</b>. No card, no cost. Works fine without one too — a solid built-in estimate takes over instead.<br><br>' +
    '<b>📅 Google Calendar</b> — once signed in, turn this on in <b>Settings → Calendar</b> to push tasks with due dates straight onto your real calendar.<br><br>' +
    '<b>🔗 Shortcuts relay</b> — an advanced option in <b>Settings → AI</b> for pulling in tasks completed via Apple Shortcuts automations. Most people never need this — ignore it unless you go looking.' +
    '</div>'
  },
  { icon:'🎨', title:'Make it yours whenever', body:'Themes, layout, sounds, even custom colours — all in <b>Settings</b>. Start simple today and adjust as you go, nothing here is locked in.' }
];
let onboardStep = 0;
function openOnboarding(){
  onboardStep = 0;
  renderOnboardStep();
  document.getElementById('onboardModalBack').classList.add('open');
}
function renderOnboardStep(){
  const step = ONBOARD_STEPS[onboardStep];
  document.getElementById('onboardStepContent').innerHTML =
    '<div class="onboard-icon">'+step.icon+'</div>' +
    '<div class="onboard-title">'+step.title+'</div>' +
    '<div class="onboard-body">'+step.body+'</div>' +
    (step.extraHtml || '');
  document.getElementById('onboardDots').innerHTML = ONBOARD_STEPS.map((s,i)=>'<span class="'+(i===onboardStep?'active':'')+'"></span>').join('');
  document.getElementById('onboardNextBtn').textContent = onboardStep===ONBOARD_STEPS.length-1 ? 'Get started' : 'Next';
  if(step.onRender) step.onRender();
}
function onboardNext(){
  if(onboardStep < ONBOARD_STEPS.length-1){ onboardStep++; renderOnboardStep(); }
  else { finishOnboarding(); }
}
function onboardSkip(){ finishOnboarding(); }
function finishOnboarding(){
  state.onboardingComplete = true;
  saveState();
  closeModal('onboardModalBack');
}
function resetAppSettingsOnly(){
  if(!confirm('Reset all Settings to defaults? Your tasks, XP and history are kept.')) return;
  const fresh = defaultState();
  state.settings = fresh.settings;
  applyAppearance(); applyAccessibility();
  saveState(); render(); renderSettingsPage();
  showToast('Settings reset to defaults');
}

/* ---- Settings page ---- */
let openSettingsGroups = { appearance:true };
let themePresetsExpanded = false;
function toggleThemePresetsExpanded(){ themePresetsExpanded = !themePresetsExpanded; renderSettingsPage(); }
const THEME_PRESET_FAVORITES = ['classic','midnight','honey','petal','meadow','butter','forest','ocean','minimal','office','mono','coral'];
function openSettingsGroup(id){ openSettingsGroups[id] = true; renderSettingsPage(); setTimeout(()=>{ const el=document.getElementById('sg-'+id); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 60); }
function toggleSettingsGroup(id){
  openSettingsGroups[id] = !openSettingsGroups[id];
  renderSettingsPage();
}
function sgroup(id, icon, label, bodyHtml){
  const open = !!openSettingsGroups[id];
  return '<div class="settings-group'+(open?' open':'')+'" id="sg-'+id+'">' +
    '<div class="settings-group-header" onclick="toggleSettingsGroup(\''+id+'\')"><div class="settings-group-title">'+icon+' '+label+'</div>' +
    '<svg class="settings-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>' +
    '<div class="settings-group-body">'+bodyHtml+'</div></div>';
}
function trow(label, sub, key, path, checked){
  return '<div class="toggle-row"><span class="toggle-row-label">'+escapeHtml(label)+(sub?'<span class="toggle-row-sub">'+escapeHtml(sub)+'</span>':'')+'</span>' +
    '<label class="switch"><input type="checkbox" '+(checked?'checked':'')+' onchange="setPref(\''+path+'\', this.checked)"><span class="switch-track"></span></label></div>';
}
function getPref(path){
  const parts = path.split('.'); let cur = state.settings;
  for(const p of parts){ if(!cur) return undefined; cur = cur[p]; }
  return cur;
}
function setPref(path, val){
  const parts = path.split('.'); let cur = state.settings;
  for(let i=0;i<parts.length-1;i++){ if(!cur[parts[i]]) cur[parts[i]]={}; cur = cur[parts[i]]; }
  cur[parts[parts.length-1]] = val;
  saveState();
  if(path.startsWith('appearance') || path==='animations.mode') applyAppearance();
  if(path.startsWith('accessibility')) applyAccessibility();
  if(path==='gamification.courtEnabled'){ state.courtEnabled = val; renderCourt(); }
  if(path==='notifications.dailyReminder' && val) requestNotifPermission();
}
function applyAppearance(){
  const theme = getPref('appearance.theme') || 'dark';
  let effective = theme;
  if(theme==='system'){ effective = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; }
  document.documentElement.setAttribute('data-theme', ['light','dark','cozy','custom'].includes(effective) ? effective : 'dark');
  document.body.setAttribute('data-theme', ['light','dark','cozy','custom'].includes(effective) ? effective : 'dark');
  const accent = getPref('appearance.accent') || '#E8B54D';
  document.documentElement.style.setProperty('--gold', accent);

  if(effective==='custom'){
    try{
      const c = (state.settings.appearance && state.settings.appearance.custom) || {};
      const bg = c.bg || '#0B0F17', card = c.card || '#141B28', card2 = c.card2 || '#1B2434';
      const text = ensureReadableText(c.text || '#F2F3F7', bg, card);
      document.documentElement.style.setProperty('--bg', bg);
      document.documentElement.style.setProperty('--card', card);
      document.documentElement.style.setProperty('--card-2', card2);
      document.documentElement.style.setProperty('--modal-bg', lightenHex(card, 8));
      document.documentElement.style.setProperty('--line', lightenHex(card2, 10));
      document.documentElement.style.setProperty('--text', text);
      document.documentElement.style.setProperty('--text-mute', mixHex(text, card, 0.45));
      document.documentElement.style.setProperty('--text-faint', mixHex(text, card, 0.7));
      const rgb = hexToRgb(card);
      document.documentElement.style.setProperty('--card-rgb', rgb.r+','+rgb.g+','+rgb.b);
    }catch(e){
      console.error('Custom theme failed to apply:', e);
    }
  } else {
    ['--bg','--card','--card-2','--modal-bg','--line','--text','--text-mute','--text-faint','--card-rgb'].forEach(v=>document.documentElement.style.removeProperty(v));
  }

  const corner = getPref('appearance.cornerStyle') || 'soft';
  document.body.classList.remove('corners-sharp','corners-soft','corners-round');
  document.body.classList.add('corners-'+corner);

  const glass = Number(getPref('appearance.glassIntensity')) || 0;
  document.body.classList.toggle('glass-on', glass>0);
  document.documentElement.style.setProperty('--glass-blur', (2 + glass*0.14) + 'px');

  const transparency = Number(getPref('appearance.transparency')) || 0;
  document.documentElement.style.setProperty('--card-alpha', (1 - transparency/210).toFixed(2));

  const glowIntensity = getPref('appearance.glowIntensity');
  document.documentElement.style.setProperty('--glow-alpha', ((glowIntensity==null?130:Number(glowIntensity))/100).toFixed(2));

  const animMode = (state.settings.animations && state.settings.animations.mode) || 'standard';
  document.body.classList.remove('anim-minimal','anim-standard','anim-rich');
  document.body.classList.add('anim-'+animMode);

  document.body.classList.toggle('card-style-flat', getPref('appearance.cardStyle')==='flat');
  document.body.classList.toggle('nav-icons-only', getPref('appearance.navIconsOnly')===true);

  document.body.classList.remove('icons-outline','icons-bold','icons-filled');
  document.body.classList.add('icons-'+(getPref('appearance.iconStyle')||'outline'));

  applyBackgroundLayer();
  applyBrightness();
}
const BG_PATTERNS = {
  dots:  { image:"radial-gradient(currentColor 1px, transparent 1.5px)", size:'20px 20px' },
  grid:  { image:"linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", size:'26px 26px' },
  lines: { image:"repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 13px)", size:'auto' },
  noise: { image:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", size:'200px 200px' }
};
function applyBackgroundLayer(){
  const layer = document.getElementById('appBgLayer');
  if(!layer) return;
  const a = state.settings.appearance || {};
  const style = a.bgStyle || 'none';
  const opacity = (a.bgOpacity!=null ? Number(a.bgOpacity) : 15) / 100;
  if(style==='image' && a.bgImageUrl){
    layer.style.color = '';
    layer.style.backgroundImage = 'url("'+a.bgImageUrl.replace(/"/g,'')+'")';
    layer.style.backgroundSize = 'cover';
    layer.style.backgroundPosition = 'center';
  } else if(BG_PATTERNS[style]){
    layer.style.color = 'var(--text)';
    layer.style.backgroundImage = BG_PATTERNS[style].image;
    layer.style.backgroundSize = BG_PATTERNS[style].size;
    layer.style.backgroundPosition = '';
  } else {
    layer.style.backgroundImage = 'none';
  }
  layer.style.opacity = (style==='none') ? 0 : opacity;
}
function applyBrightness(){
  const mainEl = document.querySelector('main');
  if(!mainEl) return;
  const b = state.settings.appearance && state.settings.appearance.brightness;
  const val = b!=null ? Number(b) : 100;
  const w = state.settings.appearance && state.settings.appearance.warmth;
  const warmth = w!=null ? Number(w) : 0;
  const filters = [];
  if(val!==100) filters.push('brightness('+(val/100).toFixed(2)+')');
  if(warmth>0){
    // Sepia shifts everything warm/amber; a touch of extra saturation keeps it from looking washed out or grey.
    filters.push('sepia('+(warmth*0.006).toFixed(3)+')');
    filters.push('saturate('+(1+warmth*0.0025).toFixed(3)+')');
  }
  mainEl.style.filter = filters.join(' ');
}
function onBgImageUrlInput(val){
  setPref('appearance.bgImageUrl', val);
  renderBgImagePreview(val);
}
function renderBgImagePreview(url){
  const wrap = document.getElementById('bgImagePreviewWrap');
  if(!wrap) return;
  const trimmed = (url||'').trim();
  if(!trimmed){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = '<div class="qa-hint" id="bgImagePreviewStatus" style="margin:0 0 6px;">Loading preview…</div>' +
    '<img src="'+escapeHtml(trimmed)+'" style="width:100%;max-height:120px;object-fit:cover;border-radius:12px;display:none;" ' +
    'onload="document.getElementById(\'bgImagePreviewStatus\').textContent=\'Looks good ✓\'; this.style.display=\'block\';" ' +
    'onerror="document.getElementById(\'bgImagePreviewStatus\').textContent=\'Could not load this image — check the URL and try Open below\';">';
}
function openBgImageLink(){
  const url = (document.getElementById('bgImageUrlInput')||{}).value || state.settings.appearance.bgImageUrl;
  if(!url || !url.trim()){ showToast('Paste a URL first'); return; }
  window.open(url.trim(), '_blank', 'noopener');
}
function setBgStyle(style){
  setPref('appearance.bgStyle', style);
  const curOpacity = state.settings.appearance.bgOpacity;
  if(style==='image' && (curOpacity==null || curOpacity<20)) setPref('appearance.bgOpacity', 45);
  renderSettingsPage();
}
function setCustomThemeColor(key, val){
  if(!state.settings.appearance.custom) state.settings.appearance.custom = {};
  state.settings.appearance.custom[key] = val;
  state.settings.appearance.theme = 'custom';
  state.settings.appearance.preset = 'custom';
  saveState();
  applyAppearance();
  renderSettingsPage();
}
function lightenHex(hex, amt){
  const {r,g,b} = hexToRgb(hex);
  const l = v => Math.max(0, Math.min(255, v + amt*2.55));
  return 'rgb('+Math.round(l(r))+','+Math.round(l(g))+','+Math.round(l(b))+')';
}
function relLuminance(hex){
  const {r,g,b} = hexToRgb(hex);
  const lin = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function contrastRatio(hexA, hexB){
  const lA = relLuminance(hexA), lB = relLuminance(hexB);
  const lighter = Math.max(lA,lB), darker = Math.min(lA,lB);
  return (lighter+0.05)/(darker+0.05);
}
function ensureReadableText(textHex, bgHex, secondSurfaceHex){
  // If contrast is too low against either surface text actually sits on, push
  // toward black or white — whichever gives the better worst-case contrast —
  // rather than silently leaving something hard to read.
  const okAgainstFirst = contrastRatio(textHex, bgHex) >= 4.5;
  const okAgainstSecond = secondSurfaceHex ? contrastRatio(textHex, secondSurfaceHex) >= 4.5 : true;
  if(okAgainstFirst && okAgainstSecond) return textHex;
  const worstIsLight = secondSurfaceHex
    ? (relLuminance(bgHex) + relLuminance(secondSurfaceHex))/2 > 0.5
    : relLuminance(bgHex) > 0.5;
  return worstIsLight ? '#14181F' : '#F5F6FA';
}
function mixHex(hexA, hexB, t){
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const m = k => Math.round(a[k]*(1-t) + b[k]*t);
  return 'rgb('+m('r')+','+m('g')+','+m('b')+')';
}
const THEME_PRESETS = {
  classic: { accent:'#E8B54D', theme:'dark' },
  midnight:{ accent:'#6FCBEA', theme:'dark' },
  forest:  { accent:'#35C6B4', theme:'dark' },
  ocean:   { accent:'#3C8FD6', theme:'dark' },
  sunset:  { accent:'#E0781E', theme:'dark' },
  amoled:  { accent:'#9B8CF0', theme:'dark' },
  minimal: { accent:'#8A93A8', theme:'light' },
  office:  { accent:'#5B7290', theme:'light' },
  graphite:{ accent:'#8C93A6', theme:'dark' },
  paper:   { accent:'#6B7280', theme:'light' },
  mono:    { accent:'#9CA3AF', theme:'dark' },
  // Nature
  sage:     { accent:'#8CA891', theme:'light' },
  moss:     { accent:'#6B8F71', theme:'dark' },
  lavender: { accent:'#A78BFA', theme:'dark' },
  lilac:    { accent:'#B497D6', theme:'light' },
  rose:     { accent:'#E38B9A', theme:'light' },
  coral:    { accent:'#FF7F6B', theme:'dark' },
  terracotta:{ accent:'#C1653A', theme:'light' },
  clay:     { accent:'#C97C4A', theme:'dark' },
  sand:     { accent:'#C9A66B', theme:'light' },
  spring:   { accent:'#7FC29B', theme:'light' },
  autumn:   { accent:'#D2691E', theme:'light' },
  redwood:  { accent:'#C97A63', theme:'dark' },
  glacier:  { accent:'#8FCBD9', theme:'dark' },
  canyon:   { accent:'#D97A3E', theme:'light' },
  // Sky & time of day
  dawn:  { accent:'#F2A65A', theme:'light' },
  dusk:  { accent:'#8B7FC0', theme:'dark' },
  noon:  { accent:'#4FA8D8', theme:'light' },
  storm: { accent:'#7C8FA3', theme:'dark' },
  aurora:{ accent:'#4FD8C4', theme:'dark' },
  // Retro & tech
  terminal:  { accent:'#39FF6E', theme:'dark' },
  vaporwave: { accent:'#FF6AD5', theme:'dark' },
  synthwave: { accent:'#F7418C', theme:'dark' },
  cassette:  { accent:'#FFB627', theme:'dark' },
  arcade:    { accent:'#22D3EE', theme:'dark' },
  // Coffee & cozy
  espresso: { accent:'#8B5E3C', theme:'light' },
  latte:    { accent:'#C8A27A', theme:'light' },
  cinnamon: { accent:'#B5652E', theme:'light' },
  cocoa:    { accent:'#B9906A', theme:'dark' },
  // Gemstones
  ruby:     { accent:'#E0466F', theme:'dark' },
  sapphire: { accent:'#4C7FD6', theme:'dark' },
  emerald:  { accent:'#2ECC8F', theme:'dark' },
  amethyst: { accent:'#A874E8', theme:'dark' },
  topaz:    { accent:'#D9A441', theme:'light' },
  jade:     { accent:'#4CAF7D', theme:'light' },
  // Metals & materials
  brass:   { accent:'#B5A155', theme:'light' },
  copper:  { accent:'#C17A50', theme:'light' },
  steel:   { accent:'#8FA3B8', theme:'dark' },
  pewter:  { accent:'#9C998F', theme:'light' },
  // Art & mood
  bauhaus: { accent:'#E0473F', theme:'light' },
  pastel:  { accent:'#F7A6C1', theme:'light' },
  // Cozy — warm cream backgrounds, soft pastel accents, homey rather than cool/techy
  honey:   { accent:'#D99A3F', theme:'cozy' },
  petal:   { accent:'#D98A98', theme:'cozy' },
  meadow:  { accent:'#7FA06B', theme:'cozy' },
  wisteria:{ accent:'#A98FC4', theme:'cozy' },
  butter:  { accent:'#D9B85C', theme:'cozy' },
  adobe:   { accent:'#BC7C5C', theme:'cozy' },
  cream:   { accent:'#C99A6B', theme:'cozy' }
};
function applyThemePreset(name){
  const p = THEME_PRESETS[name]; if(!p) return;
  state.settings.appearance.preset = name;
  state.settings.appearance.accent = p.accent;
  state.settings.appearance.theme = p.theme;
  saveState(); applyAppearance(); renderSettingsPage();
}
function applyAccessibility(){
  const a = state.settings.accessibility || {};
  document.body.classList.toggle('reduce-motion', !!a.reduceMotion);
  document.body.classList.toggle('high-contrast', !!a.highContrast);
  document.body.classList.toggle('colorblind-safe', !!a.colorBlindMode);
  document.body.classList.remove('text-size-sm','text-size-lg');
  if(a.textSize==='small') document.body.classList.add('text-size-sm');
  if(a.textSize==='large') document.body.classList.add('text-size-lg');
}
function requestNotifPermission(){
  if('Notification' in window && Notification.permission==='default'){ Notification.requestPermission(); }
}
function setAccent(hex, el){
  setPref('appearance.accent', hex);
  document.querySelectorAll('.accent-swatch').forEach(s=>s.classList.remove('active'));
  if(el) el.classList.add('active');
}
function setTheme(t){ setPref('appearance.theme', t); renderSettingsPage(); }
function setAnimMode(mode){ setPref('animations.mode', mode); renderSettingsPage(); }
function setAppLock(enabled){
  if(enabled){ document.getElementById('appLockPinInput').value=''; document.getElementById('appLockModalBack').classList.add('open'); }
  else { state.settings.privacy.appLockPin = null; setPref('privacy.appLockEnabled', false); renderSettingsPage(); }
}
function onLockPinInput(){
  const input = document.getElementById('lockPinInput');
  const val = input.value.trim();
  if(val.length<4) return;
  if(val === state.settings.privacy.appLockPin){
    document.getElementById('lockOverlay').classList.remove('open');
    document.getElementById('lockError').textContent = '';
    input.value = '';
  } else {
    document.getElementById('lockError').textContent = 'Incorrect PIN';
    input.value = '';
  }
}
function saveAppLockPin(){
  const pin = document.getElementById('appLockPinInput').value.trim();
  if(!/^\d{4}$/.test(pin)){ showToast('Enter a 4-digit PIN'); return; }
  state.settings.privacy.appLockPin = pin;
  state.settings.privacy.appLockEnabled = true;
  saveState();
  closeModal('appLockModalBack');
  renderSettingsPage();
  showToast('App lock enabled');
}
const HOME_CARD_LABELS = {
  courtAlert:'Missed Task Alert', aiSuggestions:'AI Suggestions', summary:'XP Card (Today Summary)', focus:"Today's Focus", streak:'Streak Card',
  nextUp:'Next Event', calendarPreview:'Calendar Preview', dailyQuest:'Daily Missions'
};
const LAYOUT_PRESETS = {
  office: {
    label:'Office', desc:'Looks like a plain productivity app, not a game',
    apply: ()=>{
      state.settings.home.visible = { courtAlert:true, aiSuggestions:false, summary:false, focus:true, streak:false, nextUp:true, calendarPreview:true, dailyQuest:false };
      state.settings.gamification = { ...state.settings.gamification, showSkillXp:false, showLevelProgress:false, showDailyQuests:false, showWeeklyChallenges:false, showLifeBalanceWheel:false, achievementPopups:false, questNotif:false };
      state.settings.animations.mode = 'minimal';
      Object.assign(state.settings.animations, { confetti:false, particles:false, levelUpAnim:false });
      state.settings.appearance.preset = 'office';
      state.settings.appearance.accent = THEME_PRESETS.office.accent;
      state.settings.appearance.theme = THEME_PRESETS.office.theme;
      state.settings.appearance.cornerStyle = 'sharp';
      state.settings.appearance.glassIntensity = 0;
      state.settings.appearance.cardStyle = 'flat';
    }
  },
  minimal: {
    label:'Minimal', desc:'Just today\'s focus, tasks, and AI insight',
    apply: ()=>{
      state.settings.home.visible = { courtAlert:true, aiSuggestions:true, summary:false, focus:true, streak:false, nextUp:false, calendarPreview:false, dailyQuest:false };
      state.settings.gamification = { ...state.settings.gamification, showSkillXp:false, showLevelProgress:false, showDailyQuests:false, showWeeklyChallenges:false, showLifeBalanceWheel:false, achievementPopups:false, questNotif:false };
      state.settings.animations.mode = 'minimal';
      Object.assign(state.settings.animations, { confetti:false, particles:false, levelUpAnim:false });
    }
  },
  balanced: {
    label:'Balanced', desc:'Productivity first, XP subtle', recommended:true,
    apply: ()=>{
      state.settings.home.visible = { aiSuggestions:true, summary:true, focus:true, streak:true, nextUp:true, calendarPreview:false, dailyQuest:true };
      state.settings.gamification = { ...state.settings.gamification, showSkillXp:true, showLevelProgress:true, showDailyQuests:true, showWeeklyChallenges:true, showLifeBalanceWheel:true, achievementPopups:true, questNotif:true };
      state.settings.animations.mode = 'standard';
      Object.assign(state.settings.animations, { confetti:true, particles:true, levelUpAnim:true });
    }
  },
  rpg: {
    label:'RPG', desc:'XP, skills & quests front and centre',
    apply: ()=>{
      state.settings.home.visible = { aiSuggestions:true, summary:true, focus:true, streak:true, nextUp:true, calendarPreview:true, dailyQuest:true };
      state.settings.gamification = { ...state.settings.gamification, showSkillXp:true, showLevelProgress:true, showDailyQuests:true, showWeeklyChallenges:true, showLifeBalanceWheel:true, achievementPopups:true, questNotif:true };
      state.settings.animations.mode = 'rich';
      Object.assign(state.settings.animations, { confetti:true, particles:true, levelUpAnim:true });
    }
  }
};
function applyLayoutPreset(name){
  const p = LAYOUT_PRESETS[name]; if(!p) return;
  p.apply();
  state.settings.home._userCustomized = true;
  state.settings.layoutPreset = name;
  saveState(); applyAppearance(); render(); renderSettingsPage();
  showToast(p.label+' layout applied');
}
let draggedCardKey = null;
function onCardDragStart(e, key){ draggedCardKey = key; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; }
function onCardDragEnd(e){ e.currentTarget.classList.remove('dragging'); }
function onCardDragOver(e){ e.preventDefault(); }
function onCardDrop(e, targetKey){
  e.preventDefault();
  if(!draggedCardKey || draggedCardKey===targetKey) return;
  const order = state.settings.home.order.slice();
  const from = order.indexOf(draggedCardKey), to = order.indexOf(targetKey);
  if(from<0 || to<0) return;
  order.splice(from,1); order.splice(to,0,draggedCardKey);
  state.settings.home.order = order;
  saveState(); render(); renderSettingsPage();
}
function toggleCardCollapse(key){
  if(!state.settings.home.collapsed) state.settings.home.collapsed = {};
  state.settings.home.collapsed[key] = !state.settings.home.collapsed[key];
  saveState();
  applyCardCollapseStates();
}
function applyCardCollapseStates(){
  const collapsed = (state.settings.home && state.settings.home.collapsed) || {};
  document.querySelectorAll('.collapsible-card').forEach(el=>{
    const key = el.getAttribute('data-card');
    el.classList.toggle('card-collapsed', !!collapsed[key]);
  });
}
function toggleHomeCard(key, val){
  if(!state.settings.home.visible) state.settings.home.visible = {};
  state.settings.home.visible[key] = val;
  state.settings.home._userCustomized = true;
  saveState(); render();
}
function setHomeView(v){
  state.settings.home.view = v;
  saveState(); applyHomeLayout(); renderSettingsPage();
}
const SETTINGS_CATEGORIES = {
  personalization: { label:'Personalization', icon:'✨', groups:['appearance','home','layout','animations'] },
  productivity: { label:'Productivity', icon:'🧠', groups:['ai','calendar','widgets'] },
  experience: { label:'Experience', icon:'🎮', groups:['gamification','notifications','sound','accessibility'] },
  privacyData: { label:'Privacy & Data', icon:'🔒', groups:['privacy','data','advanced'] }
};
const GROUP_LABELS = { layout:'Layout presets', home:'Home screen', appearance:'Appearance', animations:'Animations', notifications:'Notifications', sound:'Sound & haptics', gamification:'Gamification', ai:'AI preferences', calendar:'Calendar & planner', privacy:'Privacy', accessibility:'Accessibility', widgets:'Widgets & quick actions', data:'Data', advanced:'Advanced' };
let settingsNav = { category:null, search:'' };
function settingsOpenCategory(key, focusGroup){
  settingsNav.category = key; settingsNav.search = '';
  if(focusGroup) openSettingsGroups[focusGroup] = true;
  renderSettingsPage();
}
function settingsGoCategories(){
  settingsNav.category = null; settingsNav.search = '';
  renderSettingsPage();
}
function settingsSearchInput(val){
  settingsNav.search = val;
  const caret = document.getElementById('settingsSearchInput') ? document.getElementById('settingsSearchInput').selectionStart : null;
  renderSettingsPage();
  const el = document.getElementById('settingsSearchInput');
  if(el){ el.focus(); if(caret!=null) el.setSelectionRange(caret, caret); }
}
function settingsCycleTheme(){
  const cur = (state.settings.appearance && state.settings.appearance.theme) || 'dark';
  setTheme(cur==='dark' ? 'light' : cur==='light' ? 'system' : 'dark');
  renderSettingsPage();
}
function settingsToggleXpEffects(){
  const cur = state.settings.gamification ? state.settings.gamification.showLevelProgress!==false : true;
  setPref('gamification.showLevelProgress', !cur);
  renderSettingsPage();
}
function renderSettingsPage(){
  const wrap = document.getElementById('settingsWrap');
  const s = state.settings;
  const theme = (s.appearance && s.appearance.theme) || 'dark';
  const accent = (s.appearance && s.appearance.accent) || '#E8B54D';
  const preset = (s.appearance && s.appearance.preset) || 'classic';
  const homeOrder = (s.home && s.home.order) || defaultState().settings.home.order;
  const homeVisible = (s.home && s.home.visible) || {};
  const homeView = (s.home && s.home.view) || 'comfortable';
  const animMode = (s.animations && s.animations.mode) || 'standard';

  const groupHtml = {};

  groupHtml.layout = sgroup('layout','💾','Layout presets',
    '<div class="layout-preset-row">' + Object.entries(LAYOUT_PRESETS).map(([key,p])=>
      '<button class="layout-preset-btn'+((s.layoutPreset||'balanced')===key?' active':'')+'" onclick="applyLayoutPreset(\''+key+'\')">'+p.label+(p.recommended?' ★':'')+'<div class="layout-preset-desc">'+p.desc+'</div></button>'
    ).join('') + '</div>' +
    '<div class="info-box">Applies a bundle of Home, Gamification and Animation settings at once. You can still fine-tune anything below afterwards.</div>'
  );

  groupHtml.home = sgroup('home','🏠','Home screen',
    '<div class="toggle-row-label" style="margin:4px 0 2px;">Show on Home</div>' +
    homeOrder.map(key=> trow(HOME_CARD_LABELS[key], '', '', 'home.visible.'+key, homeVisible[key]!==false)
      .replace('setPref(\'home.visible.'+key+'\', this.checked)', 'toggleHomeCard(\''+key+'\', this.checked)')
    ).join('') +
    '<div class="toggle-row-label" style="margin:14px 0 2px;">Density</div>' +
    '<div class="theme-seg">' +
      '<button class="'+(homeView==='compact'?'active':'')+'" onclick="setHomeView(\'compact\')">Compact</button>' +
      '<button class="'+(homeView==='comfortable'?'active':'')+'" onclick="setHomeView(\'comfortable\')">Comfortable</button>' +
      '<button class="'+(homeView==='detailed'?'active':'')+'" onclick="setHomeView(\'detailed\')">Detailed</button>' +
    '</div>' +
    '<div class="toggle-row-label" style="margin:14px 0 2px;">Reorder cards</div>' +
    '<div class="reorder-list">' + homeOrder.map(key=>
      '<div class="reorder-item" draggable="true" ondragstart="onCardDragStart(event,\''+key+'\')" ondragend="onCardDragEnd(event)" ondragover="onCardDragOver(event)" ondrop="onCardDrop(event,\''+key+'\')">' +
        '<span class="ro-handle">⠿</span><span>'+HOME_CARD_LABELS[key]+'</span>' +
      '</div>'
    ).join('') + '</div>' +
    '<div class="info-box">Drag a card to reorder it. Toggles above control what shows without affecting order.</div>'
  );

  groupHtml.appearance = sgroup('appearance','🎨','Appearance',
    '<div class="theme-seg">' +
      '<button class="'+(theme==='light'?'active':'')+'" onclick="setTheme(\'light\')">Light</button>' +
      '<button class="'+(theme==='dark'?'active':'')+'" onclick="setTheme(\'dark\')">Dark</button>' +
      '<button class="'+(theme==='system'?'active':'')+'" onclick="setTheme(\'system\')">System</button>' +
    '</div>' +
    '<div class="toggle-row-label" style="margin-top:10px;">Colour</div>' +
    '<div class="theme-swatch-grid">' + (themePresetsExpanded ? Object.keys(THEME_PRESETS) : THEME_PRESET_FAVORITES).map(k=>
      '<button type="button" class="theme-swatch-dot'+(preset===k?' active':'')+'" style="background:'+THEME_PRESETS[k].accent+'" title="'+k[0].toUpperCase()+k.slice(1)+'" onclick="applyThemePreset(\''+k+'\')"></button>'
    ).join('') + '</div>' +
    '<button type="button" class="theme-swatch-more" onclick="toggleThemePresetsExpanded()">'+(themePresetsExpanded ? 'Show fewer colours' : 'Show all '+Object.keys(THEME_PRESETS).length+' colours')+'</button>' +
    '<div class="select-row" style="margin-top:12px;"><span>Rounded corner style</span><select onchange="setPref(\'appearance.cornerStyle\', this.value)">' +
      ['sharp','soft','round'].map(v=>'<option value="'+v+'"'+((s.appearance&&s.appearance.cornerStyle||'soft')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    '<div class="select-row"><span>Home card style</span><select onchange="setPref(\'appearance.cardStyle\', this.value)">' +
      [['boxed','Boxed'],['flat','Flat (minimal, dividers)']].map(([v,label])=>'<option value="'+v+'"'+((s.appearance&&s.appearance.cardStyle||'boxed')===v?' selected':'')+'>'+label+'</option>').join('') +
    '</select></div>' +
    trow('Icon-only navigation','Hide text labels on the bottom nav bar','','appearance.navIconsOnly', getPref('appearance.navIconsOnly')===true) +
    '<div class="select-row"><span>Icon style</span><select onchange="setPref(\'appearance.iconStyle\', this.value)">' +
      [['outline','Outline'],['bold','Bold'],['filled','Filled']].map(([v,label])=>'<option value="'+v+'"'+((s.appearance&&s.appearance.iconStyle||'outline')===v?' selected':'')+'>'+label+'</option>').join('') +
    '</select></div>' +
    '<div class="toggle-row-label" style="margin-top:16px;">Custom colours <span style="color:var(--text-faint);font-weight:400;text-transform:none;letter-spacing:0;">— every layer, your choice</span></div>' +
    '<div class="ctg-list">' +
      [['bg','Background'],['card','Cards'],['card2','Secondary cards'],['text','Text'],['accent','Accent']].map(([key,label])=>{
        const val = key==='accent' ? accent : ((s.appearance&&s.appearance.custom&&s.appearance.custom[key]) || {bg:'#0B0F17',card:'#141B28',card2:'#1B2434',text:'#F2F3F7'}[key]);
        const handler = key==='accent' ? "setPref('appearance.accent', this.value)" : "setCustomThemeColor('"+key+"', this.value)";
        return '<label class="ctg-row"><span class="ctg-swatch-lg" style="background:'+val+';"><input type="color" value="'+val+'" oninput="'+handler+'"></span><span class="ctg-row-label">'+label+'</span><span class="ctg-row-hex">'+val.toUpperCase()+'</span></label>';
      }).join('') +
    '</div>' +
    (preset==='custom' ? '<div class="qa-hint" style="margin-top:8px;">Custom theme active. Pick any preset above to switch back.</div>' : '<div class="qa-hint" style="margin-top:8px;">Adjusting any colour above switches you to your own custom theme.</div>') +
    '<div class="toggle-row"><span class="toggle-row-label">Glass effect intensity</span><input type="range" min="0" max="100" value="'+(Number(s.appearance&&s.appearance.glassIntensity)||0)+'" oninput="setPref(\'appearance.glassIntensity\', this.value)" style="width:120px"></div>' +
    '<div class="toggle-row"><span class="toggle-row-label">Transparency level</span><input type="range" min="0" max="100" value="'+(Number(s.appearance&&s.appearance.transparency)||0)+'" oninput="setPref(\'appearance.transparency\', this.value)" style="width:120px"></div>' +
    '<div class="toggle-row"><span class="toggle-row-label">Glow intensity</span><input type="range" min="0" max="200" value="'+(s.appearance&&s.appearance.glowIntensity!=null?Number(s.appearance.glowIntensity):130)+'" oninput="setPref(\'appearance.glowIntensity\', this.value)" style="width:120px"></div>' +
    '<div class="toggle-row"><span class="toggle-row-label">Brightness</span><input type="range" min="70" max="130" value="'+(s.appearance&&s.appearance.brightness!=null?Number(s.appearance.brightness):100)+'" oninput="setPref(\'appearance.brightness\', this.value)" style="width:120px"></div>' +
    '<div class="toggle-row"><span class="toggle-row-label">Warmth</span><input type="range" min="0" max="100" value="'+(s.appearance&&s.appearance.warmth!=null?Number(s.appearance.warmth):0)+'" oninput="setPref(\'appearance.warmth\', this.value)" style="width:120px"></div>' +
    '<div class="toggle-row-label" style="margin-top:16px;">Background</div>' +
    '<div class="theme-seg" style="flex-wrap:wrap;height:auto;">' +
      [['none','None'],['dots','Dots'],['grid','Grid'],['lines','Lines'],['noise','Noise'],['image','Image']].map(([v,label])=>
        '<button class="'+((s.appearance&&s.appearance.bgStyle||'none')===v?'active':'')+'" onclick="setBgStyle(\''+v+'\')">'+label+'</button>'
      ).join('') +
    '</div>' +
    ((s.appearance&&s.appearance.bgStyle&&s.appearance.bgStyle!=='none') ? (
      '<div class="toggle-row" style="margin-top:6px;"><span class="toggle-row-label">Background opacity</span><input type="range" min="2" max="'+(s.appearance.bgStyle==='image'?100:30)+'" value="'+(s.appearance&&s.appearance.bgOpacity!=null?Number(s.appearance.bgOpacity):(s.appearance.bgStyle==='image'?45:8))+'" oninput="setPref(\'appearance.bgOpacity\', this.value)" style="width:120px"></div>' +
      (s.appearance.bgStyle==='image' ? (
        '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;">' +
          '<input type="text" class="settings-search-input" id="bgImageUrlInput" style="margin:0;flex:1;" placeholder="Paste an image URL…" value="'+escapeHtml(s.appearance.bgImageUrl||'')+'" oninput="onBgImageUrlInput(this.value)">' +
          '<button type="button" class="qa-enhance-btn" style="width:auto;padding:11px 16px;margin:0;white-space:nowrap;" onclick="openBgImageLink()">🔗 Open</button>' +
        '</div>' +
        '<div id="bgImagePreviewWrap" style="margin-top:8px;"></div>' +
        '<div class="qa-hint" style="margin-top:6px;">Must start with <b>https://</b> (not http://) and link directly to an image file. Some sites (Instagram, Pinterest) block their images from being used this way — a direct link from somewhere like Imgur usually works.</div>'
      ) : '')
    ) : '') +
    '<div class="action-row disabled" style="padding-top:10px;"><div class="action-row-left"><span class="ar-icon">📱</span>App icon</div><span class="soon-badge">Future</span></div>'
  );

  groupHtml.animations = sgroup('animations','✨','Animations',
    '<div class="toggle-row-label" style="margin:4px 0 2px;">Animation mode</div>' +
    '<div class="theme-seg">' +
      '<button class="'+(animMode==='minimal'?'active':'')+'" onclick="setAnimMode(\'minimal\')">Minimal</button>' +
      '<button class="'+(animMode==='standard'?'active':'')+'" onclick="setAnimMode(\'standard\')">Standard</button>' +
      '<button class="'+(animMode==='rich'?'active':'')+'" onclick="setAnimMode(\'rich\')">Rich</button>' +
    '</div>' +
    trow('XP animations','','','animations.xpAnim', s.animations ? s.animations.xpAnim!==false : true) +
    trow('Coin animations','','','animations.coinAnim', s.animations ? s.animations.coinAnim!==false : true) +
    trow('Level up celebrations','','','animations.levelUpAnim', s.animations ? s.animations.levelUpAnim!==false : true) +
    trow('Mastery animations','','','animations.achievementAnim', s.animations ? s.animations.achievementAnim!==false : true) +
    trow('Quest animations','','','animations.questAnim', s.animations ? s.animations.questAnim!==false : true) +
    trow('Confetti effects','','','animations.confetti', s.animations ? s.animations.confetti!==false : true) +
    trow('Particle effects','','','animations.particles', s.animations ? s.animations.particles!==false : true) +
    trow('Screen transitions','','','animations.screenTransitions', s.animations ? s.animations.screenTransitions!==false : true)
  );

  groupHtml.notifications = sgroup('notifications','🔔','Notifications',
    '<div class="toggle-row"><span class="toggle-row-label">Task reminders (browser notifications)</span></div>' +
    '<div class="sync-status" style="margin-bottom:10px;"><span class="sync-dot'+(typeof Notification!=='undefined'&&Notification.permission==='granted'?' on':'')+'"></span><span>'+(typeof Notification==='undefined'?'Not supported in this browser':Notification.permission==='granted'?'Enabled ✓':Notification.permission==='denied'?'Blocked — allow notifications for this site in your browser settings':'Not enabled yet')+'</span></div>' +
    (typeof Notification!=='undefined' && Notification.permission!=='granted' ? '<button class="qa-enhance-btn" style="margin:0 0 12px;" onclick="requestReminderPermission()">Enable reminders</button>' : '') +
    trow('Daily reminder','Ping once a day to check in','','notifications.dailyReminder', !!(s.notifications&&s.notifications.dailyReminder)) +
    trow('Smart AI reminders','Nudges timed to your habits','','notifications.smartAi', !!(s.notifications&&s.notifications.smartAi)) +
    trow('Study reminders','','','notifications.study', !!(s.notifications&&s.notifications.study)) +
    trow('Habit reminders','','','notifications.habit', !!(s.notifications&&s.notifications.habit)) +
    trow('Streak warnings','Alert before a streak breaks','','notifications.streakWarnings', !!(s.notifications&&s.notifications.streakWarnings)) +
    '<div class="select-row"><span>Quiet hours</span><span><input type="text" style="width:110px" value="'+escapeHtml((s.notifications&&s.notifications.quietHours)||'22:00–07:00')+'" onchange="setPref(\'notifications.quietHours\', this.value)"></span></div>' +
    '<div class="info-box">Notifications fire only while this tab is open in your browser — this is a local app with no push server. Task reminders (set per-task in Quick Add) show in-app on Home either way.</div>'
  );

  groupHtml.sound = sgroup('sound','🔊','Sound &amp; haptics',
    '<div class="toggle-row-label" style="margin:2px 0 6px;">Sound mode</div>' +
    '<div class="theme-seg">' +
      '<button class="'+((s.soundMode||'immersive')==='silent'?'active':'')+'" onclick="setSoundMode(\'silent\')">🔇 Silent</button>' +
      '<button class="'+((s.soundMode||'immersive')==='minimal'?'active':'')+'" onclick="setSoundMode(\'minimal\')">🔔 Minimal</button>' +
      '<button class="'+((s.soundMode||'immersive')==='immersive'?'active':'')+'" onclick="setSoundMode(\'immersive\')">✨ Immersive</button>' +
    '</div>' +
    '<div class="qa-hint" style="margin:6px 0 0;">Minimal plays only for level-ups, achievements, and fines. Immersive plays for everything, including small task completions and navigation.</div>' +
    '<div class="toggle-row"><span class="toggle-row-label">Volume</span><input type="range" min="0" max="100" value="'+Math.round((s.soundVolume!=null?s.soundVolume:0.6)*100)+'" oninput="setVolume(this.value)" onchange="previewVolume()" style="width:120px"></div>' +
    trow('Enable haptics','','','hapticOn', !!s.hapticOn) +
    '<div class="select-row"><span>Haptic strength</span><select onchange="setPref(\'hapticStrength\', this.value)">' +
      ['light','medium','strong'].map(v=>'<option value="'+v+'"'+((s.hapticStrength||'medium')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🎵</span>Sound pack</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🔔</span>Custom notification sound</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🎺</span>Custom level up sound</div><span class="soon-badge">Future</span></div>'
  );

  groupHtml.gamification = sgroup('gamification','🎮','Gamification',
    trow('Show XP pop-ups','','','gamification.xpAnim', s.gamification ? s.gamification.xpAnim!==false : true) +
    trow('Show coin pop-ups','','','gamification.coinAnim', s.gamification ? s.gamification.coinAnim!==false : true) +
    trow('Show skill XP','','','gamification.showSkillXp', s.gamification ? s.gamification.showSkillXp!==false : true) +
    trow('Show level progress','','','gamification.showLevelProgress', s.gamification ? s.gamification.showLevelProgress!==false : true) +
    trow('Show daily quests','','','gamification.showDailyQuests', s.gamification ? s.gamification.showDailyQuests!==false : true) +
    trow('Show weekly challenges','','','gamification.showWeeklyChallenges', s.gamification ? s.gamification.showWeeklyChallenges!==false : true) +
    trow('Mastery notifications','','','gamification.achievementPopups', s.gamification ? s.gamification.achievementPopups!==false : true) +
    trow('Enable fine system','Coin fines for logged bad habits','','gamification.fineSystem', s.gamification ? s.gamification.fineSystem!==false : true) +
    trow('Enable Accountability Court','','','gamification.courtEnabled', state.courtEnabled!==false) +
    trow('Show Life Balance Wheel','','','gamification.showLifeBalanceWheel', s.gamification ? s.gamification.showLifeBalanceWheel!==false : true)
  );

  groupHtml.ai = sgroup('ai','🤖','AI preferences',
    trow('AI daily planning','','','ai.dailyPlanning', !!(s.ai&&s.ai.dailyPlanning)) +
    trow('AI suggestions','','','ai.suggestions', s.ai ? s.ai.suggestions!==false : true) +
    trow('AI smart scheduling','','','ai.smartScheduling', !!(s.ai&&s.ai.smartScheduling)) +
    trow('AI memory timeline','','','ai.memoryTimeline', !!(s.ai&&s.ai.memoryTimeline)) +
    trow('AI task classification','Category + skill XP split per task','','ai.autoClassification', s.ai ? s.ai.autoClassification!==false : true) +
    '<div class="select-row"><span>AI reminder frequency</span><select onchange="setPref(\'ai.reminderFrequency\', this.value)">' +
      ['low','normal','high'].map(v=>'<option value="'+v+'"'+((s.ai&&s.ai.reminderFrequency||'normal')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    trow('AI motivation messages','','','ai.motivationMessages', s.ai ? s.ai.motivationMessages!==false : true) +
    '<div class="select-row"><span>AI coaching style</span><select onchange="setPref(\'ai.coachingStyle\', this.value)">' +
      ['encouraging','balanced','direct'].map(v=>'<option value="'+v+'"'+((s.ai&&s.ai.coachingStyle||'balanced')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    trow('Smart categorisation','','','ai.smartCategorization', s.ai ? s.ai.smartCategorization!==false : true) +
    trow('Automatic daily task generation','','','ai.autoDailyGen', s.ai ? s.ai.autoDailyGen!==false : true) +
    '<div class="action-row" onclick="openSyncModal()"><div class="action-row-left"><span class="ar-icon">🔑</span>Anthropic API key</div>'+chevSvg()+'</div>'
  );

  groupHtml.calendar = sgroup('calendar','🗓️','Calendar &amp; planner',
    '<div class="select-row"><span>Week starts on</span><select onchange="setPref(\'calendar.weekStart\', this.value)">' +
      '<option value="monday"'+((!s.calendar||s.calendar.weekStart!=='sunday')?' selected':'')+'>Monday</option>' +
      '<option value="sunday"'+((s.calendar&&s.calendar.weekStart==='sunday')?' selected':'')+'>Sunday</option></select></div>' +
    '<div class="select-row"><span>Time format</span><select onchange="setPref(\'calendar.timeFormat\', this.value)">' +
      '<option value="24"'+((!s.calendar||s.calendar.timeFormat!=='12')?' selected':'')+'>24-hour</option>' +
      '<option value="12"'+((s.calendar&&s.calendar.timeFormat==='12')?' selected':'')+'>12-hour</option></select></div>' +
    '<div class="select-row"><span>Default task length</span><select onchange="setPref(\'calendar.defaultDuration\', this.value)">' +
      ['15 min','30 min','45 min','60 min'].map(v=>'<option value="'+v+'"'+((s.calendar&&s.calendar.defaultDuration===v)?' selected':'')+'>'+v+'</option>').join('') +
    '</select></div>' +
    trow('Auto-generate daily tasks','','','ai.autoDailyGen', s.ai ? s.ai.autoDailyGen!==false : true) +
    trow('Auto-schedule recurring tasks','','','calendar.autoSchedule', s.calendar ? s.calendar.autoSchedule!==false : true) +
    trow('Auto-move missed tasks','Roll incomplete tasks to today','','calendar.autoMoveMissed', s.calendar ? s.calendar.autoMoveMissed!==false : true) +
    '<div class="select-row"><span>Calendar density</span><select onchange="setPref(\'calendar.density\', this.value)">' +
      ['compact','standard','detailed'].map(v=>'<option value="'+v+'"'+((s.calendar&&s.calendar.density||'standard')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    '<div class="toggle-row-label" style="margin-top:16px;">Google Calendar sync (one-way)</div>' +
    '<div class="sync-status" style="margin-bottom:10px;"><span class="sync-dot'+((s.calendar&&s.calendar.googleSyncEnabled&&gcalAccessToken)?' on':'')+'"></span><span>'+((s.calendar&&s.calendar.googleSyncEnabled)?(gcalAccessToken?'Connected ✓':'Reconnecting…'):'Not connected')+'</span></div>' +
    ((s.calendar&&s.calendar.googleSyncEnabled)
      ? '<button class="settings-danger-btn" onclick="disconnectGoogleCalendar()">Disconnect</button>'
      : '<button class="qa-enhance-btn" style="margin:0;" onclick="connectGoogleCalendar()">Connect Google Calendar</button>') +
    '<div class="qa-hint" style="margin-top:8px;">Tasks with a due date get pushed to your Google Calendar automatically once connected. One-way only — editing or deleting the event in Google Calendar doesn\'t change the task, and vice versa.</div>'
  );

  groupHtml.privacy = sgroup('privacy','🔐','Privacy',
    '<div class="toggle-row"><span class="toggle-row-label">Lock app with PIN<span class="toggle-row-sub">Basic on-device lock (not real biometrics)</span></span>' +
      '<label class="switch"><input type="checkbox" '+((s.privacy&&s.privacy.appLockEnabled)?'checked':'')+' onchange="setAppLock(this.checked)"><span class="switch-track"></span></label></div>' +
    trow('Hide sensitive info','Blur XP/coin values until tapped','','privacy.hideSensitive', !!(s.privacy&&s.privacy.hideSensitive)) +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">☁️</span>Cloud sync</div><span class="soon-badge">Future</span></div>' +
    '<div class="info-box">All data lives in this browser\'s local storage on this device only, unless you configure a relay URL.</div>'
  );

  groupHtml.accessibility = sgroup('accessibility','♿','Accessibility',
    '<div class="select-row"><span>Text size</span><select onchange="setPref(\'accessibility.textSize\', this.value)">' +
      ['small','medium','large'].map(v=>'<option value="'+v+'"'+(((s.accessibility&&s.accessibility.textSize)||'medium')===v?' selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('') +
    '</select></div>' +
    trow('Reduce motion','','','accessibility.reduceMotion', !!(s.accessibility&&s.accessibility.reduceMotion)) +
    trow('High contrast','','','accessibility.highContrast', !!(s.accessibility&&s.accessibility.highContrast)) +
    trow('Colour blind mode','Adjusts status colours app-wide','','accessibility.colorBlindMode', !!(s.accessibility&&s.accessibility.colorBlindMode))
  );

  groupHtml.widgets = sgroup('widgets','🧩','Widgets &amp; quick actions',
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🔒</span>Lock screen widget</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">📱</span>Home screen widget</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">➕</span>Quick add task</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">⏱️</span>Quick start focus session</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">📊</span>Daily progress widget</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">🔥</span>Streak widget</div><span class="soon-badge">Future</span></div>' +
    '<div class="action-row disabled"><div class="action-row-left"><span class="ar-icon">⭐</span>XP widget</div><span class="soon-badge">Future</span></div>' +
    '<div class="info-box">Widgets need native OS integration, which a browser-based app can\'t provide — these are placeholders for a future native build.</div>'
  );

  groupHtml.data = sgroup('data','📦','Data',
    '<div class="action-row" onclick="backupData()"><div class="action-row-left"><span class="ar-icon">📤</span>Export data</div>'+chevSvg()+'</div>' +
    '<div class="action-row" onclick="document.getElementById(\'importFileInput\').click()"><div class="action-row-left"><span class="ar-icon">📥</span>Import data</div>'+chevSvg()+'</div>' +
    '<input type="file" id="importFileInput" accept="application/json" style="display:none" onchange="importDataFile(this)">' +
    '<div class="action-row" onclick="backupData()"><div class="action-row-left"><span class="ar-icon">💾</span>Backup</div>'+chevSvg()+'</div>' +
    '<div class="action-row" onclick="document.getElementById(\'importFileInput\').click()"><div class="action-row-left"><span class="ar-icon">♻️</span>Restore backup</div>'+chevSvg()+'</div>' +
    '<div class="action-row" onclick="clearCache()"><div class="action-row-left"><span class="ar-icon">🧹</span>Clear cache</div>'+chevSvg()+'</div>'
  );

  groupHtml.advanced = sgroup('advanced','🛠️','Advanced',
    trow('Beta features','','','advanced.betaFeatures', !!(s.advanced&&s.advanced.betaFeatures)) +
    trow('Developer options','Show raw state in console','','advanced.devOptions', !!(s.advanced&&s.advanced.devOptions)) +
    '<div class="action-row" onclick="resetTutorial()"><div class="action-row-left"><span class="ar-icon">🔄</span>Reset tutorial</div>'+chevSvg()+'</div>' +
    '<button class="settings-danger-btn" onclick="resetAppSettingsOnly()">Reset app settings</button>'
  );

  const themeIcon = theme==='light' ? '☀️' : theme==='system' ? '🖥️' : '🌙';
  const xpEffectsOn = s.gamification ? s.gamification.showLevelProgress!==false : true;
  const quickSettingsHtml =
    '<div class="qs-row">' +
      '<button type="button" class="qs-chip" onclick="settingsCycleTheme()">'+themeIcon+' <span>'+theme[0].toUpperCase()+theme.slice(1)+'</span></button>' +
      '<button type="button" class="qs-chip" onclick="settingsOpenCategory(\'personalization\',\'appearance\')"><span class="qs-dot" style="background:'+accent+'"></span> <span>Accent</span></button>' +
      '<button type="button" class="qs-chip" onclick="settingsToggleXpEffects()">🎮 <span>XP FX '+(xpEffectsOn?'On':'Off')+'</span></button>' +
      '<button type="button" class="qs-chip" onclick="settingsOpenCategory(\'productivity\',\'ai\')">🤖 <span>AI</span></button>' +
      '<button type="button" class="qs-chip" onclick="settingsOpenCategory(\'productivity\',\'calendar\')">📅 <span>Calendar</span></button>' +
    '</div>';

  const headerHtml =
    '<div class="settings-hero">' +
      '<div class="settings-hero-title">Settings</div>' +
      '<div class="settings-hero-sub">Customise your workspace and experience</div>' +
    '</div>' +
    '<input type="text" class="settings-search-input" id="settingsSearchInput" placeholder="Search settings…" value="'+escapeHtml(settingsNav.search)+'" oninput="settingsSearchInput(this.value)">' +
    quickSettingsHtml;

  let html = headerHtml;
  const q = settingsNav.search.trim().toLowerCase();
  if(q){
    const matches = Object.keys(GROUP_LABELS).filter(id=>GROUP_LABELS[id].toLowerCase().includes(q));
    html += '<div class="settings-search-results-label">'+matches.length+' result'+(matches.length===1?'':'s')+'</div>';
    html += matches.length ? matches.map(id=>groupHtml[id]).join('') : '<div class="empty">No settings match "'+escapeHtml(settingsNav.search)+'"</div>';
  } else if(settingsNav.category && SETTINGS_CATEGORIES[settingsNav.category]){
    const cat = SETTINGS_CATEGORIES[settingsNav.category];
    html += '<button type="button" class="settings-back-btn" onclick="settingsGoCategories()">‹ All Settings</button>';
    html += '<div class="settings-category-title">'+cat.icon+' '+cat.label+'</div>';
    html += cat.groups.map(id=>groupHtml[id]).join('');
  } else {
    html += Object.entries(SETTINGS_CATEGORIES).map(([key,cat])=>
      '<div class="settings-cat-row" onclick="settingsOpenCategory(\''+key+'\')">' +
        '<div class="settings-cat-left"><span class="settings-cat-icon">'+cat.icon+'</span>' +
          '<div><div class="settings-cat-label">'+cat.label+'</div><div class="settings-cat-sub">'+cat.groups.map(g=>GROUP_LABELS[g]).join(' · ')+'</div></div>' +
        '</div>' + chevSvg() +
      '</div>'
    ).join('');
  }

  wrap.innerHTML = html;
  if(s.appearance && s.appearance.bgStyle==='image' && s.appearance.bgImageUrl){
    setTimeout(()=> renderBgImagePreview(s.appearance.bgImageUrl), 0);
  }
}

/* ============ Rewards ============ */
let pendingRewardType = 'coins';
function openRewardModal(){
  document.getElementById('rewardName').value=''; document.getElementById('rewardCost').value='';
  setRewardType('coins'); document.getElementById('rewardModalBack').classList.add('open');
}
function setRewardType(type){
  pendingRewardType = type;
  document.querySelectorAll('#rewardTypeSeg button').forEach(b=>{
    b.classList.toggle('active', b.dataset.type===type);
    b.classList.toggle('coins-active', b.dataset.type===type && type==='coins');
  });
  document.getElementById('rewardCostLabel').textContent = type==='xp' ? 'Cost in XP' : 'Cost in coins';
}
function submitReward(){
  const name = document.getElementById('rewardName').value.trim();
  const cost = parseInt(document.getElementById('rewardCost').value,10);
  if(!name || !cost || cost<=0) return;
  const icons = ['🎁','🏆','✨','🔥','🌟','🍀'];
  state.rewards.push({ id:'r'+Date.now(), name, cost, type:pendingRewardType, icon:icons[Math.floor(Math.random()*icons.length)] });
  saveState(); render(); closeModal('rewardModalBack');
}
function claimReward(id){
  const r = state.rewards.find(r=>r.id===id); if(!r) return;
  const balance = r.type==='xp' ? availableXp() : availableCoins();
  if(balance < r.cost){ showToast('Not enough ' + (r.type==='xp'?'XP':'coins')); return; }
  state.claims.unshift({ id:'c'+Date.now()+Math.random().toString(36).slice(2,6), rewardId:r.id, rewardName:r.name, cost:r.cost, type:r.type, ts:Date.now() });
  logTimelineEvent('reward_claim', r.name+' claimed', r.type==='xp'?-r.cost:0, r.type==='coins'?-r.cost:0);
  saveState(); checkMasteries(); render();
  showToast('Claimed: ' + r.name); playTone('reward'); vibrate([15]);
}
function deleteReward(id){ state.rewards = state.rewards.filter(r=>r.id!==id); saveState(); render(); }

/* ============ Misc UI helpers ============ */
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function showToast(msg, color){
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show' + (color?' '+color:'');
  clearTimeout(showToast._tm); showToast._tm = setTimeout(()=> t.classList.remove('show'), 1900);
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtTime(ts){
  const d = new Date(ts); const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  if(sameDay) return 'Today, ' + time;
  const y = new Date(now); y.setDate(now.getDate()-1);
  if(d.toDateString() === y.toDateString()) return 'Yesterday, ' + time;
  return d.toLocaleDateString([], {month:'short', day:'numeric'}) + ', ' + time;
}
function goTo(sec){
  const transitionsOn = state.settings.animations ? state.settings.animations.screenTransitions!==false : true;
  const newSec = document.getElementById('sec-'+sec);
  const oldSec = document.querySelector('section.active');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.sec===sec));
  if(!newSec || oldSec===newSec) return;
  playTone('navTick');
  if(!transitionsOn){
    document.querySelectorAll('section').forEach(s=>{ s.classList.remove('active','leaving'); s.style.opacity=''; });
    newSec.classList.add('active');
    return;
  }
  if(oldSec){
    oldSec.classList.remove('active');
    oldSec.classList.add('leaving');
    oldSec.style.opacity = '1';
    requestAnimationFrame(()=> requestAnimationFrame(()=>{ oldSec.style.opacity = '0'; }));
    setTimeout(()=>{ oldSec.classList.remove('leaving'); oldSec.style.opacity=''; }, 240);
  }
  newSec.style.opacity = '0';
  newSec.classList.add('active');
  requestAnimationFrame(()=> requestAnimationFrame(()=>{ newSec.style.opacity = '1'; }));
}
function toggleCompletedBlock(){
  state.completedOpen = !state.completedOpen;
  document.getElementById('completedBlock').classList.toggle('open', state.completedOpen);
  document.getElementById('completedToggleBtn').classList.toggle('open', state.completedOpen);
  document.getElementById('completedToggleText').textContent = state.completedOpen ? 'Hide completed' : 'Show completed';
}

/* ============ Swipe between pages ============ */
const NAV_ORDER = ['home','skills','challenges','rewards'];
let pageSwipeStartX=0, pageSwipeStartY=0, pageSwiping=false;
function pageSwipeExcluded(target){
  return !!(target.closest && (target.closest('.task-row-wrap') || target.closest('.qa-chips') ||
    target.closest('.cat-filter-row') || target.closest('.modal-back.open') ||
    target.closest('input[type="range"]') || target.closest('.theme-swatch-grid') ||
    target.closest('.layout-preset-row') || target.closest('.reorder-item')));
}
function onPageSwipeStart(e){
  if(pageSwipeExcluded(e.target)){ pageSwiping=false; return; }
  const t = e.touches ? e.touches[0] : e;
  pageSwipeStartX = t.clientX; pageSwipeStartY = t.clientY; pageSwiping = true;
}
function onPageSwipeEnd(e){
  if(!pageSwiping) return;
  pageSwiping = false;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const dx = t.clientX - pageSwipeStartX, dy = t.clientY - pageSwipeStartY;
  if(Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)*1.6){
    const current = document.querySelector('.navbtn.active');
    const sec = current ? current.dataset.sec : 'home';
    const idx = NAV_ORDER.indexOf(sec);
    if(idx<0) return;
    if(dx < 0 && idx < NAV_ORDER.length-1) goTo(NAV_ORDER[idx+1]);
    else if(dx > 0 && idx > 0) goTo(NAV_ORDER[idx-1]);
  }
}
document.addEventListener('touchstart', onPageSwipeStart, {passive:true});
document.addEventListener('touchend', onPageSwipeEnd, {passive:true});

/* ============ Swipe-to-delete & drag-to-reorder ============ */
function wireRowGestures(rowWrap, row, id){
  let startX=0, startY=0, dx=0, swiping=false, dragging=false;
  const OPEN_X = -84;

  function cleanupListeners(){
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp);
  }
  function onDown(e){
    if(e.target.closest('.task-checkbox') || e.target.closest('.task-star') || e.target.closest('.task-drag-handle')) return;
    startX = (e.touches?e.touches[0].clientX:e.clientX); startY = (e.touches?e.touches[0].clientY:e.clientY);
    dx = 0; swiping = false;
    row.style.transition = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, {passive:false}); document.addEventListener('touchend', onUp);
  }
  function onMove(e){
    if(!document.contains(row)){ cleanupListeners(); return; } // row was removed by an unrelated re-render mid-gesture — stop, don't leak
    const x = (e.touches?e.touches[0].clientX:e.clientX), y=(e.touches?e.touches[0].clientY:e.clientY);
    const ddx = x-startX, ddy = y-startY;
    if(!swiping && Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) swiping = true;
    if(swiping){
      if(e.cancelable) e.preventDefault();
      dx = Math.max(OPEN_X, Math.min(0, ddx + (openSwipeRow===row ? OPEN_X : 0)));
      row.style.transform = 'translateX('+dx+'px)';
    }
  }
  function onUp(){
    cleanupListeners();
    if(!document.contains(row)) return; // detached mid-gesture — nothing left to finish animating
    row.style.transition = 'transform .22s ease';
    if(swiping){
      if(dx < OPEN_X/2){ row.style.transform='translateX('+OPEN_X+'px)'; openSwipeRow = row; }
      else { row.style.transform='translateX(0px)'; if(openSwipeRow===row) openSwipeRow=null; }
    } else if(openSwipeRow && openSwipeRow!==row){
      openSwipeRow.style.transition='transform .22s ease'; openSwipeRow.style.transform='translateX(0px)'; openSwipeRow=null;
    }
    swiping = false;
  }
  row.addEventListener('mousedown', onDown);
  row.addEventListener('touchstart', onDown, {passive:true});

  const handle = row.querySelector('.task-drag-handle');
  if(handle){
    function dragStart(e){
      e.preventDefault();
      const startY2 = (e.touches?e.touches[0].clientY:e.clientY);
      const listEl = rowWrap.parentElement;
      const siblings = Array.from(listEl.querySelectorAll('.task-row-wrap'));
      row.classList.add('dragging');
      dragCtx = { id, startY: startY2, origIndex: siblings.indexOf(rowWrap) };
      document.addEventListener('mousemove', dragMove); document.addEventListener('mouseup', dragEnd);
      document.addEventListener('touchmove', dragMove, {passive:false}); document.addEventListener('touchend', dragEnd);
    }
    function dragMove(e){
      if(!dragCtx) return;
      if(e.cancelable) e.preventDefault();
      if(!rowWrap.parentElement) return;
      const y = (e.touches?e.touches[0].clientY:e.clientY);
      const listEl = rowWrap.parentElement;
      const siblings = Array.from(listEl.querySelectorAll('.task-row-wrap')).filter(el=>el!==rowWrap);
      for(const sib of siblings){
        const rect = sib.getBoundingClientRect();
        const mid = rect.top + rect.height/2;
        const sibId = sib.dataset.taskId;
        const curIdx = state.taskOrder.indexOf(id);
        const sibIdx = state.taskOrder.indexOf(sibId);
        if(y < mid && curIdx > sibIdx){
          state.taskOrder.splice(curIdx,1); state.taskOrder.splice(sibIdx,0,id);
          listEl.insertBefore(rowWrap, sib);
          break;
        }
        if(y > mid && curIdx < sibIdx){
          state.taskOrder.splice(curIdx,1); state.taskOrder.splice(sibIdx,0,id);
          listEl.insertBefore(rowWrap, sib.nextSibling);
          break;
        }
      }
    }
    function dragEnd(){
      document.removeEventListener('mousemove', dragMove); document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('touchmove', dragMove); document.removeEventListener('touchend', dragEnd);
      const r = document.querySelector('.task-row-wrap[data-task-id="'+id+'"] .task-row');
      if(r) r.classList.remove('dragging');
      dragCtx = null; saveState();
    }
    handle.addEventListener('mousedown', dragStart);
    handle.addEventListener('touchstart', dragStart, {passive:false});
  }
}

/* ============ Rendering ============ */
function render(){
  checkOverdueTaskFines();
  checkCourtRecoveries();
  checkReminders();
  renderHeaderStats();
  renderGreeting();
  renderTodaySummary();
  renderCourtAlertBanner();
  renderReminderAlertBanner();
  renderFocusBar();
  renderStreakCard();
  renderCalendarPreview();
  renderAiSuggestion();
  renderPlanDayButton();
  renderTasks();
  renderNextUp();
  renderDailyQuestMini();
  applyHomeLayout();
  applyCardCollapseStates();
  renderLifeLevelHero();
  renderSkillsFull();
  renderRadar();
  renderQuests();
  renderChallenges();
  renderNegHabits();
  renderRewards();
  renderCourt();
  const mastDefsForCount = allMasteryDefs();
  const mastTierCountTop = mastDefsForCount.reduce((s,d)=> s+((state.masteries[d.id]?.claimedTiers?.length)||0), 0);
  document.getElementById('mastLinkCount').textContent = mastTierCountTop + ' / ' + (mastDefsForCount.length*MASTERY_TIERS.length) + ' tiers';
  if(document.getElementById('sec-account').classList.contains('active')) renderAccount();
  if(document.getElementById('sec-settings').classList.contains('active')) renderSettingsPage();
  if(document.getElementById('mastModalBack').classList.contains('open')) renderMasteries();
}

function renderHeaderStats(){
  document.getElementById('coinPill').textContent = availableCoins().toLocaleString();
  document.getElementById('streakPill').textContent = state.streak.current || 0;
}

/* ============ Today Summary (collapsible) ============ */
function toggleSummary(){
  state.summaryOpen = !state.summaryOpen;
  saveState();
  document.getElementById('summaryCard').classList.toggle('open', state.summaryOpen);
}
function renderTodaySummary(){
  document.getElementById('summaryCard').classList.toggle('open', state.summaryOpen);
  const life = lifeStats();
  const statsEl = document.getElementById('summaryStats');
  const showLevel = state.settings.gamification ? state.settings.gamification.showLevelProgress!==false : true;
  statsEl.innerHTML =
    (showLevel ? '<span class="summary-stat">⭐ Level <b>'+life.level+'</b></span>' : '') +
    '<span class="summary-stat">🔥 <b>'+(state.streak.current||0)+'</b> Day Streak</span>' +
    '<span class="summary-stat">+<b>'+todayXp().toLocaleString()+'</b> XP Today</span>';

  const wProgress = xpInPeriod(startOfWeekTs());
  const quests = todaysQuests();
  const questsDone = quests.filter(q=>skillXpToday(q.skill)>=q.target).length;
  const mastDefsById = Object.fromEntries(allMasteryDefs().map(d=>[d.id,d]));
  const recent = Object.entries(state.masteries)
    .flatMap(([id,rec])=> (rec.history||[]).map(h=>({ id, tier:h.tier, ts:h.ts })))
    .sort((a,b)=>b.ts-a.ts).slice(0,2)
    .map(h=> mastDefsById[h.id] ? { icon:mastDefsById[h.id].icon, name:mastDefsById[h.id].name+' — '+MASTERY_TIERS[h.tier] } : null)
    .filter(Boolean);

  document.getElementById('summaryExpand').innerHTML =
    '<div class="summary-grid">' +
      '<div class="summary-tile"><div class="summary-tile-label">Coins</div><div class="summary-tile-value">🪙 '+availableCoins().toLocaleString()+'</div></div>' +
      '<div class="summary-tile link" onclick="goTo(\'challenges\')"><div class="summary-tile-label">Quests</div><div class="summary-tile-value">'+questsDone+' / '+quests.length+'</div></div>' +
      '<div class="summary-tile"><div class="summary-tile-label">Weekly XP</div><div class="summary-tile-value">'+wProgress.toLocaleString()+'</div></div>' +
      '<div class="summary-tile link" onclick="goTo(\'skills\')"><div class="summary-tile-label">Life Balance</div><div class="summary-tile-value">View →</div></div>' +
    '</div>' +
    (recent.length
      ? recent.map(a=>'<div class="summary-ach-row"><span class="summary-ach-icon">'+a.icon+'</span><span>'+escapeHtml(a.name)+'</span></div>').join('')
      : '<div class="summary-empty-ach">No mastery tiers unlocked yet.</div>');
}

function renderGreeting(){
  const h = new Date().getHours();
  const part = h<5 ? 'Good night' : h<12 ? 'Good morning' : h<18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greetingText').textContent = part.toUpperCase();
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' });
  const dateEl = document.getElementById('homeDateText');
  if(dateEl) dateEl.innerHTML = state.userName ? escapeHtml(state.userName)+', <span style="color:var(--text-faint);font-weight:600;">'+dateStr+'</span>' : dateStr;
}

/* ============ Intelligent in-app insights ============
   Note: these surface the moment the app is opened — a static local file can't
   send real OS push notifications without a backend, so this is the honest
   equivalent: the same intelligence, delivered when you actually look. */
function formatHour(h){ h=parseInt(h,10); const period=h>=12?'PM':'AM'; let hh=h%12; if(hh===0)hh=12; return hh+' '+period; }
function computeInsight(){
  const now = new Date(); const hour = now.getHours();
  const pending = state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).filter(t=>t && !t.completed);
  const todayIso = todayISO();

  const upcoming = state.tasks.filter(t=>!t.completed && t.dueDate && (t.tag==='exam'||t.tag==='deadline'));
  let closest=null, closestDays=Infinity;
  upcoming.forEach(t=>{
    const days = Math.round((new Date(t.dueDate+'T00:00:00') - new Date(todayIso+'T00:00:00'))/86400000);
    if(days>=0 && days<closestDays){ closestDays=days; closest=t; }
  });
  if(closest && closestDays<=5){
    const label = closest.tag==='exam' ? 'exam' : 'deadline';
    return { icon: closest.tag==='exam'?'🎓':'⚠️', text: closestDays===0 ? ('Your '+closest.title+' '+label+' is today.') : ('Your '+closest.title+' '+label+' is in '+closestDays+' day'+(closestDays===1?'':'s')+'.') };
  }

  if(hour>=17 && pending.length===1 && pending[0].estXp<=40){
    return { icon:'👋', text:'You only have one short task left today — '+pending[0].title+'.' };
  }

  const activityHours = state.timeline.filter(e=>e.type==='task').map(e=>new Date(e.ts).getHours());
  if(activityHours.length>=5){
    const freq={}; activityHours.forEach(h2=>freq[h2]=(freq[h2]||0)+1);
    const modeHour = Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b);
    if(Math.abs(hour-modeHour)<=1 && todayXp()===0){
      return { icon:'⏰', text:'You normally get things done around '+formatHour(modeHour)+' — want to start now?' };
    }
  }

  if(skillXpToday('strength')===0 && hour>=15 && hour<=20 && pending.length<=3 && pending.length>0){
    return { icon:'💪', text:'Looks like you have time for a quick workout today.' };
  }
  return null;
}

function scrollToTask(id){ const el = document.querySelector('.task-row-wrap[data-task-id="'+id+'"]'); if(el) el.scrollIntoView({behavior:'smooth', block:'center'}); }

let taskCategoryFilter = 'all';
function setCategoryFilter(cat){
  taskCategoryFilter = cat;
  renderTasks();
}
function renderCategoryFilterChips(){
  const wrap = document.getElementById('categoryFilterWrap');
  if(!wrap) return;
  const pending = state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).filter(t=>t && !t.completed);
  const counts = {};
  pending.forEach(t=>{ const c = (t.category && CATEGORY_MAP[t.category]) ? t.category : 'personal'; counts[c] = (counts[c]||0)+1; });
  const present = CATEGORIES.filter(c=>counts[c.id]>0);
  if(taskCategoryFilter!=='all' && !counts[taskCategoryFilter]) taskCategoryFilter = 'all';
  if(present.length<2){ wrap.innerHTML=''; return; }
  let html = '<div class="cat-filter-row">';
  html += '<button class="cat-filter-chip'+(taskCategoryFilter==='all'?' active':'')+'" onclick="setCategoryFilter(\'all\')">All ('+pending.length+')</button>';
  present.forEach(c=>{
    html += '<button class="cat-filter-chip'+(taskCategoryFilter===c.id?' active':'')+'" onclick="setCategoryFilter(\''+c.id+'\')">'+c.icon+' '+c.name+' ('+counts[c.id]+')</button>';
  });
  html += '</div>';
  wrap.innerHTML = html;
}
function renderTasks(){
  openSwipeRow = null;
  renderCategoryFilterChips();
  let pending = state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).filter(t=>t && !t.completed && (!t.dueDate || t.dueDate<=todayISO()));
  if(taskCategoryFilter!=='all') pending = pending.filter(t=>((t.category && CATEGORY_MAP[t.category]) ? t.category : 'personal')===taskCategoryFilter);
  const container = document.getElementById('taskListPending');
  container.innerHTML = pending.length ? pending.map(taskRowHtml).join('') : '<div class="empty">'+(taskCategoryFilter==='all' ? 'Nothing scheduled.<br>Enjoy the breathing room, or add something meaningful.' : 'Nothing here in this category yet.')+'</div>';
  pending.forEach(t=>{
    const wrap = container.querySelector('.task-row-wrap[data-task-id="'+t.id+'"]');
    if(wrap) wireRowGestures(wrap, wrap.querySelector('.task-row'), t.id);
  });

  const done = completedTasks().slice().sort((a,b)=>b.completedAt-a.completedAt);
  const completedBlock = document.getElementById('completedBlock');
  completedBlock.innerHTML = done.length ? done.slice(0,20).map(t=>
    '<div class="completed-row"><span class="row-name">'+escapeHtml(t.title)+'</span><span class="row-xp">+'+t.xp+' XP</span></div>'
  ).join('') : '<div class="empty">Nothing completed yet.</div>';
  document.getElementById('completedToggleBtn').style.display = done.length ? 'flex' : 'none';
  completedBlock.classList.toggle('open', state.completedOpen);
  document.getElementById('completedToggleBtn').classList.toggle('open', state.completedOpen);
  document.getElementById('completedToggleText').textContent = state.completedOpen ? 'Hide completed' : 'Show completed';
}
function taskMetaText(t){
  if(t.tag==='exam') return '🎓 Exam';
  if(t.tag==='deadline') return '⚠️ Deadline';
  return '';
}
function taskBadge(t){
  const bits = [];
  const cat = CATEGORY_MAP[t.category];
  if(cat) bits.push('<span class="task-tag cat">'+cat.icon+' '+cat.name+'</span>');
  if(t.tag==='exam') bits.push('<span class="task-tag exam">🎓 Exam</span>');
  else if(t.tag==='deadline') bits.push('<span class="task-tag deadline">⚠️ Deadline</span>');
  if(t.recurringTemplateId) bits.push('<span class="task-tag recur">🔁</span>');
  else if(t.rolledOver) bits.push('<span class="task-tag recur">↻ Rolled over</span>');
  return bits.length ? '<div class="task-tag-row">'+bits.join('')+'</div>' : '';
}
/* ============ Next Up (Home) ============
   No time-of-day scheduling exists in this app's data model, so "next up"
   is the most time-sensitive thing on the radar: the closest upcoming
   exam/deadline, falling back to the next pending task after today's focus. */
function renderNextUp(){
  const wrap = document.getElementById('nextUpWrap');
  const todayIso = todayISO();
  const heroId = heroTargetTask() ? heroTargetTask().id : null;
  const upcoming = state.tasks.filter(t=>!t.completed && t.dueDate && (t.tag==='exam'||t.tag==='deadline'));
  let closest=null, closestDays=Infinity;
  upcoming.forEach(t=>{
    const days = Math.round((new Date(t.dueDate+'T00:00:00') - new Date(todayIso+'T00:00:00'))/86400000);
    if(days>=0 && days<closestDays){ closestDays=days; closest=t; }
  });

  let item = closest, meta = '';
  if(item){
    meta = closestDays===0 ? 'Today' : closestDays===1 ? 'Tomorrow' : 'In '+closestDays+'d';
  } else {
    item = state.taskOrder.map(id=>state.tasks.find(t=>t.id===id)).find(t=>t && !t.completed && t.id!==heroId);
    if(item) meta = '+'+item.estXp+' XP';
  }

  if(!item){ wrap.innerHTML=''; return; }
  const icon = item.tag==='exam' ? '🎓' : item.tag==='deadline' ? '⚠️' : '📌';
  wrap.innerHTML = '<div class="section-label">Next Up</div>' +
    '<div class="nextup-card" onclick="goTo(\'home\'); scrollToTask(\''+item.id+'\')">' +
    '<div class="nextup-left"><div class="nextup-icon">'+icon+'</div>' +
    '<div class="nextup-info"><div class="nextup-label">'+(item.tag==='exam'?'Exam':item.tag==='deadline'?'Deadline':'Coming up')+'</div>' +
    '<div class="nextup-title">'+escapeHtml(item.title)+'</div></div></div>' +
    '<div class="nextup-meta">'+meta+'</div></div>';
}

/* ============ Daily Mission mini card (Home) ============ */
function renderDailyQuestMini(){
  const wrap = document.getElementById('dailyQuestWrap');
  const quests = todaysQuests();
  if(!quests.length){ wrap.innerHTML=''; return; }
  const done = quests.filter(q=>skillXpToday(q.skill)>=q.target).length;
  const pct = Math.round((done/quests.length)*100);
  wrap.innerHTML = '<div class="section-label">Daily Mission</div>' +
    '<div class="dq-card" onclick="goTo(\'challenges\')"><div class="dq-top">' +
    '<span class="dq-title">🎁 Complete '+quests.length+' Mission'+(quests.length===1?'':'s')+'</span>' +
    '<span class="dq-count">'+done+' / '+quests.length+'</span></div>' +
    '<div class="mini-bar"><div class="mini-fill" style="width:'+pct+'%"></div></div></div>';
}

/* ---- Home customisation: extra cards ---- */
function renderStreakCard(){
  const wrap = document.getElementById('streakCardWrap');
  if(!wrap) return;
  wrap.innerHTML = '<div class="section-label">Streak</div>' +
    '<div class="streak-mini-card" onclick="openTimelineView()">' +
      '<div class="streak-mini-left"><span class="streak-mini-flame">🔥</span><div>' +
        '<div class="streak-mini-num">'+(state.streak.current||0)+' day'+((state.streak.current||0)===1?'':'s')+'</div>' +
        '<div class="streak-mini-sub">current streak</div>' +
      '</div></div>' +
      '<div class="streak-mini-longest">Best<br>'+(state.streak.longest||0)+' days</div>' +
    '</div>';
}
function upcomingPreviewItems(){
  const today = todayISO();
  return state.tasks.filter(t=>!t.completed && t.dueDate && t.dueDate>=today)
    .sort((a,b)=> a.dueDate<b.dueDate?-1:1).slice(0,4);
}
function renderCalendarPreview(){
  const wrap = document.getElementById('calendarPreviewWrap');
  if(!wrap) return;
  const items = upcomingPreviewItems();
  const rows = items.length ? items.map(t=>{
    const d = new Date(t.dueDate+'T00:00:00');
    const label = d.toLocaleDateString([], {month:'short', day:'numeric'});
    const icon = t.tag==='exam' ? '🎓' : t.tag==='deadline' ? '⚠️' : '📌';
    return '<div class="cal-preview-row"><span class="cpr-date">'+label+'</span><span>'+icon+'</span><span>'+escapeHtml(t.title)+'</span></div>';
  }).join('') : '<div class="cal-preview-empty">Nothing scheduled — enjoy the calm.</div>';
  wrap.innerHTML = '<div class="section-label">Calendar</div>' +
    '<div class="cal-preview-card" onclick="openTimelineView()"><div class="cal-preview-title">Upcoming</div>'+rows+'</div>';
}
const AI_TIP_POOL = {
  encouraging: [
    "One small task today keeps the streak alive — doesn't need to be big.",
    "Good momentum lately. Worth riding it with a short focus session.",
    "Your {skill} skill is climbing steadily — another task or two today keeps that going."
  ],
  balanced: [
    "{skill} has had the least attention lately — a single task there would even things out.",
    "You tend to focus well around this time of day — worth using it.",
    "A few tasks are still sitting open from earlier and due to roll over soon."
  ],
  direct: [
    "{skill} is behind your other skills. Put the next task there.",
    "Unfinished tasks from earlier are piling up — clear those before adding more.",
    "Start now rather than later — momentum is easier to keep than to rebuild."
  ]
};
function renderAiSuggestion(){
  const wrap = document.getElementById('aiSuggestionWrap');
  if(!wrap) return;
  const enabled = state.settings.ai ? state.settings.ai.suggestions!==false : true;
  if(!enabled){ wrap.innerHTML=''; return; }
  if(state.dismissedInsightDate===todayISO()){ wrap.innerHTML=''; return; }

  if(hasAiKey() && state.aiInsight && state.aiInsight.date===todayISO() && state.aiInsight.text){
    const ins = state.aiInsight;
    wrap.innerHTML = '<div class="insight-banner"><span class="ib-icon">✨</span><span class="ib-text">'+escapeHtml(ins.text)+
      (ins.cta_label ? ' <button class="ib-cta" onclick="runInsightCta()">'+escapeHtml(ins.cta_label)+'</button>' : '') + '</span>' +
      '<button class="ib-dismiss" onclick="dismissInsight()" aria-label="Dismiss">✕</button></div>';
  } else {
    const weakest = SKILLS.reduce((min,s)=> (state.skills[s.id]||0) < (state.skills[min.id]||0) ? s : min, SKILLS[0]);
    const style = (state.settings.ai && state.settings.ai.coachingStyle) || 'balanced';
    const pool = AI_TIP_POOL[style] || AI_TIP_POOL.balanced;
    const dateSeed = todayISO().split('-').reduce((s,c)=>s+parseInt(c,10),0);
    const tip = pool[dateSeed % pool.length].replace('{skill}', SKILL_MAP[weakest.id].name);
    wrap.innerHTML = '<div class="insight-banner"><span class="ib-icon">✨</span><span class="ib-text">'+escapeHtml(tip)+'</span>' +
      '<button class="ib-dismiss" onclick="dismissInsight()" aria-label="Dismiss">✕</button></div>';
  }
  maybeGenerateDailyInsight();
}
function runInsightCta(){
  const ins = state.aiInsight;
  if(!ins) return;
  if(ins.cta_action==='open_quick_add') openQuickAdd();
  else if(ins.cta_action==='open_planner') planMyDay();
  dismissInsight();
}
function buildInsightPrompt(){
  const recent = state.tasks.filter(t=>t.completed).sort((a,b)=>b.completedAt-a.completedAt).slice(0,12)
    .map(t=>({ title:t.title, category:t.category, skills:(t.skillGains||[]).map(g=>g.skill), completedAgo: Math.round((Date.now()-t.completedAt)/3600000)+'h ago' }));
  const skillLevels = {}; SKILLS.forEach(s=> skillLevels[s.id] = skillCurve(state.skills[s.id]||0).level);
  return `${AI_TONE_PREAMBLE}

You are the proactive insight layer inside LifeXP, a task manager with an invisible RPG progression layer. You quietly notice patterns in what the user has actually done and surface ONE genuinely useful, specific observation — never generic advice, never something that could apply to any user.

Look for things like: a cluster of related tasks that suggests a bigger goal worth naming; a routine pairing (X usually follows Y); several intense days suggesting recovery is due; a skill being neglected relative to how often it used to appear; a habit worth reinforcing. If nothing genuinely stands out, say so — don't invent a pattern.

What you remember about this user already:
${buildMemoryContext()}

Recent completed tasks (most recent first): ${JSON.stringify(recent)}
Current skill levels: ${JSON.stringify(skillLevels)}
Current streak: ${state.streak.current} days

Respond with STRICT JSON ONLY, no markdown fences:
{
  "has_insight": boolean,
  "text": "string | null — one short sentence, specific, phrased like a friend noticing something, not a report. Under 25 words. Null if has_insight is false.",
  "cta_label": "string | null — 2-4 word action label, e.g. 'Create a goal', 'Plan tomorrow'. Null if not applicable.",
  "cta_action": "one of: open_quick_add, open_planner, none",
  "memory_note": "string | null — a reusable fact worth remembering long-term, under 12 words, or null"
}`;
}
async function maybeGenerateDailyInsight(){
  if(!hasAiKey()) return;
  if(state.lastInsightGenDate===todayISO()) return;
  const completedCount = state.tasks.filter(t=>t.completed).length;
  if(completedCount<3) return;
  state.lastInsightGenDate = todayISO();
  saveState();
  try{
    const r = await callAiJson(buildInsightPrompt(), 500);
    if(r && r.has_insight && r.text){
      state.aiInsight = { date: todayISO(), text: r.text.trim(), cta_label: r.cta_label||null, cta_action: r.cta_action||'none' };
    }
    if(r && r.memory_note){ rememberFact(r.memory_note); }
    saveState();
    renderAiSuggestion();
  }catch(e){ /* silent — static tip stays as fallback */ }
}
function dismissInsight(){
  state.dismissedInsightDate = todayISO();
  saveState();
  const wrap = document.getElementById('aiSuggestionWrap');
  if(wrap) wrap.innerHTML = '';
}
function renderPlanDayButton(){
  const wrap = document.getElementById('planDayBtnWrap');
  if(!wrap) return;
  if(!hasAiKey()){ wrap.innerHTML=''; return; }
  const openAll = state.tasks.filter(t=>!t.completed);
  if(openAll.length<2){ wrap.innerHTML=''; return; }
  wrap.innerHTML = '<button class="plan-day-btn" id="planDayBtn" onclick="planMyDay()">✨ Plan my day</button>';
}
/* ---- Stage 1: Triage. With a large backlog, don't ask the AI to reason
   about every open task at once — first ask it to pick out only what's
   genuinely relevant today, then only plan that shortlist. Keeps prompts
   small, keeps plans focused, and leaves the rest of the backlog alone. */
const PLAN_TRIAGE_THRESHOLD = 8;
const PLAN_TRIAGE_CANDIDATE_CAP = 40;
function buildTriagePrompt(candidates){
  return `${AI_TONE_PREAMBLE}

You are the triage layer inside LifeXP. The user has a lot of open tasks. Before any planning happens, pick out ONLY the ones that are genuinely relevant to work on today — due today or overdue, time-sensitive, or clearly the highest-value next steps. Leave everything else in the backlog; don't try to fit everything in. Aim for a focused, realistic shortlist (roughly 3-10 tasks) rather than a long list.

What you remember about this user:
${buildMemoryContext()}

All open tasks: ${JSON.stringify(candidates.map(t=>({id:t.id, title:t.title, category:t.category, dueDate:t.dueDate, starredGoal:!!t.starredGoal})))}

Respond with STRICT JSON ONLY, no markdown fences:
{
  "relevant_ids": ["task_id, only the ones genuinely relevant for today"],
  "summary": "one short sentence, e.g. 'Found 26 tasks. 8 are relevant today — planning those, the rest stays in your backlog.' Use the real numbers."
}`;
}
/* ---- Stage 2: Plan only the shortlisted tasks. ---- */
function buildPlanPrompt(openTasks){
  const skillLevels = {}; SKILLS.forEach(s=> skillLevels[s.id] = skillCurve(state.skills[s.id]||0).level);
  return `${AI_TONE_PREAMBLE}

You are the planning layer inside LifeXP. The user is about to tackle these already-shortlisted tasks today. Suggest the best order — prioritise, balance workload, and avoid stacking all the hard/draining tasks together or leaving them all for last. Consider what you know about each task's real-world nature.

What you remember about this user:
${buildMemoryContext()}

Current skill levels: ${JSON.stringify(skillLevels)}
Current streak: ${state.streak.current} days

Today's shortlisted tasks: ${JSON.stringify(openTasks.map(t=>({id:t.id, title:t.title, category:t.category, estXp:t.estXp})))}

Respond with STRICT JSON ONLY, no markdown fences:
{
  "order": ["task_id in the order they should be tackled, best first"],
  "note": "one short sentence explaining the overall shape of the plan, under 20 words"
}`;
}
async function planMyDay(){
  const btn = document.getElementById('planDayBtn');
  const openAll = state.tasks.filter(t=>!t.completed);
  if(openAll.length<2){ showToast('Not enough tasks to plan yet'); return; }
  if(!hasAiKey()){ showToast('Add a Gemini key in Settings first'); return; }
  if(btn){ btn.disabled = true; btn.textContent = 'Triaging…'; }
  try{
    let shortlist = openAll;
    let triageSummary = null;
    if(openAll.length > PLAN_TRIAGE_THRESHOLD){
      // Rank candidates so due-today/overdue and starred goals survive the cap first.
      const today = todayISO();
      const ranked = openAll.slice().sort((a,b)=>{
        const score = t => (t.dueDate && t.dueDate<=today ? 0 : t.starredGoal ? 1 : t.dueDate ? 2 : 3);
        return score(a)-score(b) || (b.createdAt||0)-(a.createdAt||0);
      });
      const candidates = ranked.slice(0, PLAN_TRIAGE_CANDIDATE_CAP);
      const tr = await callAiJson(buildTriagePrompt(candidates), 500);
      const relevantIds = (tr.relevant_ids||[]).filter(id=> candidates.some(t=>t.id===id));
      shortlist = relevantIds.length ? candidates.filter(t=>relevantIds.includes(t.id)) : candidates.slice(0,8);
      triageSummary = tr.summary || ('Found '+openAll.length+' tasks. Planning '+shortlist.length+' relevant today — the rest stays in your backlog.');
    }
    if(btn) btn.textContent = 'Planning…';
    const r = await callAiJson(buildPlanPrompt(shortlist), 400);
    const orderedIds = (r.order||[]).filter(id=> shortlist.some(t=>t.id===id));
    const remainingShortlistIds = shortlist.map(t=>t.id).filter(id=>!orderedIds.includes(id));
    const finalSet = [...orderedIds, ...remainingShortlistIds];
    const otherIds = state.taskOrder.filter(id=>!finalSet.includes(id));
    state.taskOrder = [...finalSet, ...otherIds];
    saveState(); render();
    showToast(triageSummary || r.note || 'Day planned ✨');
    if(triageSummary && r.note) setTimeout(()=> showToast(r.note), 2100);
  }catch(e){
    showToast('Planning failed — try again');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = '✨ Plan my day'; }
  }
}
function applyHomeLayout(){
  const wrap = document.getElementById('homeCardsWrap');
  if(!wrap) return;
  const home = state.settings.home || defaultState().settings.home;
  const order = home.order && home.order.length ? home.order : defaultState().settings.home.order;
  order.forEach(key=>{
    const el = document.getElementById('cardWrap-'+key);
    if(!el) return;
    wrap.appendChild(el);
    const visible = home.visible ? (home.visible[key]!==false) : true;
    el.classList.toggle('hcard-hidden', !visible);
  });
  document.body.classList.remove('home-view-compact','home-view-comfortable','home-view-detailed');
  document.body.classList.add('home-view-'+(home.view||'comfortable'));
}

function taskRowHtml(t){
  return '<div class="task-row-wrap" data-task-id="'+t.id+'">' +
    '<div class="task-row-delete-bg"><button onclick="deleteTask(\''+t.id+'\')">Delete</button></div>' +
    '<div class="task-row" data-task-id="'+t.id+'">' +
      '<div class="task-row-main">' +
        '<button class="task-checkbox" onclick="completeTask(\''+t.id+'\')" aria-label="Complete task"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></button>' +
        '<div class="task-title-wrap"><div class="task-title">'+escapeHtml(t.title)+'</div>'+taskBadge(t)+'</div>' +
        '<div class="task-meta-right">' +
          '<span class="task-xp-chip">~'+t.estXp+' XP</span>' +
          '<button class="task-star'+(t.starredGoal?' active':'')+'" onclick="toggleStar(\''+t.id+'\')" aria-label="Pin as today\'s goal">' +
            '<svg viewBox="0 0 24 24" width="15" height="15" fill="'+(t.starredGoal?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5 1.5-7-5-5 7-1z"/></svg>' +
          '</button>' +
          '<span class="task-drag-handle"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><circle cx="8" cy="6" r="1.4"/><circle cx="16" cy="6" r="1.4"/><circle cx="8" cy="12" r="1.4"/><circle cx="16" cy="12" r="1.4"/><circle cx="8" cy="18" r="1.4"/><circle cx="16" cy="18" r="1.4"/></svg></span>' +
        '</div>' +
      '</div>' +
      '<div class="reward-strip"></div>' +
    '</div>' +
  '</div>';
}

function renderLifeLevelHero(){
  const wrap = document.getElementById('lifeLevelHero');
  if(!wrap) return;
  const life = lifeStats();
  const pct = Math.max(2, Math.min(100, Math.round((life.into/life.need)*100)));
  wrap.innerHTML =
    '<div class="llh-level-label">LEVEL <span>'+life.level+'</span></div>' +
    '<div class="llh-ratio"><span class="llh-into">'+life.into.toLocaleString()+'</span><span class="llh-slash">/</span><span class="llh-need">'+life.need.toLocaleString()+'</span></div>' +
    '<div class="llh-bar-row">' +
      '<span class="llh-lvl-badge">'+life.level+'</span>' +
      '<div class="llh-bar-track"><div class="llh-bar-fill" style="width:'+pct+'%"></div></div>' +
      '<span class="llh-lvl-badge right">'+(life.level+1)+'</span>' +
    '</div>';
}
function renderSkillsFull(){
  const showXp = state.settings.gamification ? state.settings.gamification.showSkillXp!==false : true;
  document.getElementById('skillsFullList').innerHTML = SKILLS.map(s=>{
    const xp = state.skills[s.id]||0; const c = skillCurve(xp);
    const pct = Math.round((c.into/c.need)*100);
    return '<div class="skill-card"><div class="skill-card-top"><div class="skill-card-id"><span>'+s.icon+'</span><span class="skill-card-name">'+s.name+'</span></div>' +
      '<span class="skill-card-lvl num">Lv '+c.level+'</span></div>' +
      '<div class="skill-mini-bar"><div class="skill-mini-fill" style="width:'+pct+'%"></div></div>' +
      (showXp ? '<div class="skill-card-xp">'+c.into+' / '+c.need+' xp</div>' : '') + '</div>';
  }).join('');
}
function renderRadar(){
  const radarWrapEl = document.querySelector('.radar-wrap');
  const showWheel = state.settings.gamification ? state.settings.gamification.showLifeBalanceWheel!==false : true;
  if(radarWrapEl) radarWrapEl.style.display = showWheel ? '' : 'none';
  if(!showWheel) return;
  const svg = document.getElementById('radarSvg');
  const cx=120, cy=120, R=90, n=SKILLS.length;
  const maxLevel = Math.max(5, ...SKILLS.map(s=>skillCurve(state.skills[s.id]||0).level));
  const pts = SKILLS.map((s,i)=>{
    const lvl = skillCurve(state.skills[s.id]||0).level;
    const frac = Math.min(1, lvl/maxLevel);
    const ang = -Math.PI/2 + i*(2*Math.PI/n);
    return { x: cx+Math.cos(ang)*R*frac, y: cy+Math.sin(ang)*R*frac, lx: cx+Math.cos(ang)*(R+18), ly: cy+Math.sin(ang)*(R+18), icon:s.icon };
  });
  const rings = [0.33,0.66,1].map(f=>{
    const ringPts = SKILLS.map((s,i)=>{ const ang=-Math.PI/2+i*(2*Math.PI/n); return (cx+Math.cos(ang)*R*f)+','+(cy+Math.sin(ang)*R*f); }).join(' ');
    return '<polygon points="'+ringPts+'" fill="none" stroke="#232E42" stroke-width="1"/>';
  }).join('');
  const shape = pts.map(p=>p.x+','+p.y).join(' ');
  const labels = pts.map(p=>'<text x="'+p.lx+'" y="'+p.ly+'" text-anchor="middle" dominant-baseline="middle" font-size="14">'+p.icon+'</text>').join('');
  svg.innerHTML = rings + '<polygon points="'+shape+'" fill="rgba(232,181,77,0.2)" stroke="#E8B54D" stroke-width="2"/>' +
    pts.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3" fill="#E8B54D"/>').join('') + labels;
  let weakest = SKILLS[0], weakestLvl = Infinity;
  SKILLS.forEach(s=>{ const lvl = skillCurve(state.skills[s.id]||0).level; if(lvl<weakestLvl){ weakestLvl=lvl; weakest=s; } });
  document.getElementById('radarNote').innerHTML = totalXpAll()>0
    ? '<b>'+weakest.icon+' '+weakest.name+'</b> is trailing the rest of your skills — one task there would go further than usual toward balancing things out.'
    : 'Complete your first task to fill out your life balance wheel.';
}
let editingQuestId = null;
function openQuestModal(questId){
  editingQuestId = questId || null;
  const isEdit = !!questId;
  const cq = isEdit ? state.customQuests.find(q=>q.id===questId) : null;
  document.getElementById('questModalTitle').textContent = isEdit ? 'Edit quest' : 'New quest';
  document.getElementById('questNameInput').value = cq ? cq.name : '';
  document.getElementById('questTargetInput').value = cq ? cq.target : '';
  document.getElementById('questSkillSelect').innerHTML = SKILLS.map(s=>'<option value="'+s.id+'"'+(cq&&cq.skill===s.id?' selected':'')+'>'+s.icon+' '+s.name+'</option>').join('');
  document.getElementById('questScheduleSelect').innerHTML =
    '<option value="daily"'+(!cq||cq.schedule==null||cq.schedule==='daily'?' selected':'')+'>Every day (eligible for rotation)</option>' +
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>'<option value="'+i+'"'+(cq&&cq.schedule===i?' selected':'')+'>'+d+'s only</option>').join('');
  document.getElementById('questModalBack').classList.add('open');
}
function submitQuest(){
  const name = document.getElementById('questNameInput').value.trim();
  const target = parseInt(document.getElementById('questTargetInput').value,10);
  const skill = document.getElementById('questSkillSelect').value;
  const scheduleRaw = document.getElementById('questScheduleSelect').value;
  const schedule = scheduleRaw==='daily' ? 'daily' : parseInt(scheduleRaw,10);
  if(!name || !target || target<=0) return;
  if(editingQuestId){
    const cq = state.customQuests.find(q=>q.id===editingQuestId);
    if(cq){ cq.name=name; cq.target=target; cq.skill=skill; cq.schedule=schedule; }
  } else {
    state.customQuests.push({ id:'cq'+Date.now().toString(36), name, skill, target, icon:(SKILL_MAP[skill]?SKILL_MAP[skill].icon:'🧭'), schedule, archived:false, createdAt:Date.now() });
  }
  saveState(); render(); closeModal('questModalBack');
  showToast(editingQuestId ? 'Quest updated' : 'Quest added');
  editingQuestId = null;
}
function archiveQuest(id){
  if(!state.archivedQuestIds.includes(id)) state.archivedQuestIds.push(id);
  const cq = state.customQuests.find(q=>q.id===id); if(cq) cq.archived = true;
  saveState(); render();
  showToast('Quest archived');
}
function restoreQuest(id){
  state.archivedQuestIds = state.archivedQuestIds.filter(x=>x!==id);
  const cq = state.customQuests.find(q=>q.id===id); if(cq) cq.archived = false;
  saveState(); render();
  showToast('Quest restored');
}
function deleteCustomQuest(id){
  state.customQuests = state.customQuests.filter(q=>q.id!==id);
  state.archivedQuestIds = state.archivedQuestIds.filter(x=>x!==id);
  saveState(); render();
}
function deleteQuest(id){
  const isBuiltin = QUEST_POOL.some(q=>q.id===id);
  if(isBuiltin){
    if(!confirm('Delete this quest permanently? It will never appear in your daily rotation again — this can\'t be undone.')) return;
    if(!state.deletedQuestIds.includes(id)) state.deletedQuestIds.push(id);
    state.archivedQuestIds = state.archivedQuestIds.filter(x=>x!==id);
    saveState(); render();
    showToast('Quest deleted');
  } else {
    deleteCustomQuest(id);
    showToast('Quest deleted');
  }
}
let questsShowArchived = false, questsShowHistory = false;
function toggleQuestArchived(){ questsShowArchived = !questsShowArchived; renderQuests(); }
function toggleQuestHistory(){ questsShowHistory = !questsShowHistory; renderQuests(); }

function renderQuests(){
  const showQuests = state.settings.gamification ? state.settings.gamification.showDailyQuests!==false : true;
  if(!showQuests){ document.getElementById('questsFullList').innerHTML = '<div class="empty">Daily missions are hidden — turn them back on in Settings → Gamification.</div>'; return; }
  const allToday = todaysQuests();
  const quests = allToday.filter(q=>!state.questClaims[q.key]);
  const claimedCount = allToday.length - quests.length;
  let html = '<div class="m-subhead">🔵 Daily</div>';
  html += quests.map(q=>{
    const progress = skillXpToday(q.skill); const pct = Math.min(100, Math.round((progress/q.target)*100));
    const done = progress>=q.target; const bonus = Math.round(q.target/4);
    const isCustom = !!q.custom;
    return '<div class="quest-card'+(done?' done':'')+'" draggable="true" ondragstart="onCardDragStart(event,\''+q.key+'\')" ondragend="onCardDragEnd(event)" ondragover="onCardDragOver(event)" ondrop="onQuestDrop(event,\''+q.key+'\')">' +
      '<div class="quest-card-top"><span class="ro-handle">'+iconGrip()+'</span><div class="quest-card-id"><div class="quest-card-icon">'+q.icon+'</div><span class="quest-card-name">'+escapeHtml(q.name)+'</span></div>' +
      '<span class="quest-card-reward">+'+bonus+' 🪙</span>' +
      '<div class="quest-card-actions">' +
        (isCustom ? '<button class="qc-action-btn" onclick="openQuestModal(\''+q.id+'\')" aria-label="Edit">'+iconEdit()+'</button>' : '') +
        '<button class="qc-action-btn" onclick="archiveQuest(\''+q.id+'\')" aria-label="Archive">'+iconArchive()+'</button>' +
        '<button class="qc-action-btn" onclick="deleteQuest(\''+q.id+'\')" aria-label="Delete">'+iconTrash()+'</button>' +
      '</div></div>' +
      '<div class="mini-bar"><div class="mini-fill" style="width:'+pct+'%"></div></div>' +
      '<div class="quest-card-bottom"><span class="quest-prog-txt">'+Math.min(progress,q.target)+' / '+q.target+' xp</span>' +
      '<button class="claim-mini" '+(done?'':'disabled')+' onclick="claimQuest(\''+q.key+'\','+q.target+',\''+q.skill+'\')">Claim</button></div></div>';
  }).join('');
  if(!quests.length){
    html += allToday.length
      ? '<div class="m-empty m-empty-ok"><div class="me-emoji">✨</div><div class="me-title">All caught up</div><div class="me-sub">Every quest today is claimed — nice work.</div></div>'
      : '<div class="m-empty m-empty-gold"><div class="me-emoji">🎯</div><div class="me-title">No quests today</div><div class="me-sub">Add one to build today\'s momentum.</div><button class="me-btn" onclick="openQuestModal()">+ Add a quest</button></div>';
  } else if(claimedCount>0){
    html += '<div class="quest-claimed-note">'+claimedCount+' claimed today — see Quest history below</div>';
  }

  // Recurring goals (weekly/monthly XP challenges) live here too — same rhythm as daily quests, just a longer horizon.
  const showBuiltins = state.settings.gamification ? state.settings.gamification.showWeeklyChallenges!==false : true;
  const missionDefs = allChallengeDefs().filter(c=> (showBuiltins || c.kind!=='builtin') && !c.archived && isMissionChallenge(c));
  const periodLabels = { daily:'🔵 Daily Goal', weekly:'🟣 Weekly Goal', monthly:'🟠 Monthly Goal' };
  ['daily','weekly','monthly'].forEach(period=>{
    const list = missionDefs.filter(c=>c.period===period);
    if(!list.length) return;
    html += '<div class="m-subhead">'+periodLabels[period]+'</div>';
    html += list.map(c=>{
      const {progress,target} = challengeProgress(c);
      const claimed = !!state.challengeClaims[challengeClaimKey(c)];
      return renderChallengeCard({c,progress,target,claimed});
    }).join('');
  });

  const archivedQuests = QUEST_POOL.filter(q=>state.archivedQuestIds.includes(q.id))
    .concat(state.customQuests.filter(q=>q.archived||state.archivedQuestIds.includes(q.id)).map(q=>({...q,custom:true})));
  html += '<div class="m-tuck">';
  html += '<div class="mini-link-row" onclick="toggleQuestArchived()">'+iconArchive()+' Archived quests ('+archivedQuests.length+')</div>';
  if(questsShowArchived){
    html += archivedQuests.length ? archivedQuests.map(q=>
      '<div class="archived-row"><span>'+q.icon+' '+escapeHtml(q.name)+'</span><div style="display:flex;align-items:center;gap:6px;"><button class="mini-restore-btn" onclick="restoreQuest(\''+q.id+'\')">Restore</button>' +
      '<button class="qc-action-btn" onclick="deleteQuest(\''+q.id+'\')" aria-label="Delete">'+iconTrash()+'</button></div></div>'
    ).join('') : '<div class="empty">Nothing archived.</div>';
  }
  html += '<div class="mini-link-row" onclick="toggleQuestHistory()">📜 Quest history ('+state.questHistory.length+')</div>';
  if(questsShowHistory){
    html += state.questHistory.length ? state.questHistory.slice(0,30).map(h=>
      '<div class="archived-row"><span>'+h.icon+' '+escapeHtml(h.name)+'</span><span class="history-meta">+'+h.coins+' 🪙 · '+fmtTime(h.ts)+'</span></div>'
    ).join('') : '<div class="empty">No quests claimed yet.</div>';
  }
  html += '</div>';
  document.getElementById('questsFullList').innerHTML = html;
}
function onQuestDrop(e, targetKey){
  e.preventDefault();
  if(!draggedCardKey || draggedCardKey===targetKey) return;
  reorderTodayQuest(draggedCardKey, targetKey);
}
function renderChallenges(){
  const showBuiltins = state.settings.gamification ? state.settings.gamification.showWeeklyChallenges!==false : true;
  let defs = allChallengeDefs().filter(c=> showBuiltins || c.kind!=='builtin');

  const filterChips = ['all','goal','mastery'];
  document.getElementById('challengeFilterRow').innerHTML = filterChips.map(f=>
    '<div class="cat-filter-chip'+(challengeFilter===f?' active':'')+'" onclick="setChallengeFilter(\''+f+'\')">'+f[0].toUpperCase()+f.slice(1)+'</div>'
  ).join('') +
  '<div class="m-status-row" style="width:100%;margin-top:2px;">' +
    '<div class="m-status-chip'+(challengeStatusFilter==='open'?' active':'')+'" onclick="setChallengeStatusFilter(\'open\')">Active</div>' +
    '<div class="m-status-chip'+(challengeStatusFilter==='completed'?' active':'')+'" onclick="setChallengeStatusFilter(\'completed\')">Completed</div>' +
  '</div>';

  const archived = defs.filter(c=>c.archived);
  defs = defs.filter(c=>!c.archived && !isMissionChallenge(c));
  if(challengeFilter==='goal') defs = defs.filter(c=>c.conditionType!=='mastery');
  if(challengeFilter==='mastery') defs = defs.filter(c=>c.conditionType==='mastery');

  const active=[], available=[], completed=[];
  defs.forEach(c=>{
    const {progress,target} = challengeProgress(c);
    const claimed = !!state.challengeClaims[challengeClaimKey(c)];
    const item = {c,progress,target,claimed};
    if(claimed) completed.push(item);
    else if(progress>0) active.push(item);
    else available.push(item);
  });

  const showCompleted = challengeStatusFilter==='completed';

  let html = '';
  if(!showCompleted){
    if(active.length){
      html += '<div class="m-subhead">🟢 In progress</div>';
      html += active.map(renderChallengeCard).join('');
    }
    html += '<div class="m-subhead">🟡 Available</div>';
    html += available.length ? available.map(renderChallengeCard).join('')
      : (active.length
        ? '<div class="m-empty m-empty-violet"><div class="me-emoji">🎉</div><div class="me-title">Nice work!</div><div class="me-sub">You\'ve started everything available. Check back tomorrow or create your own.</div><button class="me-btn" onclick="openCustomChallengeModal()">+ Create challenge</button></div>'
        : '<div class="m-empty m-empty-violet"><div class="me-emoji">🚀</div><div class="me-title">No active challenges</div><div class="me-sub">Start one to work toward something bigger than today.</div><button class="me-btn" onclick="openCustomChallengeModal()">+ Create challenge</button></div>');
  } else {
    html += completed.length ? completed.map(renderChallengeCard).join('')
      : '<div class="m-empty m-empty-violet"><div class="me-emoji">📭</div><div class="me-title">Nothing completed yet</div><div class="me-sub">Claimed challenges for this period will show up here.</div></div>';
  }

  html += '<div class="m-tuck">';
  html += '<div class="mini-link-row" onclick="toggleChallengesCompleted()">✅ Completed Challenges ('+completed.length+')</div>';
  if(challengesCompletedOpen){
    html += completed.length ? completed.map(renderChallengeCard).join('') : '<div class="empty">None yet this period.</div>';
  }
  html += '<div class="mini-link-row" onclick="toggleChallengesHistory()">📜 Challenge History ('+state.challengeHistory.length+')</div>';
  if(challengesHistoryOpen){
    html += state.challengeHistory.length ? state.challengeHistory.slice(0,40).map(h=>
      '<div class="archived-row"><span>'+h.icon+' '+escapeHtml(h.name)+'</span><span class="history-meta">+'+h.reward+' 🪙 · '+fmtTime(h.ts)+'</span></div>'
    ).join('') : '<div class="empty">No challenges claimed yet.</div>';
  }
  if(archived.length){
    html += '<div class="mini-link-row" onclick="toggleChallengesArchived()">'+iconArchive()+' Archived (' + archived.length + ')</div>';
    if(challengesArchivedOpen){
      html += archived.map(c=>
        '<div class="archived-row"><span>'+c.icon+' '+escapeHtml(c.name)+'</span><button class="mini-restore-btn" onclick="restoreChallenge(\''+c.id+'\')">Restore</button></div>'
      ).join('');
    }
  }
  html += '</div>';
  document.getElementById('challengesList').innerHTML = html;
}
function renderChallengeCard(item){
  const {c,progress,target,claimed} = item;
  const done = progress>=target;
  const pct = Math.min(100, Math.round((progress/target)*100));
  const periodTag = c.period && c.period!=='once' ? '<span class="task-tag cat" style="margin-left:6px;">'+c.period+'</span>' : '';
  const isCustom = c.kind==='custom';
  return '<div class="challenge-card">' +
    '<div class="challenge-top"><div class="challenge-id-row"><div class="quest-card-icon">'+c.icon+'</div><div><div class="challenge-name">'+escapeHtml(c.name)+periodTag+'</div><div class="challenge-sub">'+escapeHtml(c.desc||'')+'</div></div></div>' +
    '<div style="display:flex;align-items:center;gap:2px;flex-shrink:0;"><div class="challenge-reward">+'+c.reward+' 🪙</div>' +
    (isCustom ? '<button class="qc-action-btn" onclick="openCustomChallengeModal(\''+c.id+'\')" aria-label="Edit">'+iconEdit()+'</button>' : '') +
    '<button class="qc-action-btn" onclick="archiveChallenge(\''+c.id+'\')" aria-label="Archive">'+iconArchive()+'</button>' +
    (isCustom ? '<button class="qc-action-btn" onclick="deleteCustomChallenge(\''+c.id+'\')" aria-label="Delete">'+iconTrash()+'</button>' : '') +
    '</div></div>' +
    '<div class="mini-bar"><div class="mini-fill" style="width:'+pct+'%"></div></div>' +
    '<div class="quest-card-bottom"><span class="quest-prog-txt">'+Math.min(progress,target)+' / '+target+'</span>' +
    '<button class="claim-mini'+(claimed?' claimed':'')+'" '+(claimed?'disabled':(done?'':'disabled'))+' onclick="claimChallengeUnified(\''+c.id+'\')">'+(claimed?'Claimed ✓':'Claim')+'</button></div></div>';
}
function renderNegHabits(){
  const activeHabits = state.negativeHabits.filter(h=>!state.archivedHabitIds.includes(h.id));
  document.getElementById('negHabitsList').innerHTML = activeHabits.map(h=>
    '<div class="neghabit-row"><div><div class="neghabit-name">'+escapeHtml(h.name)+'</div><div class="neghabit-fine">−'+h.fine+' coins</div></div>' +
    '<div style="display:flex;align-items:center;gap:6px;"><button class="neghabit-log-btn" onclick="logNegativeHabit(\''+h.id+'\')">Log</button>' +
    (BUILTIN_HABIT_IDS.includes(h.id)
      ? '<button class="neghabit-del" onclick="archiveHabit(\''+h.id+'\')" aria-label="Archive">'+iconArchive()+'</button>'
      : '<button class="neghabit-del" onclick="deleteNegHabit(\''+h.id+'\')" aria-label="Remove">\u00d7</button>') +
    '</div></div>'
  ).join('') || '';
  const active = state.fines.filter(f=>!f.resolved).sort((a,b)=>b.ts-a.ts);
  const finesHtml = active.length ? active.map(f=>
    '<div class="fine-row"><div class="fine-row-top"><div><div class="fine-name">⚠️ '+escapeHtml(f.habitName)+'</div>' +
    '<div class="fine-time">'+fmtTime(f.ts)+'</div></div><div class="fine-amount">−'+f.amount+' 🪙</div></div>' +
    '<button class="fine-recovery-btn" onclick="resolveFine(\''+f.id+'\')">I made up for it — clear this fine</button></div>'
  ).join('') : '';
  document.getElementById('activeFinesList').innerHTML = finesHtml;

  if(!activeHabits.length && !active.length){
    document.getElementById('negHabitsList').innerHTML = '<div class="m-empty m-empty-ok"><div class="me-emoji">✔️</div><div class="me-title">You\'re on track</div><div class="me-sub">Everything looks good today — no fines, no recovery needed.</div></div>';
  } else if(!activeHabits.length){
    document.getElementById('negHabitsList').innerHTML = '<div class="empty">No accountability habits active.</div>';
  }

  const archivedHabits = state.negativeHabits.filter(h=>state.archivedHabitIds.includes(h.id));
  const resolvedFines = state.fines.filter(f=>f.resolved).sort((a,b)=>b.resolvedAt-a.resolvedAt).slice(0,40);
  let extra = '<div class="m-tuck">';
  extra += '<div class="mini-link-row" onclick="toggleFineHistory()">📜 Fine history ('+resolvedFines.length+')</div>';
  if(fineHistoryOpen){
    extra += resolvedFines.length ? resolvedFines.map(f=>
      '<div class="archived-row"><span>'+escapeHtml(f.habitName)+'</span><span class="history-meta">−'+f.amount+' 🪙 · cleared '+fmtTime(f.resolvedAt)+'</span></div>'
    ).join('') : '<div class="empty">No cleared fines yet.</div>';
  }
  extra += '<div class="mini-link-row" onclick="toggleHabitArchived()">'+iconArchive()+' Archived habits ('+archivedHabits.length+')</div>';
  if(habitArchivedOpen){
    extra += archivedHabits.length ? archivedHabits.map(h=>
      '<div class="archived-row"><span>'+escapeHtml(h.name)+' (−'+h.fine+')</span><button class="mini-restore-btn" onclick="restoreHabit(\''+h.id+'\')">Restore</button></div>'
    ).join('') : '<div class="empty">Nothing archived.</div>';
  }
  extra += '</div>';
  document.getElementById('habitArchiveHistoryWrap').innerHTML = extra;
}
let mastActiveTab = 'all';
let mastExpanded = {};
function openMasteriesModal(){ renderMasteries(); document.getElementById('mastModalBack').classList.add('open'); }
function setMastTab(cat){ mastActiveTab = cat; renderMasteries(); }
function toggleMastCard(id){ mastExpanded[id] = !mastExpanded[id]; renderMasteries(); }
function masteryProgressText(def, value){
  const tierIdx = masteryTierIndex(def, value);
  const nextIdx = tierIdx+1;
  if(nextIdx>=def.milestones.length) return { pct:100, label:'Max tier reached', tierIdx };
  const prevTarget = tierIdx>=0 ? def.milestones[tierIdx] : 0;
  const nextTarget = def.milestones[nextIdx];
  const pct = Math.round(((value-prevTarget)/(nextTarget-prevTarget))*100);
  return { pct: Math.max(0,Math.min(100,pct)), label: value+' / '+nextTarget+' toward '+MASTERY_TIERS[nextIdx], tierIdx, nextTarget };
}
function renderMasteries(){
  const defs = allMasteryDefs();
  let tierCount = 0;
  defs.forEach(def=>{ tierCount += (state.masteries[def.id]?.claimedTiers?.length)||0; });
  const maxPossible = defs.length * MASTERY_TIERS.length;
  document.getElementById('mastProgressTxt').textContent = tierCount + ' / ' + maxPossible + ' tiers unlocked';

  const tabsEl = document.getElementById('mastTabs');
  const counts = {}; defs.forEach(d=> counts[d.category]=(counts[d.category]||0)+1);
  tabsEl.innerHTML = '<div class="mast-tab'+(mastActiveTab==='all'?' active':'')+'" onclick="setMastTab(\'all\')">All</div>' +
    MASTERY_CATEGORIES.filter(c=>counts[c.id]).map(c=>
      '<div class="mast-tab'+(mastActiveTab===c.id?' active':'')+'" onclick="setMastTab(\''+c.id+'\')">'+c.icon+' '+c.name+'</div>'
    ).join('');

  const visible = defs.filter(d=> mastActiveTab==='all' || d.category===mastActiveTab);
  document.getElementById('mastList').innerHTML = visible.map(def=>{
    const value = def.compute();
    const rec = masteryRecord(def.id);
    const prog = masteryProgressText(def, value);
    const tierIdx = prog.tierIdx;
    const tierName = tierIdx>=0 ? MASTERY_TIERS[tierIdx] : 'Unranked';
    const tierColor = tierIdx>=0 ? TIER_COLORS[tierIdx] : 'var(--text-faint)';
    const coinsEarned = rec.claimedTiers.reduce((s,i)=>s+TIER_REWARDS[i].coins,0);
    const xpEarned = rec.claimedTiers.reduce((s,i)=>s+TIER_REWARDS[i].xp,0);
    const skillChips = def.skills.map(sk=> SKILL_MAP[sk] ? SKILL_MAP[sk].icon+' '+SKILL_MAP[sk].name : '').filter(Boolean).join(' · ');
    const expanded = !!mastExpanded[def.id];
    const ladder = def.milestones.map((m,i)=>{
      const reached = rec.claimedTiers.includes(i);
      return '<div class="mast-ladder-row'+(reached?' reached':'')+'"><span class="mast-ladder-tier" style="color:'+TIER_COLORS[i]+'">'+MASTERY_TIERS[i]+'</span>' +
        '<span class="mast-ladder-target">'+m+'</span>' +
        '<span class="mast-ladder-reward">+'+TIER_REWARDS[i].xp+' XP · +'+TIER_REWARDS[i].coins+' 🪙'+(TIER_REWARDS[i].bonus?' · bonus':'')+'</span></div>';
    }).join('');
    return '<div class="mast-card">' +
      '<div class="mast-card-top" onclick="toggleMastCard(\''+def.id+'\')">' +
        '<div class="mast-card-icon">'+def.icon+'</div>' +
        '<div class="mast-card-mid"><div class="mast-card-name">'+escapeHtml(def.name)+' <span class="mast-tier-pill" style="color:'+tierColor+';border-color:'+tierColor+'">'+tierName+'</span></div>' +
        '<div class="mast-card-desc">'+escapeHtml(def.desc)+'</div>' +
        '<div class="mini-bar" style="margin-top:7px;"><div class="mini-fill" style="width:'+prog.pct+'%;background:'+tierColor+'"></div></div>' +
        '<div class="mast-card-prog">'+prog.label+'</div></div>' +
        (def.custom ? '<button class="mast-log-btn" onclick="event.stopPropagation();logCustomMastery(\''+def.id+'\')">+1</button>' : '') +
      '</div>' +
      (expanded ? '<div class="mast-card-expand">' +
        (skillChips ? '<div class="mast-expand-row"><b>Related skills:</b> '+skillChips+'</div>' : '') +
        '<div class="mast-expand-row"><b>Total completions:</b> '+value.toLocaleString()+'</div>' +
        '<div class="mast-expand-row"><b>Rewards earned:</b> +'+xpEarned+' XP · +'+coinsEarned+' 🪙</div>' +
        '<div class="mast-ladder">'+ladder+'</div>' +
        (def.custom ? '<button class="reward-del" style="margin-top:8px;" onclick="deleteCustomMastery(\''+def.id+'\')">Delete custom mastery</button>' : '') +
      '</div>' : '') +
    '</div>';
  }).join('') || '<div class="empty">No masteries in this category yet.</div>';

  document.getElementById('mastLinkCount').textContent = tierCount + ' / ' + maxPossible + ' tiers';
}
const MASTERY_ICON_OPTIONS = ['📝','🎸','🎹','🧘','🎨','♟️','🌐','🧗','🚴','🎣','🧵','🪴','📷','🗣️','🧩','🏹'];
function openCustomMasteryModal(){
  document.getElementById('masteryNameInput').value = '';
  document.getElementById('masteryDescInput').value = '';
  document.getElementById('masteryMilestonesInput').value = '';
  const iconPicker = document.getElementById('masteryIconPicker');
  iconPicker.innerHTML = MASTERY_ICON_OPTIONS.map((a,i)=>'<div class="avatar-opt'+(i===0?' active':'')+'" data-icon="'+a+'" onclick="pickMasteryIcon(this)">'+a+'</div>').join('');
  pendingMasteryIcon = MASTERY_ICON_OPTIONS[0];
  const skillPicker = document.getElementById('masterySkillPicker');
  pendingMasterySkills = [];
  skillPicker.innerHTML = SKILLS.map(s=>'<div class="mast-skill-chip" data-skill="'+s.id+'" onclick="toggleMasterySkill(this,\''+s.id+'\')">'+s.icon+' '+s.name+'</div>').join('');
  document.getElementById('customMasteryModalBack').classList.add('open');
}
let pendingMasteryIcon = '📝';
let pendingMasterySkills = [];
function pickMasteryIcon(el){ document.querySelectorAll('#masteryIconPicker .avatar-opt').forEach(o=>o.classList.remove('active')); el.classList.add('active'); pendingMasteryIcon = el.dataset.icon; }
function toggleMasterySkill(el, skillId){
  const idx = pendingMasterySkills.indexOf(skillId);
  if(idx>=0){ pendingMasterySkills.splice(idx,1); el.classList.remove('active'); }
  else { if(pendingMasterySkills.length>=3) return; pendingMasterySkills.push(skillId); el.classList.add('active'); }
}
function submitCustomMastery(){
  const name = document.getElementById('masteryNameInput').value.trim();
  const desc = document.getElementById('masteryDescInput').value.trim();
  const raw = document.getElementById('masteryMilestonesInput').value.trim();
  let milestones = raw.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>Number.isFinite(n) && n>0);
  milestones = [...new Set(milestones)].sort((a,b)=>a-b).slice(0,8);
  if(!name || milestones.length<2){ showToast('Add a name and at least 2 ascending milestones'); return; }
  state.customMasteries.push({
    id:'cm'+Date.now(), name, icon:pendingMasteryIcon, desc, skills:pendingMasterySkills.slice(),
    milestones, completions:0, createdAt:Date.now()
  });
  saveState(); render(); renderMasteries();
  closeModal('customMasteryModalBack');
  showToast('Custom mastery created');
}
function logCustomMastery(id){
  const cm = state.customMasteries.find(c=>c.id===id); if(!cm) return;
  cm.completions = (cm.completions||0)+1;
  saveState(); checkMasteries(); render(); renderMasteries();
  vibrate([10]);
}
function deleteCustomMastery(id){
  state.customMasteries = state.customMasteries.filter(c=>c.id!==id);
  delete state.masteries[id];
  saveState(); render(); renderMasteries();
}
function renderRewards(){
  const availX = availableXp(), availC = availableCoins();
  document.getElementById('balanceRow').innerHTML =
    '<div class="balance-card coin"><div class="bc-label">Coin balance</div><div class="bc-value">'+availC.toLocaleString()+'</div></div>' +
    '<div class="balance-card xp"><div class="bc-label">XP to spend</div><div class="bc-value">'+availX.toLocaleString()+'</div></div>';
  document.getElementById('rewardsList').innerHTML = state.rewards.slice().sort((a,b)=>a.cost-b.cost).map(r=>{
    const canAfford = r.type==='xp' ? availX>=r.cost : availC>=r.cost;
    return '<div class="reward-card"><div class="reward-icon">'+r.icon+'</div>' +
      '<div class="reward-info"><div class="reward-name">'+escapeHtml(r.name)+'</div>' +
      '<div class="reward-cost type-'+r.type+'">'+r.cost.toLocaleString()+' '+(r.type==='xp'?'XP':'coins')+'</div></div>' +
      '<div class="reward-actions"><button class="claim-btn type-'+r.type+(canAfford?'':' insufficient')+'" onclick="claimReward(\''+r.id+'\')">Claim</button>' +
      '<button class="reward-del" onclick="deleteReward(\''+r.id+'\')" aria-label="Remove reward">\u00d7</button></div></div>';
  }).join('');
  const claimsTitle = document.getElementById('claimsTitle');
  const recentClaims = state.claims.slice(0,5);
  claimsTitle.style.display = recentClaims.length ? 'flex' : 'none';
  document.getElementById('claimsList').innerHTML = recentClaims.map(c=>
    '<div class="claim-row"><span class="row-name">'+escapeHtml(c.rewardName)+'</span><div class="reward-cost type-'+c.type+'">\u2212'+c.cost.toLocaleString()+' '+(c.type==='xp'?'XP':'coins')+'</div></div>'
  ).join('');
}
/* ============ Calendar ============ */
let calCursor = new Date(); calCursor.setDate(1);
let selectedCalDate = null;
function calShift(delta){ calCursor.setMonth(calCursor.getMonth()+delta); renderCalendar(); }
function dayInfo(dayIso){
  const completedCount = state.timeline.filter(e=> isoFromTs(e.ts)===dayIso && (e.type==='task'||e.type==='quest'||e.type==='challenge')).length;
  const isToday = dayIso===todayISO();
  const pendingDue = state.tasks.filter(t=>!t.completed && (t.dueDate===dayIso || (isToday && !t.dueDate)));
  const hasExam = pendingDue.some(t=>t.tag==='exam');
  const hasDeadline = pendingDue.some(t=>t.tag==='deadline');
  return { completedCount, pendingDue, hasExam, hasDeadline };
}
function selectCalDay(dayIso){
  selectedCalDate = (selectedCalDate===dayIso) ? null : dayIso;
  renderCalendar();
}
function renderCalendar(){
  const wrap = document.getElementById('calendarWrap');
  if(!wrap) return;
  document.body.classList.remove('cal-density-compact','cal-density-standard','cal-density-detailed');
  document.body.classList.add('cal-density-'+((state.settings.calendar && state.settings.calendar.density) || 'standard'));
  const sundayStart = state.settings.calendar && state.settings.calendar.weekStart==='sunday';
  const year = calCursor.getFullYear(), month = calCursor.getMonth();
  const monthLabel = calCursor.toLocaleDateString([], {month:'long', year:'numeric'});
  const firstDay = new Date(year, month, 1);
  const startOffset = sundayStart ? firstDay.getDay() : (firstDay.getDay()+6)%7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayIso = todayISO();

  const dayGrowths = {}; let maxScore = 0;
  for(let d=1; d<=daysInMonth; d++){
    const dIso = isoDate(new Date(year, month, d));
    const g = computeDayGrowth(dIso);
    dayGrowths[d] = g;
    if(g.score>maxScore) maxScore = g.score;
  }
  const accent = (state.settings.appearance && state.settings.appearance.accent) || '#E8B54D';
  const rgb = hexToRgb(accent);

  let cells = '';
  for(let i=0;i<startOffset;i++) cells += '<div class="cal-cell empty"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const dIso = isoDate(new Date(year, month, d));
    const info = dayInfo(dIso);
    const g = dayGrowths[d];
    const frac = maxScore>0 ? g.score/maxScore : 0;
    const alpha = g.score<=0 ? 0.06 : Math.min(1, 0.18 + frac*0.82);
    const bg = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+alpha.toFixed(2)+')';
    const textColor = alpha>0.55 ? '#1a1408' : 'var(--text-mute)';
    const dots = [];
    if(info.hasExam) dots.push('<span class="cal-dot violet"></span>');
    else if(info.hasDeadline) dots.push('<span class="cal-dot danger"></span>');
    else if(info.pendingDue.length>0) dots.push('<span class="cal-dot teal"></span>');
    cells += '<div class="cal-cell'+(dIso===todayIso?' today':'')+(dIso===selectedCalDate?' selected':'')+'" style="background:'+bg+';color:'+textColor+';" onclick="selectCalDay(\''+dIso+'\')">' +
      '<span class="cal-daynum">'+d+'</span><span class="cal-dots">'+dots.join('')+'</span></div>';
  }

  let agenda = '';
  if(selectedCalDate){
    const info = dayInfo(selectedCalDate);
    const g = computeDayGrowth(selectedCalDate);
    const label = new Date(selectedCalDate+'T00:00:00').toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
    const dayEvents = state.timeline.filter(e=>isoFromTs(e.ts)===selectedCalDate).sort((a,b)=>b.ts-a.ts);
    let growthBlock = '';
    if(g.count>0){
      const topSkills = Object.entries(g.skillTotals).sort((a,b)=>b[1]-a[1]).slice(0,3);
      growthBlock = '<div class="hm-day-card" style="margin-top:10px;">' +
        '<div class="hm-day-score">'+g.score.toLocaleString()+'</div><div class="hm-day-score-label">Growth Score</div>' +
        '<div class="hm-day-stats"><span class="hm-day-stat">✨ '+g.xp+' XP</span><span class="hm-day-stat">🪙 '+g.coins+' Coins</span><span class="hm-day-stat">✅ '+g.count+' task'+(g.count===1?'':'s')+'</span></div>' +
        (topSkills.length ? '<div class="hm-day-areas">'+topSkills.map(([id,xp])=>'<div class="hm-day-area-row"><span>'+(SKILL_MAP[id]?SKILL_MAP[id].icon+' '+SKILL_MAP[id].name:id)+'</span><span>+'+xp+' XP</span></div>').join('')+'</div>' : '') +
        (dayEvents.length ? '<div class="hm-day-tasks-label">Activity</div>' + dayEvents.map(e=>{
          const rewardBits = [];
          if(e.xp) rewardBits.push((e.xp>0?'+':'')+e.xp+' XP');
          if(e.coins) rewardBits.push((e.coins>0?'+':'')+e.coins+' 🪙');
          const neg = (e.xp<0 || e.coins<0);
          return '<div class="tl-row"><span class="tl-time">'+fmtClock(e.ts)+'</span><span class="tl-icon">'+(TIMELINE_ICONS[e.type]||'•')+'</span>'+
            '<span class="tl-desc">'+escapeHtml(e.title)+'</span>'+
            (rewardBits.length ? '<span class="tl-reward'+(neg?' neg':'')+'">'+rewardBits.join(' · ')+'</span>' : '') +
          '</div>';
        }).join('') : '') +
      '</div>';
    }
    let items = '';
    info.pendingDue.forEach(t=>{
      items += '<div class="cal-agenda-row" onclick="goTo(\'home\'); scrollToTask(\''+t.id+'\')"><span class="tl-icon">'+(t.tag==='exam'?'🎓':t.tag==='deadline'?'⚠️':'📌')+'</span>' +
        '<span class="tl-desc">'+escapeHtml(t.title)+'</span><span class="tl-reward">~'+t.estXp+' XP</span></div>';
    });
    agenda = '<div class="cal-agenda"><div class="cal-agenda-title">'+label+'</div>' + (items || (g.count?'':'<div class="empty">Nothing here.</div>')) + '</div>' + growthBlock;
  }

  wrap.innerHTML =
    '<div class="cal-header"><button class="icon-btn" onclick="calShift(-1)" aria-label="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<span class="cal-month-label">'+monthLabel+'</span>' +
    '<button class="icon-btn" onclick="calShift(1)" aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button></div>' +
    '<div class="cal-weekday-row">'+(sundayStart?['S','M','T','W','T','F','S']:['M','T','W','T','F','S','S']).map(d=>'<span>'+d+'</span>').join('')+'</div>' +
    '<div class="cal-grid">'+cells+'</div>' +
    '<div class="hm-legend"><span>0 pts</span><div class="hm-legend-dots">'+[0.06,0.25,0.45,0.65,0.85,1].map(a=>'<span style="background:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+');"></span>').join('')+'</div><span>'+(maxScore>0?maxScore.toLocaleString():'0')+' pts (best day)</span></div>' +
    '<div class="hm-legend-explain">Growth Score = XP + half your coins + a bonus for harder tasks and for touching multiple skills in one day. Not just how many tasks you did.</div>' +
    agenda;
}
function dayGroupLabel(ts){
  const d = new Date(ts);
  const today = todayKey(), yest = yesterdayKey();
  const dk = todayKey(d);
  if(dk===today) return 'Today';
  if(dk===yest) return 'Yesterday';
  return d.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
}
function fmtClock(ts){
  const use12 = state.settings.calendar && state.settings.calendar.timeFormat==='12';
  return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:use12});
}
function openTimelineView(){ goTo('history'); if(typeof renderCalendar==='function') renderCalendar(); }


/* ============ Wire up ============ */
document.getElementById('quickAddModalBack').addEventListener('click', e=>{ if(e.target.id==='quickAddModalBack') closeModal('quickAddModalBack'); });
document.getElementById('brainDumpModalBack').addEventListener('click', e=>{ if(e.target.id==='brainDumpModalBack') closeModal('brainDumpModalBack'); });
document.getElementById('onboardModalBack').addEventListener('click', e=>{ if(e.target.id==='onboardModalBack') finishOnboarding(); });
document.getElementById('challengeModalBack').addEventListener('click', e=>{ if(e.target.id==='challengeModalBack') closeModal('challengeModalBack'); });
document.getElementById('questModalBack').addEventListener('click', e=>{ if(e.target.id==='questModalBack') closeModal('questModalBack'); });
document.getElementById('negHabitModalBack').addEventListener('click', e=>{ if(e.target.id==='negHabitModalBack') closeModal('negHabitModalBack'); });
document.getElementById('rewardModalBack').addEventListener('click', e=>{ if(e.target.id==='rewardModalBack') closeModal('rewardModalBack'); });
document.getElementById('mastModalBack').addEventListener('click', e=>{ if(e.target.id==='mastModalBack') closeModal('mastModalBack'); });
document.getElementById('customMasteryModalBack').addEventListener('click', e=>{ if(e.target.id==='customMasteryModalBack') closeModal('customMasteryModalBack'); });
document.getElementById('editProfileModalBack').addEventListener('click', e=>{ if(e.target.id==='editProfileModalBack') closeModal('editProfileModalBack'); });
document.getElementById('syncModalBack').addEventListener('click', e=>{ if(e.target.id==='syncModalBack') closeModal('syncModalBack'); });
document.getElementById('appLockModalBack').addEventListener('click', e=>{ if(e.target.id==='appLockModalBack') closeModal('appLockModalBack'); });

loadState();
