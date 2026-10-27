// ================= real politicians: names the game must never use or allow
// Eko Nights has corrupt politicians in it, so none of its characters may share or echo a real politician's name, and
// players can't register as one. This list covers Nigerian presidents, vice presidents, governors, senate and house
// leaders, ministers, party leaders and presidential candidates since 1999 (plus founding figures). It is not every
// politician who ever lived: add names here when you spot one. Also used by the server's name check (functions/names.js).
const POLITICIANS=`Bola Tinubu;Remi Tinubu;Kashim Shettima;Muhammadu Buhari;Yemi Osinbajo;Goodluck Jonathan;Namadi Sambo;Umaru Yar'Adua;Olusegun Obasanjo;Atiku Abubakar;
Ibrahim Babangida;Sani Abacha;Abdulsalami Abubakar;Yakubu Gowon;Ernest Shonekan;Shehu Shagari;Alex Ekwueme;Nnamdi Azikiwe;Obafemi Awolowo;Ahmadu Bello;Tafawa Balewa;
Moshood Abiola;Murtala Mohammed;Peter Obi;Rabiu Kwankwaso;Datti Baba-Ahmed;Ifeanyi Okowa;Abdullahi Ganduje;Adams Oshiomhole;Uche Secondus;Iyorchia Ayu;Umar Damagum;
Julius Abure;Kola Abiola;Omoyele Sowore;Olisa Agbakoba;Femi Fani-Kayode;Dino Melaye;Shehu Sani;Bukola Saraki;Godswill Akpabio;Ahmad Lawan;David Mark;Ike Ekweremadu;
Barau Jibrin;Tajudeen Abbas;Benjamin Kalu;Femi Gbajabiamila;Yakubu Dogara;Aminu Tambuwal;Dimeji Bankole;Patricia Etteh;Orji Kalu;Rochas Okorocha;Theodore Orji;
Rotimi Amaechi;Nyesom Wike;Siminalayi Fubara;Peter Odili;Babatunde Fashola;Akinwunmi Ambode;Babajide Sanwo-Olu;Obafemi Hamzat;Dapo Abiodun;Ibikunle Amosun;Gbenga Daniel;
Seyi Makinde;Abiola Ajimobi;Rashidi Ladoja;Adebayo Alao-Akala;Gboyega Oyetola;Ademola Adeleke;Rauf Aregbesola;Isiaka Adeleke;Olagunsoye Oyinlola;Kayode Fayemi;
Biodun Oyebanji;Ayodele Fayose;Segun Oni;Segun Mimiko;Rotimi Akeredolu;Lucky Aiyedatiwa;Olusegun Agagu;Godwin Obaseki;Monday Okpebholo;Philip Shaibu;Lucky Igbinedion;
Sheriff Oborevwori;Emmanuel Uduaghan;James Ibori;Douye Diri;Seriake Dickson;Timipre Sylva;Diepreye Alamieyeseigha;Udom Emmanuel;Umo Eno;Victor Attah;Ben Ayade;Bassey Otu;
Donald Duke;Liyel Imoke;Hope Uzodimma;Emeka Ihedioha;Ikedi Ohakim;Achike Udenwa;Alex Otti;Okezie Ikpeazu;Charles Soludo;Willie Obiano;Chris Ngige;Chinwoke Mbadinuju;
Peter Mbah;Ifeanyi Ugwuanyi;Sullivan Chime;Chimaroke Nnamani;Francis Nwifuru;David Umahi;Martin Elechi;Sam Egwu;Yahaya Bello;Usman Ododo;Idris Wada;Ibrahim Idris;
Abdulrahman Abdulrazaq;Abdulfatah Ahmed;Simon Lalong;Caleb Mutfwang;Jonah Jang;Joshua Dariye;Samuel Ortom;Hyacinth Alia;Gabriel Suswam;George Akume;Abdullahi Sule;
Tanko Al-Makura;Nasir El-Rufai;Uba Sani;Ramalan Yero;Patrick Yakowa;Ahmed Makarfi;Abba Yusuf;Ibrahim Shekarau;Aminu Masari;Dikko Radda;Ibrahim Shema;Abdulaziz Yari;
Bello Matawalle;Dauda Lawal;Ahmad Aliyu;Atiku Bagudu;Nasir Idris;Badaru Abubakar;Umar Namadi;Sule Lamido;Inuwa Yahaya;Ibrahim Dankwambo;Bala Mohammed;Isa Yuguda;
Babagana Zulum;Ali Sheriff;Mai Buni;Ibrahim Gaidam;Ahmadu Fintiri;Jibrilla Bindow;Murtala Nyako;Darius Ishaku;Agbu Kefas;Danbaba Suntai;Abubakar Bello;Umaru Bago;
Babangida Aliyu;Nuhu Ribadu;Wale Edun;Zainab Ahmed;Kemi Adeosun;Ngozi Okonjo-Iweala;Lai Mohammed;Festus Keyamo;Hadi Sirika;Abubakar Malami;Lateef Fagbemi;Bosun Tijani;
Hannatu Musawa;Betta Edu;Doris Uzoka-Anite;Mohammed Idris;Yusuf Tuggar;Olubunmi Tunji-Ojo;Adebayo Adelabu;Sunday Dare;Ireti Kingibe;Babagana Kingibe;Natasha Akpoti-Uduaghan;
Ned Nwoko;Ben Bruce;Enyinnaya Abaribe;Ali Ndume;Smart Adeyemi;Babachir Lawal;Boss Mustapha;Ibrahim Gambari;Abba Kyari;Femi Adesina;Garba Shehu;Bayo Onanuga;Ajuri Ngelale;
Osita Chidoka;Tunde Bakare;Kingsley Moghalu;Oby Ezekwesili;Pat Utomi;Jimi Agbaje;Gbadebo Rhodes-Vivour;Abike Dabiri-Erewa;Bisi Akande;Olusegun Osoba;Bode George;
Tony Anenih;Jerry Gana;Iyiola Omisore;Ayo Adebanjo;Mudashiru Obasa;Adebayo Shittu;Niyi Adebayo;Akin Alabi;Robert Boroffice;Ahmed Wase;Idris Wase;Aliyu Gusau;Sadiya Farouq;
Chris Uba;Andy Uba;Ifeanyi Ubah;Ike Nwachukwu;Ken Nnamani;Pius Anyim;Anyim Ude;Chuba Okadigbo;Evan Enwerem;Adolphus Wabara;Joseph Wayas;
Olusola Saraki;Emeka Ojukwu;Nnamdi Kanu;Sam Mbakwe;Jim Nwobodo;Lateef Jakande;Bola Ige;Adekunle Ajasin;Ladoke Akintola;Herbert Macaulay;Funmilayo Ransome-Kuti;
Margaret Ekpo;Aminu Kano;Waziri Ibrahim;Maitama Sule;Umaru Dikko;Shehu Yar'Adua;Abdulkadir Kure;Bisi Fayemi;Funke Akindele;Gbenga Olawepo-Hashim;Yabagi Sani;
Adewole Adebayo;Prince Adebayo;Christopher Imumolen;Hamza Al-Mustapha;Dumebi Kachikwu;Ibe Kachikwu;Emmanuel Kachikwu;Kola Ologbondiyan;Debo Ologunagba;Nentawe Yilwatda;
Abdullahi Adamu;Ali Bukar;Oyo Ige;Ganiyu Adams;Babatunde Ogala;Dele Momodu;Reno Omokri;Bola Bello;Olu Falae;Ebenezer Babatope;Bamanga Tukur;Vincent Ogbulafor;Ahmadu Ali;
Kawu Baraje;Adamu Mu'azu;Ali Modu;Ahmed Lawan;Kabiru Gaya;Danladi Sankara;Danladi Umar;Theophilus Danjuma;Abdulmumin Jibrin;Yusuf Datti;Abba Moro;Usman Bugaje`
  .split(';').map(s=>s.trim()).filter(Boolean);
