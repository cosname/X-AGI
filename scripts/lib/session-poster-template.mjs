import { readFileSync } from 'node:fs';
import { posterConference } from '../../src/data/session-posters.ts';

export const posterTemplateAssets = [
  'public/2026/brand/xagi-header-wordmark.svg',
  'src/assets/fonts/ibm-plex-sans-condensed-latin.woff2',
];

const escape = (text) => String(text).replace(/[&<>"']/g, (value) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[value]);
const data = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;

export function sessionPosterHtml(poster, backgroundPath) {
  const portrait = (person) => person.portraitSrc
    ? `<img class="portrait" src="${data(`public${person.portraitSrc}`, 'image/webp')}" alt="${escape(person.name)}">`
    : '<div class="portrait portrait--pending" aria-label="头像待补充"><svg viewBox="0 0 80 96" aria-hidden="true"><circle cx="40" cy="31" r="15"/><path d="M12 87v-9c0-17 12-29 28-29s28 12 28 29v9"/></svg></div>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escape(poster.title)}</title><style>
@font-face{font-family:Condensed;src:url('${data(posterTemplateAssets[1], 'font/woff2')}') format('woff2');font-display:block}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1440px}body{color:#27234d;background:#f5efe7;font-family:"PingFang SC","Noto Sans CJK SC",sans-serif;-webkit-font-smoothing:antialiased}
.poster{width:1080px;height:1440px;padding:62px 64px 44px;position:relative;isolation:isolate;display:flex;flex-direction:column}
.background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.poster:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(250,246,239,.42),rgba(250,246,239,.14))}
.brand{display:flex;align-items:center;justify-content:space-between;gap:36px}.brand img{width:236px;height:auto}.brand-copy{text-align:right;font-size:23px;line-height:1.5;font-weight:550;letter-spacing:1px}.brand-copy small{display:block;font-family:Condensed,sans-serif;font-size:18px;letter-spacing:2px;font-weight:400}
.heading{height:277px;padding-top:55px;position:relative}.eyebrow{display:flex;gap:18px;align-items:center;margin:0 0 19px;font-size:23px;font-weight:550}.eyebrow span:first-child{font-family:Condensed,sans-serif;letter-spacing:2px;font-size:22px;color:#655686}.eyebrow i{height:18px;border-left:1px solid #95899f}
h1{margin:0;font-size:68px;line-height:1.14;letter-spacing:-1.5px;font-weight:650;max-width:930px;text-wrap:balance}.title-long{font-size:59px;letter-spacing:-.8px}.title-latin{font-family:Condensed,"PingFang SC",sans-serif;font-size:76px;letter-spacing:-1.5px}
.chairs{border-block:1px solid rgba(60,44,94,.28);padding:22px 0;display:flex;gap:24px;align-items:center;min-height:96px;font-size:25px}.role{font-family:Condensed,sans-serif;letter-spacing:2px;text-transform:uppercase;font-size:20px;color:#695781}.chair-list{display:flex;gap:26px;flex-wrap:wrap}.chair-name{font-weight:650}.chair-affiliation{margin-left:12px;font-size:22px;font-weight:400;color:#5d536d}
.speakers-label{margin:28px 0 19px;display:flex;justify-content:space-between}.speakers-label span:last-child{font-size:18px;color:#756b81;letter-spacing:1px}
.speakers{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(2,minmax(0,1fr));gap:24px;flex:1;min-height:0}.speaker{min-height:0;padding:24px;background:rgba(255,253,248,.77);border:1px solid rgba(91,73,128,.19);display:flex;flex-direction:column;position:relative}.person{display:flex;gap:22px;align-items:center}.portrait{width:104px;height:130px;object-fit:cover;object-position:center 24%;flex:none;border:1px solid rgba(71,51,102,.12);background:#ece5ee}.portrait--pending{display:grid;place-items:center;background:#ece7ef}.portrait--pending svg{width:61px;height:77px;fill:none;stroke:#b1a5c3;stroke-width:1.5}
.person-copy{min-width:0}.person h2{font-size:35px;line-height:1.25;font-weight:650;letter-spacing:1px;margin:0 0 12px}.affiliation{margin:0;font-size:22px;line-height:1.42;color:#645870;overflow-wrap:anywhere}.talk{margin:23px 0 0;font-size:28px;font-weight:550;line-height:1.4;overflow-wrap:anywhere;text-wrap:balance}.talk--pending{font-weight:400;color:#8b8094}.speaker-number{position:absolute;right:17px;top:12px;font-family:Condensed,sans-serif;font-size:16px;color:#a99ab7}
.speaker--three{grid-column:1/-1;flex-direction:row;align-items:center;gap:32px}.speaker--three .person{width:375px;flex-shrink:0}.speaker--three .talk{margin:0;font-size:31px;max-width:440px}
.footer{display:flex;justify-content:space-between;align-items:flex-end;gap:26px;margin-top:32px;padding-top:20px;border-top:1px solid rgba(60,44,94,.28);font-size:20px;color:#625573;line-height:1.5}.footer strong{font-family:Condensed,sans-serif;font-weight:500;font-size:31px;letter-spacing:1px;color:#3b2e59}.footer p{margin:0;text-align:right}.footer small{display:block;font-size:16px}
</style></head><body><main class="poster" data-session="${poster.id}">
<img class="background" alt="" src="${data(backgroundPath, 'image/png')}">
<header class="brand"><img src="${data(posterTemplateAssets[0], 'image/svg+xml')}" alt="X-AGI"><div class="brand-copy">${escape(posterConference.name)}<small>${escape(posterConference.nameEn)}</small></div></header>
<div class="heading"><p class="eyebrow"><span>SESSION ${String(poster.number).padStart(2, '0')}</span><i></i>${escape(poster.dateLabel)}</p><h1 class="${/^[\x00-\x7F]+$/.test(poster.title) ? 'title-latin' : poster.title.length > 16 ? 'title-long' : ''}" data-fit>${escape(poster.title)}</h1></div>
<div class="chairs"><span class="role">Chair</span><div class="chair-list">${poster.chairs.map(person => `<span><span class="chair-name">${escape(person.name)}</span><span class="chair-affiliation">${escape(person.affiliation || '单位待公布')}</span></span>`).join('')}</div></div>
<div class="speakers-label"><span class="role">Speakers & Talks</span><span>${poster.speakers.length} 场报告</span></div>
<section class="speakers">${poster.speakers.map((person, index) => `<article class="speaker ${poster.speakers.length === 3 && index === 2 ? 'speaker--three' : ''}" data-person="${escape(person.name)}"><span class="speaker-number">0${index + 1}</span><div class="person">${portrait(person)}<div class="person-copy"><h2 data-fit>${escape(person.name)}</h2><p class="affiliation" data-fit>${escape(person.affiliation || '单位待公布')}</p></div></div><h3 class="talk ${person.talkTitle ? '' : 'talk--pending'}" data-fit>${escape(person.talkTitle || '题目待公布')}</h3></article>`).join('')}</section>
<footer class="footer"><strong>x-agi.cc</strong><p>${escape(posterConference.date)} · ${escape(posterConference.venue)}<small>报告安排以官网最新议程为准</small></p></footer>
</main></body></html>`;
}
