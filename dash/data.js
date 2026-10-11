// Platforms, events and modelled metrics. Edit metrics() to plug in real measured data.
const PLATFORMS=[
 {k:'x',n:'Twitter/X',c:'#2b3440'},
 {k:'reddit',n:'Reddit',c:'#f08c00'},
 {k:'yt',n:'YouTube',c:'#d6336c'},
 {k:'official',n:'Official sites',c:'#1971c2'},
 {k:'news',n:'News and blogs',c:'#2f9e44'}
];
const DISTRICTS=['Thane','Raigad','Palghar','Ratnagiri','Sindhudurg'];
const TYPES={sudden:'Sudden incident',disaster:'Weather or disaster',announce:'Planned announcement'};

// [district, date, headline, category, pattern]
const EVENTS=[
['Thane','13 Apr 2026','Cement mixer and passenger van collide on Kalyan–Ahilyanagar highway; 11 dead','Road accident','sudden'],
['Thane','15–16 Apr 2026','IMD heatwave warning for Thane; temperatures above 40°C','Weather','disaster'],
['Thane','4 Jul 2026','Extreme monsoon rain floods Thane district; schools shut','Natural disaster','disaster'],
['Thane','8 Jul 2026','Shiv Sena corporator arrested for assaulting doctors at Dombivli hospital','Politics and law','sudden'],
['Thane','9 Jul 2026','Doctor resigns after assault, citing safety fears','Healthcare','sudden'],
['Raigad','27 Mar 2026','Seaweed farming expands along Raigad coast','Blue economy','announce'],
['Raigad','9 Apr 2026','LPG tanker Green Asha docks at JNPA with 15,400 tonnes','Maritime','announce'],
['Raigad','30 Apr 2026','MMRDA acquires 216 acres for Mumbai 3.0 (Pen Growth Centre)','Infrastructure','announce'],
['Raigad','25 May 2026','Eight tourists die as SUV falls into gorge at Ambenali Ghat','Road accident','sudden'],
['Raigad','1–10 Jul 2026','Floods across Raigad; Amba River crosses danger mark; Red Alert','Natural disaster','disaster'],
['Palghar','21 Apr 2026','Firecracker unit blast kills two women, injures four','Industrial accident','sudden'],
['Palghar','1 May 2026','124 villagers hand over land for Vadhvan Port','Infrastructure','announce'],
['Palghar','18 May 2026','Container trailer hits tempo on Mumbai–Ahmedabad highway; 13 dead','Road accident','sudden'],
['Palghar','29 Jun 2026','Offshore airport announced near Kore Beach','Infrastructure','announce'],
['Palghar','2–11 Jul 2026','Monsoon floods; bridges washed away; NDRF rescue','Natural disaster','disaster'],
['Ratnagiri','8 Apr 2026','Hailstorm damages Alphonso mango and cashew orchards','Agriculture and weather','disaster'],
['Ratnagiri','19 Apr 2026','Administration drive against child marriages before Akshaya Tritiya','Administration','announce'],
['Ratnagiri','21 Apr 2026','Chain accident at Hatkhamba bridge; truck falls into well','Road accident','sudden'],
['Ratnagiri','4 May 2026','Magnitude 2.7 earthquake near Yegaon, Chiplun','Natural disaster','disaster'],
['Ratnagiri','6 Jul 2026','Roof section collapses at Ratnagiri Railway Station in heavy rain','Infrastructure','disaster'],
['Sindhudurg','25 May 2026','Alphonso mango exports see record demand','Agriculture and economy','announce'],
['Sindhudurg','16 Jun 2026','Chipi Airport expansion and extra flights announced','Aviation','announce'],
['Sindhudurg','2–8 Jul 2026','Red Alert rain: floods, landslides and road closures','Natural disaster','disaster'],
['Sindhudurg','14 Aug 2026','Coastal anti-drug operation seizes narcotics worth crores','Law enforcement','announce'],
['Sindhudurg','5 Sep 2026','Coastal tourism projects approved for Tarkarli and Devbag','Tourism','announce']
].map((e,i)=>({id:i,district:e[0],date:e[1],title:e[2],cat:e[3],type:e[4]}));

// Typical pattern per event type. Order follows PLATFORMS.
const PROFILE={
 sudden:{speed:[10,60,75,120,30],reach:[82,38,70,45,75],trust:[58,66,72,95,84],
  phase:[[3,100,55],[2,45,70],[2,60,50],[5,55,40],[4,85,60]],
  sent:[[62,26,12],[55,33,12],[58,28,14],[20,70,10],[48,40,12]]},
 disaster:{speed:[15,50,60,20,25],reach:[85,42,78,70,80],trust:[55,64,70,93,82],
  phase:[[35,100,60],[20,55,65],[25,70,50],[60,90,45],[40,85,55]],
  sent:[[58,30,12],[50,36,14],[52,32,16],[18,68,14],[44,42,14]]},
 announce:{speed:[40,180,240,5,45],reach:[50,25,45,72,78],trust:[70,72,74,96,85],
  phase:[[8,100,45],[5,40,50],[5,55,45],[30,100,50],[15,90,55]],
  sent:[[22,38,40],[28,36,36],[18,40,42],[4,50,46],[12,42,46]]}
};

function seed(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rnd(s){let t=seed(s)+0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const j=(id,tag,amp)=>1+(rnd(id+tag)-.5)*2*amp;

// Returns per-platform metrics for one event.
function metrics(ev){
 const p=PROFILE[ev.type],id='e'+ev.id;
 return PLATFORMS.map((pl,i)=>{
  const speed=Math.max(2,Math.round(p.speed[i]*j(id,'s'+i,.22)));
  const reach=Math.round(cl(p.reach[i]*j(id,'r'+i,.12)));
  const trust=Math.round(cl(p.trust[i]*j(id,'t'+i,.06),30,99));
  const phase=p.phase[i].map((v,k)=>Math.round(cl(v*j(id,'p'+i+k,.15))));
  const s=p.sent[i].map((v,k)=>v*j(id,'m'+i+k,.15)),sum=s[0]+s[1]+s[2];
  const sent=s.map(v=>Math.round(v/sum*100));sent[1]+=100-sent[0]-sent[1]-sent[2];
  return {name:pl.n,color:pl.c,speed,reach,trust,phase,sent,mis:reach*(100-trust)/100};
 });
}