// Names so common that sharing them alone means nothing: a player called Musa Bello is fine, Yahaya Bello is not.
// Generated characters must avoid even these as surnames (see nameRisk), players only as part of a full name.
const COMMON_LIST=['ahmed','ahmad','mohammed','muhammad','muhammadu','ibrahim','musa','yusuf','idris','ali','sani','aliyu','abubakar','bello','usman','umar','umaru',
  'garba','shehu','sule','abdullahi','bala','isa','adamu','yakubu','danladi','peter','david','james','joseph','samuel','emmanuel','sunday','monday','patrick','francis','charles',
  'victor','philip','christopher','godwin','lucky','alex','george','martin','simon','gabriel','caleb','benjamin','robert','julius','ken','pat','tony','jim','sam','chris','andy',
  'ben','dele','bola','femi','kemi','segun','tunde','gbenga','bayo','kola','seyi','dapo','biodun','wale','bisi','funke','ngozi','zainab','sadiya','doris','margaret','patricia',
  'remi','kayode','emeka','chinwoke','ike','uche','ifeanyi','nnamdi','chuba','obi','eze','lawal','daniel','sheriff','mark','dare','prince','oyo','adebayo','alabi','ade',
  'olu','oba','mai','kalu','orji','ude','uba','gana','mark','kano','ekpo','ige','adams','bruce','duke','dickson','jang','mohammed','tukur','moro','momodu',
  'ayo','tolu','kunle','kelechi','chinedu','obinna','ikenna','amaka','halima','hauwa','aisha','musa','grace','felix','sarah','michael'];
