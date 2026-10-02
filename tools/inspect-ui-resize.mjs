import {launch,until,sleep} from './cdp.mjs';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const page=await launch({port:9479,width:1280,height:800});
try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/?offline');await until(()=>page.eval('!!window.__buttloads?.ready'),{timeout:90000});await page.eval('__buttloads.setScreen("crew");true');await sleep(500);
 await page.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await sleep(500);
 const report=await page.eval('(()=>{const g=__buttloads;g.view.resize();g.view.gameUI.draw();g.view.render(g,1/60,g.clock);const gl=g.view.renderer.getContext();gl.finish();const gpu=new Uint8Array(4);gl.readPixels(24,innerHeight-301,1,1,gl.RGBA,gl.UNSIGNED_BYTE,gpu);const canvas=g.view.gameUI.ctx.getImageData(24,300,1,1).data;return {screen:g.screen,ui:[g.view.gameUI.w,g.view.gameUI.h],canvas:[g.view.gameUI.canvas.width,g.view.gameUI.canvas.height],image:[g.view.gameUI.texture.image.width,g.view.gameUI.texture.image.height],texture:g.view.gameUI.texture.version,frame:g.audit.frames,hidden:document.hidden,pixels:{gpu:[...gpu],canvas:[...canvas]},logs:[]};})()');
 await page.shot(path.join(root,'tools/out/resize-debug.png'));const canvas=await page.eval('__buttloads.view.gameUI.canvas.toDataURL()');fs.writeFileSync(path.join(root,'tools/out/resize-ui.png'),Buffer.from(canvas.split(',')[1],'base64'));console.log(JSON.stringify({...report,logs:page.logs}));fs.writeFileSync(path.join(root,'tools/out/resize-report.json'),JSON.stringify(report,null,2));if(report.pixels.gpu.some((v,i)=>Math.abs(v-report.pixels.canvas[i])>3))throw Error('Resized WebGL interface differs from its source canvas');
}finally{page.kill();server.close();}
