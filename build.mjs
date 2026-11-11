import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(root, 'content.txt');
const source = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const groups = [];
for (const line of source.split('\n')) {
  if (/^[IVX]+\. /.test(line)) {
    const [, roman, title] = line.match(/^([IVX]+)\. (.+)$/);
    groups.push({ roman, title, questions: [] });
  } else if (/^\d+\. /.test(line)) {
    if (!groups.length) throw new Error('Question before group');
    groups.at(-1).questions.push({ title: line, lines: [] });
  } else if (groups.length && groups.at(-1).questions.length) {
    groups.at(-1).questions.at(-1).lines.push(line);
  } else if (line.trim()) throw new Error('Unparsed content: ' + line);
}
const questionCount = groups.reduce((sum,g)=>sum+g.questions.length,0);
if(groups.length!==6 || questionCount!==30) throw new Error(`Unexpected source count: ${groups.length} / ${questionCount}`);
const descriptions = [
  'Kỹ tính khi làm việc, hài hước khi thân quen và luôn để ý đến cảm xúc của người bên cạnh.',
  'Từ sinh viên Quản trị Marketing đến mục tiêu trở thành một giảng viên có chuyên môn vững và giảng dễ hiểu.',
  'Kết nối với người học, giảng viên và người làm Marketing; cùng biến kiến thức thành điều có thể áp dụng.',
  'Kết hợp khả năng học tập, trải nghiệm truyền thông và năng lực truyền đạt thành một hướng đi rõ ràng.',
  'Chỉn chu, đáng tin và tự nhiên - một hình ảnh nhất quán với cách em học, làm việc và trò chuyện.',
  'Bồi đắp chuyên môn, rèn giảng dạy, tích lũy trải nghiệm và học cách đi xa mà vẫn giữ được sự cân bằng.'
];
const sourceHtml = groups.map((group,i) => `<article class="source-group chapter-card${i===0?' is-active':''}" id="original-section-${i+1}" aria-labelledby="chapter-title-${i+1}"${i===0?' aria-current="step"':''}>
  <div class="chapter-card-intro"><p class="chapter-eyebrow">Chương ${String(i+1).padStart(2,'0')} / 06</p><span class="chapter-big-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3 id="chapter-title-${i+1}">${escape(group.title)}</h3><p class="chapter-description">${escape(descriptions[i])}</p><span class="question-count">${group.questions.length} câu hỏi</span></div>
  <div class="chapter-body"><div class="chapter-body-label"><span>Nội dung chi tiết</span><span>Cuộn trong khung để đọc ↓</span></div><div class="source-questions" tabindex="0" role="region" aria-label="Các câu trả lời: ${escape(group.title)}">${group.questions.map((question,j) => `<details class="source-question" id="question-${i+1}-${j+1}"${j===0?' open':''}><summary>${escape(question.title)}</summary><div class="source-answer">${question.lines.join('\n').trim().split(/\n\s*\n/).map(p=>`<p>${escape(p.replace(/\n/g,' '))}</p>`).join('')}</div></details>`).join('')}</div></div>
</article>`).join('\n');
const chapterNav=groups.map((group,i)=>`<button type="button" class="chapter-pill${i===0?' is-active':''}" data-chapter="${i}" aria-controls="original-section-${i+1}"${i===0?' aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${escape(group.title)}</button>`).join('');
const image = 'data:image/png;base64,' + fs.readFileSync(path.join(root,'portrait.png')).toString('base64');
const template = fs.readFileSync(path.join(root,'template.html'),'utf8');
const fonts = fs.readFileSync(path.join(root,'fonts.css'),'utf8');
const theme = fs.readFileSync(path.join(root,'theme.css'),'utf8');
const chapterCss=fs.readFileSync(path.join(root,'chapters.css'),'utf8');
const appScript=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html = template.replace('__PORTRAIT_IMAGE__',image).replace('__SOURCE_HTML__',sourceHtml).replace('__CHAPTER_NAV__',chapterNav).replace('__FONT_FACES__',fonts).replace('__THEME_CSS__',theme+'\n'+chapterCss).replace('__APP_SCRIPT__',appScript);
if(/__[A-Z_]+__/.test(html)) throw new Error('Unresolved placeholder');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length) throw new Error('Duplicate IDs');
for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) if(!ids.includes(id)) throw new Error('Missing anchor: '+id);
for(const [,idsValue] of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) for(const id of idsValue.split(' ')) if(!ids.includes(id)) throw new Error('Missing ARIA target: '+id);
const reconstructed = groups.flatMap(group=>[`${group.roman}. ${group.title}`,...group.questions.flatMap(q=>[q.title,...q.lines])]).join('\n').replace(/\s+/g,' ').trim();
if(reconstructed!==source.replace(/\s+/g,' ').trim()) throw new Error('Source text did not round-trip');
fs.writeFileSync(path.join(root,'index.html'),html,'utf8');
console.log(JSON.stringify({file:path.join(root,'index.html'),groups:groups.length,questions:questionCount,sourcePreserved:true,scriptSyntax:'valid',anchors:'valid',ariaReferences:'valid',fontFamilies:['Be Vietnam Pro'],embeddedFontSubsets:15,theme:'bright pastel pink',bytes:Buffer.byteLength(html)},null,2));