const nkey=s=>String(s||'').normalize('NFD').toLowerCase().replace(/[^a-z]/g,'').replace(/ph/g,'f').replace(/ck/g,'k').replace(/q/g,'k').replace(/(?!^)y/g,'i').replace(/(.)\1+/g,'$1');
function nlev(a,b){const m=a.length,n=b.length;if(Math.abs(m-n)>2)return 9;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
// two names "sound similar": same after spelling clean-up, or one edit apart (two for long names)
function nameSimilar(a,b){a=nkey(a);b=nkey(b);if(!a||!b)return false;if(a===b)return true;const L=Math.max(a.length,b.length);if(L<5)return false;const d=nlev(a,b);return d<=1||(L>=8&&d<=2);}
const POL_PARTS=POLITICIANS.map(n=>{const w=n.split(/\s+/);return {name:n,first:w[0],last:w[w.length-1].replace(/-/g,''),lastParts:w[w.length-1].split('-')};});
// first names that on their own point at one politician
const DISTINCT_FIRST=new Set(['atiku','nyesom','gboyega','godswill','siminalayi','kashim','omoyele','iyorchia','muhammadu','babagana','diepreye','seriake','timipre'].map(nkey));
const COMMON_NAMES=new Set(COMMON_LIST.map(nkey));
const isCommon=w=>COMMON_NAMES.has(nkey(w));
// strict check for the game's own characters: the surname may not echo any politician's surname, common or not, and no
// part of the name may echo the distinctive part of a politician's name (Oyetola, Wike, Tinubu, Nyesom...)
function nameRisk(name){
  const words=String(name).replace(/^(Hon\.|Honourable|Alhaji|Chief|Barr\.|Dr\.|Engr\.|Mrs\.|Mr\.|Mama|Iya|Baba|CSP|Insp\.|Sgt\.?|Sen\.)\s+/g,'').split(/[\s'-]+/).filter(w=>w.length>1);
  const last=words[words.length-1];
  for(const p of POL_PARTS){
    if(words.length>1&&[p.last,...p.lastParts].some(l=>nameSimilar(last,l)))return p.name;
    for(const w of words)for(const part of [p.first,p.last,...p.lastParts])if(!isCommon(part)&&!isCommon(w)&&nameSimilar(w,part))return p.name;
  }
  return null;
}
// player names: a politician's full name (either order, small misspellings), a distinctive politician surname, or one of
// the few first names that point at one person. Common names are fine on their own: Musa Bello can play, Yahaya Bello can't.
function playerNameRisk(first,last){
  const f=nkey(first),l=nkey(last);
  for(const p of POL_PARTS){
    if((nameSimilar(f,p.first)&&nameSimilar(l,p.last))||(nameSimilar(l,p.first)&&nameSimilar(f,p.last)))return p.name;
    for(const w of [f,l]){
      if([p.last,...p.lastParts].some(part=>!isCommon(part)&&!COMMON_NAMES.has(w)&&nameSimilar(w,part)))return p.name;
      if(DISTINCT_FIRST.has(nkey(p.first))&&nameSimilar(w,p.first))return p.name;
    }
  }
  return null;
}
if(typeof module!=='undefined')module.exports={POLITICIANS,nameSimilar,nameRisk,playerNameRisk};
