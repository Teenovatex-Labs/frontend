import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'public/alfred/animations.json'), 'utf8'));
const out = path.join(root, 'public/alfred/previews');
await mkdir(out, {recursive:true});
const states = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(manifest.animations);
const thumbnails = [];
for (const [index, state] of states.entries()) {
  const animation = manifest.animations[state];
  const source = path.join(root, 'public', animation.source);
  const ffmpeg = spawn('ffmpeg', ['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','256x320','-framerate',String(animation.fps),'-i','pipe:0','-filter_complex','[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128','-loop','0',path.join(out,`${state}.gif`)]);
  let errors=''; ffmpeg.stderr.on('data', d => errors += d);
  const completed = new Promise((resolve,reject) => ffmpeg.on('close', code => code === 0 ? resolve() : reject(new Error(errors))));
  for (let frame=0; frame<animation.frames; frame++) {
    const crop={left:frame%4*256,top:Math.floor(frame/4)*320,width:256,height:320};
    const rgba=await sharp(source).extract(crop).ensureAlpha().raw().toBuffer();
    ffmpeg.stdin.write(rgba);
  }
  ffmpeg.stdin.end(); await completed;
  const thumb=await sharp(source).extract({left:0,top:0,width:256,height:320}).flatten({background:'#fff9eb'}).png().toBuffer();
  thumbnails.push({input:thumb,left:index%5*256,top:Math.floor(index/5)*352});
  const label=Buffer.from(`<svg width="256" height="32"><text x="128" y="22" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8d355b">${state}</text></svg>`);
  thumbnails.push({input:label,left:index%5*256,top:Math.floor(index/5)*352+320});
  console.log(`${state}: GIF preview saved`);
}
await sharp({create:{width:1280,height:Math.ceil(states.length/5)*352,channels:4,background:'#fff9eb'}}).composite(thumbnails).png().toFile(path.join(out,'contact-sheet.png'));
