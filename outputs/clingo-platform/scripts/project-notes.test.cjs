const{test}=require('node:test'),assert=require('node:assert/strict');const sharp=require('sharp');
const{projectNotesInput,prepareProjectPhotos}=require('../apps/api/dist/provider/project-notes.input');
const{legacyProjectNotes,projectNotesSummary}=require('../apps/api/dist/provider/project-notes.types');
const id='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';const note={id,title:'Sprzęt',body:'Drabina\nNarzędzia'};
test('project notes preserve titles, paragraphs and legacy text without introducing sample notes',()=>{assert.deepEqual(projectNotesInput([note],[]).noteItems,[note]);assert.deepEqual(legacyProjectNotes('',id),[]);assert.equal(legacyProjectNotes('Stara notatka',id)[0].body,'Stara notatka');assert.equal(projectNotesSummary([note]),'Sprzęt\nDrabina\nNarzędzia');});
test('project notes reject duplicates, empty text, too many records, forged URLs and unknown fields',()=>{
 const bad=error=>error.getStatus()===400;
 for(const notes of [[note,note],[{...note,title:''}],[{...note,body:''}],[{...note,body:'a'.repeat(2001)}],[{...note,title:'a\nB'}],[{...note,body:'\u0000'}],Array(21).fill(note),[{...note,accountId:second}]])assert.throws(()=>projectNotesInput(notes,[]),bad);
 for(const photos of [[{id,url:'https://foreign.test/photo'}],[{id,dataUrl:'data:image/svg+xml;base64,PHN2Zy8+'}],[{id},{id}],Array(11).fill({id}),[{id:'bad'}],[{id,projectId:second}],[{id,dataUrl:'data:image/jpeg;base64,'+'a'.repeat(220000)}]])assert.throws(()=>projectNotesInput([],photos),bad);
});
test('photo processing decodes real pixels, strips metadata and rejects fake image bytes',async()=>{
 const bytes=await sharp({create:{width:40,height:30,channels:3,background:'#357bbf'}}).jpeg().withMetadata({exif:{IFD0:{Artist:'Private data'}}}).toBuffer();
 const prepared=await prepareProjectPhotos(projectNotesInput([],[{id,dataUrl:'data:image/jpeg;base64,'+bytes.toString('base64')}]).photos);const meta=await sharp(prepared[0].data).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,40);assert.equal(meta.height,30);assert.equal(meta.exif,undefined);
 assert.deepEqual(await prepareProjectPhotos([{id}]),[{id}]);await assert.rejects(prepareProjectPhotos([{id,dataUrl:'data:image/png;base64,'+Buffer.from('not an image').toString('base64')}]),error=>error.getStatus()===400);
});
