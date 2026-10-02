/* Instant public co-op. One authority simulates the mine; guests predict movement.
   Personal claims use their original save slot. Crew claims use a separate slot. */
'use strict';
(function(B){
 // This generation covers simulation/contact compatibility as well as the wire.
 // Bump it when prediction or static collision becomes incompatible, not for art.
 const PROTOCOL=3,APP='xyz.tront.buttloads2.crew',ROOM='ridge-common-v'+PROTOCOL,SAVE_KEY='crew-global-v'+PROTOCOL,LIMIT=64;
 const COLORS=['#efb64c','#69b8b1','#c98973','#93a873','#a099cb','#d9bfa0','#d07eaa','#89acd0'];
 const KEYS=['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight'];
 const TRANSIENT=['tether','snagged','obstruction','obstructionTime','charge','cooldown','toward'];
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
 const uid=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);
 const name=s=>String(s||'Miner').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,18)||'Miner';
 const copy=(target,source)=>{
  if(Array.isArray(source)){if(!Array.isArray(target))target=[];source.forEach((v,i)=>target[i]=v&&typeof v==='object'?copy(target[i],v):v);target.length=source.length;return target;}
  if(!source||typeof source!=='object')return source;
  if(!target||typeof target!=='object'||Array.isArray(target))target={};
  for(const key of Object.keys(source)){if(['__proto__','prototype','constructor'].includes(key))continue;const v=source[key];target[key]=v&&typeof v==='object'?copy(target[key],v):v;}return target;
 };
 const body=n=>{const result={};for(const k of ['id','x','y','z','vx','vy','vz','grounded','motion','collected','hp','shell','phase','timer','yaw','pitch','known','reward','fuse','type','mode','triggered','direction','anchor','lastSeen','alert','charge','held','charges','cargo','size','kind','radius'])if(n[k]!==undefined)result[k]=structuredClone(n[k]);return result;};
 class TerrainChanges{
  constructor(world){this.world=world;this.samples=new Map();this.seq=0;this.previous=Object.hasOwn(world,'_crewSampleOriginal')?world._crewSampleOriginal:world.onSample;world._crewSampleOriginal=this.previous||null;world.onSample=(id,value,parcel)=>{this.previous?.(id,value,parcel);this.samples.set((parcel?0x80000000:0)+id,value);};}
  drain(){if(!this.samples.size)return null;const bytes=new Uint8Array(this.samples.size*8),v=new DataView(bytes.buffer);let at=0;for(const [id,value]of this.samples){v.setUint32(at,id,true);v.setFloat32(at+4,value,true);at+=8;}this.samples.clear();return{seq:++this.seq,bytes};}
  static apply(world,bytes){
   if(!(bytes instanceof Uint8Array)||bytes.byteLength%8||bytes.byteLength>4*1024*1024)throw Error('Invalid terrain packet');
   const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),entries=[],chunks=new Set();
   for(let at=0;at<bytes.byteLength;at+=8){const key=v.getUint32(at,true),parcel=key>=0x80000000,id=key&0x7fffffff,field=parcel?world.parcelField:world.field,value=v.getFloat32(at+4,true);
    if(!field||id>=field.length||!Number.isFinite(value)||value<-64||value>64)throw Error('Invalid terrain sample');
    entries.push([field,id,value]);
    const x=parcel?id%64+65:id%65,y=parcel?Math.floor(id/64)%165-(world.bottom+80)*2:Math.floor(id/65)%world.ny,z=parcel?Math.floor(id/(64*165)):Math.floor(id/(65*world.ny));
    for(let cz=Math.floor((z-33)/16);cz<=Math.floor((z-31)/16);cz++)for(let cy=Math.floor((y+world.bottom*2-1)/16);cy<=Math.floor((y+world.bottom*2+1)/16);cy++)for(let cx=Math.floor((x-33)/16);cx<=Math.floor((x-31)/16);cx++)if(cx>=-2&&cx<=world.maxChunkX&&cy>=world.minChunkY&&cy<=-1&&cz>=-2&&cz<=1)chunks.add(`${cx},${cy},${cz}`);
   }
   for(const [field,id,value]of entries)field[id]=value;
   for(const key of chunks){const [cx,cy,cz]=key.split(',').map(Number),old=world.chunks.get(key);if(old)world.onRemove?.(old);world.adopt(cx,cy,cz,world.kernel.build([cx*8,cy*8,cz*8],world.samplesFor(cx,cy,cz)));}
   if(entries.length)world.revision++;return entries.length;
  }
 }
 async function compress(value){const bytes=new TextEncoder().encode(JSON.stringify(value));if(typeof CompressionStream==='undefined')return{bytes,gzip:false};return{bytes:new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()),gzip:true};}
 async function decompress(bytes,gzip){
  if(bytes.byteLength>16*1024*1024)throw Error('Crew save too large');
  const stream=gzip?new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')):new Blob([bytes]).stream();
  const reader=stream.getReader(),chunks=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>32*1024*1024){await reader.cancel();throw Error('Crew save too large');}chunks.push(value);}
  const all=new Uint8Array(length);let at=0;for(const chunk of chunks){all.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));
 }
 function iceConfig(options={}){
  const stun=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
  return{iceServers:stun.concat(Array.isArray(options.iceServers)?options.iceServers:[]),...(options.relayOnly?{iceTransportPolicy:'relay'}:{})};
 }
 class Crew{
  static enabled(){return typeof location!=='undefined'&&!new URLSearchParams(location.search).has('offline');}
  constructor(game,options={}){
   this.game=game;this.options=options;this.id=uid();this.born=Date.now();this.epoch=uid();this.hostId=this.id;this.peers=new Map();this.role='offline';this.status='Your local claim';this.ready=true;this.syncing=false;this.generation=0;this.time=0;this.inputSeq=0;this.commandSeq=0;this.frameSeq=0;this.lastFrame=0;this.patchSeq=0;this.pendingPatches=[];this.tails=new Map();this.snapshots=new Set();this.pendingCommands=[];
   this.profile={name:name(read('b2-miner-name','Miner '+this.id.slice(0,4).toUpperCase())),color:B.clamp(read('b2-miner-color',0),0,7)};this.errors=[];this.stats={inputs:0,commands:0,patches:0,snapshots:0,migrations:0};
   this.predictionInputs=new Map();this.predictionSamples=[];
  }
  get guest(){return this.role==='guest';}get host(){return this.role==='host';}get count(){return 1+[...this.peers.values()].filter(p=>p.hello).length;}
  get active(){return [...this.peers.values()].some(p=>p.synced&&p.input?.playing);}
  get blockingBodies(){return this.host?[...this.peers.values()].filter(p=>p.synced&&p.player&&p.input?.playing).map(p=>({x:p.player.x,y:p.player.y+p.player.height/2,z:p.player.z,size:[p.player.radius*2,p.player.height,p.player.radius*2],crew:true})):[];}
  get members(){const g=this.game;return[{id:this.id,...this.profile,player:body(g.player),health:g.combat?.state.health||100,local:true,playing:g.running,tool:g.expedition.state.tool,fire:g.running&&g.input.fire&&!g.input.aim,contact:g.cutter.contact,transient:Object.fromEntries(TRANSIENT.map(k=>[k,g.expedition[k]])),sling:{held:g.kinetics.state.held,charge:g.kinetics.state.charge}},...[...this.peers.values()].filter(p=>p.hello).map(p=>({id:p.id,...p.profile,player:p.player?{...body(p.player),pitch:p.player.pitch}:p.pose,health:p.health,playing:p.input?.playing,tool:p.tool,fire:p.input?.playing&&p.input?.fire&&!p.input?.aim,contact:p.cutter?.contact,transient:p.transient,sling:p.sling,pickup:p.pickup,ack:{seq:p.input?.seq||0,age:B.clamp(p.input?.simulated||0,0,2)}}))];}
  async start(){
   const token=++this.generation;this.role='connecting';this.status='Finding the global crew';this.personal=B.Saves.snapshot(this.game);this.game.store.key=SAVE_KEY;
   try{
    const personal=await this.game.store.read('current');if(personal){try{B.Saves.validate(personal);this.personal=personal;}catch(error){this.error(error);}}if(token!==this.generation)return;
    const library=this.options.library||globalThis.ButtloadsTrystero;if(!library||typeof RTCPeerConnection==='undefined'&&!this.options.library)throw Error('WebRTC unavailable');
    const rtcConfig=iceConfig(this.options);
    if(token!==this.generation)return;const room=library.joinRoom({appId:APP,rtcConfig,relayConfig:{redundancy:2,urls:this.options.relays||['wss://tracker.webtorrent.dev','wss://tracker.openwebtorrent.com']}},this.options.room||ROOM,{onJoinError:e=>this.error(e?.error||e)});
    this.room=room;this.id=library.selfId;this.hostId=this.id;
    [this.sendControl,this.onControl]=room.makeAction('crew_ctl');[this.sendPatch,this.onPatch]=room.makeAction('crew_cut');[this.sendSave,this.onSave,this.onSaveProgress]=room.makeAction('crew_save');
    this.onControl((m,id)=>{if(token===this.generation)this.receive(m,id);});
    this.onPatch((bytes,id,meta)=>{if(token===this.generation)this.receivePatch(bytes,id,meta);});
    this.onSave((bytes,id,meta)=>{if(token===this.generation)this.receiveSnapshot(bytes,id,meta);});
    this.onSaveProgress((fraction,id)=>{if(id===this.hostId&&this.syncing){this.progress=fraction;this.status='Joining the mine '+Math.round(fraction*100)+'%';}});
    room.onPeerJoin(id=>{if(token!==this.generation||this.peers.has(id))return;this.peers.set(id,{id,hello:false,synced:false,joined:this.time,last:this.time,profile:{name:'Miner',color:1},health:100});this.hello(id);});
    room.onPeerLeave(id=>{if(token!==this.generation)return;const p=this.peers.get(id);if(this.host&&p?.sling)this.slingContext(p,()=>this.game.kinetics.cancel());this.peers.delete(id);this.tails.delete(id);this.game.view.removeMiner?.(id);if(p?.hello)this.game.toast(p.profile.name+' left the mine.');this.elect();});
    this.becomeHost(false);this.hello();this.timer=setInterval(()=>this.heartbeat(),1000);this.timer.unref?.();
   }catch(error){this.role='offline';this.game.store.key='current';this.status='Connection unavailable';this.error(error);}
  }
  error(error){this.errors.push(String(error?.message||error));if(this.errors.length>12)this.errors.shift();}
  hello(target){return this.send({type:'hello',born:this.born,profile:this.profile,ready:this.ready},target);}
  send(message,target){
   if(!this.room||!this.sendControl)return Promise.resolve(false);const payload={v:PROTOCOL,...message};
   try{return this.sendControl(payload,target).then(()=>true).catch(e=>{this.error(e);return false;});}catch(e){this.error(e);return Promise.resolve(false);}
  }
  elect(){
   if(!this.room)return;const candidates=[{id:this.id,born:this.born},...[...this.peers.values()].filter(p=>p.hello&&p.ready).map(p=>({id:p.id,born:p.born}))];
   candidates.sort((a,b)=>a.born-b.born||a.id.localeCompare(b.id));const winner=candidates[0].id;if(winner===this.hostId&&this.role!=='connecting')return;
   this.hostId=winner;this.lastHost=this.time;
   if(winner===this.id)this.becomeHost(true);else{this.clearPrediction();this.role='guest';this.ready=false;this.syncing=true;this.progress=0;this.status='Joining the shared mine';this.pendingPatches=[];this.send({type:'need'},winner);}
  }
  becomeHost(migration){
   this.clearPrediction();
   this.role='host';this.ready=true;this.syncing=false;this.hostId=this.id;this.epoch=uid();this.frameSeq=this.lastFrame=this.patchSeq=0;this.changes=new TerrainChanges(this.game.world);this.world=this.game.world;this.game.store.key=SAVE_KEY;this.status=this.count>1?'Crew connected':'Global crew open';
   this.game.expedition.tetherOwner=n=>{for(const p of this.peers.values())if(p.transient?.tether===n.id&&p.synced)return p.player.head;return null;};
   const combat=this.game.combat;
   const kinetics=this.game.kinetics;
   this.game.orePhysics.motionOverride=(n,dt)=>{const peer=[...this.peers.values()].find(p=>p.sling?.held===n.id);return peer?this.slingContext(peer,()=>kinetics.holdStep(n,dt)):kinetics.holdStep(n,dt);};
   this.game.orePhysics.onImpulse=n=>{const peer=[...this.peers.values()].find(p=>p.sling?.held===n.id);if(peer)this.slingContext(peer,()=>kinetics.cancel());else if(kinetics.state.held===n.id)kinetics.cancel();};
   combat.crewPlayers=()=>[...(this.game.running?[this.game.player]:[]),...[...this.peers.values()].filter(p=>p.synced&&p.input?.playing&&p.player).map(p=>p.player)];
   combat.pickPlayer=(enemy,fallback)=>combat.crewPlayers().sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y,a.z-enemy.z)-Math.hypot(b.x-enemy.x,b.y-enemy.y,b.z-enemy.z))[0]||fallback;
   combat.remoteDamage=(amount,player)=>{
    const peer=[...this.peers.values()].find(p=>p.player===player);if(!peer)return null;if(peer.grace>0)return false;
    peer.health=Math.max(0,peer.health-amount);peer.grace=.65;this.game.changed();
    if(peer.health<=0){peer.health=100;peer.grace=3;peer.player.teleport(0,.1,12);peer.keys.clear();peer.transient.tether=null;this.send({type:'result',text:'The yard crew pulled you out. The crew haul is safe.',position:body(peer.player)},peer.id);}return true;
   };
   if(migration){
    this.stats.migrations++;this.rebuildPhysics();this.game.toast('Crew lead transferred. The mine stays open.');for(const p of this.peers.values())if(p.hello)this.snapshot(p.id);
   }
  }
  rebuildPhysics(){
   const g=this.game;
   for(const system of [g.orePhysics,...['expedition','gadgets','thunder','refuges','combat','deep','foreman','kinetics','fossil'].map(k=>g[k]?.physics)].filter(Boolean)){
    const nodes=system.nodes.filter(n=>!n.collected);system.index=new B.SpatialIndex(nodes);system.loose=new Set(nodes.filter(n=>n.motion!=='embedded'));system.awake=new Set([...system.loose].filter(n=>n.motion==='falling'));system.accumulator=0;
   }
   g.index=g.orePhysics.index;g.survey.cells=new Set(g.survey.data.cells);g.survey.ore=new Set(g.survey.data.ore);g.survey.knownSites=new Set(g.survey.data.sites);
  }
  remoteSpawn(peer){
   const g=this.game,player=peer.player,others=[g.player,...[...this.peers.values()].filter(p=>p!==peer).map(p=>p.player).filter(Boolean)];
   const clear=p=>!player.blocked(p.x,p.y,p.z)&&others.every(other=>p.y+player.height<=other.y||p.y>=other.y+other.height||Math.hypot(p.x-other.x,p.z-other.z)>=player.radius+other.radius+.1);
   const pose=peer.pose;if(pose&&['x','y','z'].every(k=>Number.isFinite(pose[k]))&&clear(pose))return pose;
   // Allocate from current occupied positions, including miners who are in menus.
   // A peer-count slot is reused after departures and can put the camera in a head.
   for(let ring=0;ring<=16;ring++)for(let iz=-ring;iz<=ring;iz++)for(let ix=-ring;ix<=ring;ix++){
    if(Math.max(Math.abs(ix),Math.abs(iz))!==ring)continue;
    const x=ix*.9,z=12+iz*.9,y=B.COMMON.outside(x,z)?B.COMMON.height(x,z)+.1:.1,p={x,y,z};
    if(clear(p)&&g.world.density(x,y-.2,z)<-.005)return{...p,yaw:player.yaw,pitch:player.pitch};
   }
   throw Error('No clear supported crew arrival position');
  }
  makeRemote(peer){
   if(peer.player?.world===this.game.world)return;const g=this.game;peer.player=new B.Player(g.world);peer.player.obstacles=g.player.obstacles;const pose=this.remoteSpawn(peer);
   peer.player.teleport(pose.x,pose.y,pose.z);peer.player.yaw=pose.yaw||0;peer.player.pitch=pose.pitch||0;
   peer.cutter=new B.Cutter(g.world);peer.actions=new B.ToolActions(g.world,peer.cutter,g.combat);peer.health ||= 100;peer.grace ||= 0;peer.tool ||= 'cutter';peer.chargeMode ||= 'blast';peer.transient={tether:null,snagged:false,obstruction:null,obstructionTime:0,charge:0,cooldown:0,toward:peer.player.head};peer.weapon={swing:0,weaponCooldown:0};peer.sling={held:null,charge:0,wasHeld:false,obstruction:null};peer.keys=new Set();peer.commandSeq ||= 0;
  }
  receive(m,id){
   const p=this.peers.get(id);if(!p||!m||m.v!==PROTOCOL||typeof m.type!=='string')return;p.last=this.time;
   if(m.type==='hello'){
    if(!Number.isFinite(m.born)||m.born<0||!m.profile)return;const fresh=!p.hello;p.hello=true;p.born=m.born;p.ready=!!m.ready;p.profile={name:name(m.profile.name),color:Number.isInteger(m.profile.color)?B.clamp(m.profile.color,0,7):1};
    if(fresh){this.hello(id);this.game.toast(p.profile.name+' joined the crew.');}this.elect();if(this.host&&fresh)this.snapshot(id);return;
   }
   if(!p.hello)return;
   if(['poses','frame'].includes(m.type)&&(!Number.isFinite(m.at)||m.at<0))return;
   if(m.type==='need'&&this.host){this.snapshot(id);return;}
   if(m.type==='ack'&&this.host&&m.epoch===this.epoch){p.synced=true;return;}
   if(m.type==='ping'){this.send({type:'pong',at:m.at},id);return;}
   if(m.type==='pong'&&Number.isFinite(m.at)){p.ping=Math.round((this.time-m.at)*1000);return;}
   if(m.type==='poses'&&this.guest&&id===this.hostId&&this.ready&&m.epoch===this.epoch&&Number.isSafeInteger(m.seq)&&m.seq>(this.poseSeq||0)){this.applyPoses(m.members,m.at);this.poseSeq=m.seq;this.lastHost=this.time;return;}
   if(m.type==='frame'&&this.guest&&id===this.hostId){this.lastHost=this.time;if(this.syncing||!this.ready){this.pendingFrame=m;return;}if(m.epoch!==this.epoch||!Number.isInteger(m.seq)||m.seq<=this.lastFrame)return;if(m.fieldSeq>this.patchSeq){this.pendingFrame=m;return;}this.applyFrame(m);return;}
   if(m.type==='input'&&this.host&&p.synced){
    if(!Number.isInteger(m.seq)||m.seq<=(p.input?.seq||0)||!Number.isFinite(m.yaw)||!Number.isFinite(m.pitch)||Math.abs(m.pitch)>1.55||!Array.isArray(m.keys)||m.keys.length>7||m.keys.some(k=>!KEYS.includes(k))||!B.TOOLS[m.tool])return;
    this.game.advanceSimulation?.(undefined,true);p.last=this.time;
    p.input={...m,received:this.time,simulated:0};p.player.yaw=m.yaw%(Math.PI*2);p.player.pitch=m.pitch;p.keys=new Set(m.playing?m.keys:[]);p.tool=B.availableTools(this.game.economy.state).includes(m.tool)?m.tool:'cutter';p.chargeMode=this.game.gadgets.modes().includes(m.chargeMode)?m.chargeMode:'blast';this.stats.inputs++;return;
   }
   if(m.type==='command'&&this.host&&p.synced){if(!Number.isSafeInteger(m.seq)||m.seq<=p.commandSeq||typeof m.action!=='string'||!Array.isArray(m.args)||m.args.length>2)return;this.game.advanceSimulation?.(undefined,true);p.last=this.time;p.commandSeq=m.seq;if(this.pendingCommands.length<64)this.pendingCommands.push({p,action:m.action,args:m.args});return;}
   if(m.type==='result'&&this.guest&&id===this.hostId){if(typeof m.text==='string')this.game.toast(m.text.slice(0,240));if(m.position&&['x','y','z'].every(k=>Number.isFinite(m.position[k]))){this.game.player.teleport(m.position.x,m.position.y,m.position.z);this.clearPrediction();}}
  }
  async snapshot(id){
   if(!this.host||this.snapshots.has(id)||!this.peers.has(id))return;const p=this.peers.get(id);this.makeRemote(p);p.synced=false;this.snapshots.add(id);
   const epoch=this.epoch,generation=this.generation;
   try{this.flushTerrain();const data=B.Saves.snapshot(this.game,true);data.player={...body(p.player),yaw:p.player.yaw,pitch:p.player.pitch};data.state.expedition.kinetics.held=null;data.state.expedition.kinetics.charge=0;const seq=this.changes.seq,encoded=await compress(data);if(this.host&&this.epoch===epoch&&this.generation===generation)await this.sendSave(encoded.bytes,id,{epoch,seq,gzip:encoded.gzip});this.stats.snapshots++;}catch(error){this.error(error);}finally{this.snapshots.delete(id);}
  }
  async receiveSnapshot(bytes,id,meta){
   if(!this.guest||id!==this.hostId||!meta||typeof meta.epoch!=='string'||!Number.isInteger(meta.seq)||this.installing)return;
   this.installing=true;this.syncing=true;this.ready=false;const generation=this.generation,host=id;
   try{
    const data=B.Saves.validate(await decompress(bytes,meta.gzip));if(generation!==this.generation||host!==this.hostId)return;
    data.settings={...this.game.settings};this.game.setScreen('crew');await this.game.install(data);if(generation!==this.generation||host!==this.hostId)return;
    this.epoch=meta.epoch;this.patchSeq=meta.seq;this.lastFrame=this.poseSeq=0;this.lastPoseAt=undefined;this.clearPrediction();this.world=this.game.world;this.ready=true;this.syncing=false;
    const patches=this.pendingPatches.splice(0);for(const patch of patches)this.receivePatch(...patch);
    this.send({type:'ack',epoch:this.epoch},id);this.hello();this.game.setScreen(null);this.status='Crew connected';this.lastHost=this.time;this.stats.snapshots++;if(this.pendingFrame){const frame=this.pendingFrame;this.pendingFrame=null;this.receive(frame,id);}
   }catch(error){this.error(error);this.ready=false;this.status='Could not join. Retrying';this.lastNeed=this.time;}finally{this.installing=false;}
  }
  flushTerrain(){if(!this.host||!this.changes)return;const patch=this.changes.drain();if(patch){this.sendPatch(patch.bytes,null,{epoch:this.epoch,seq:patch.seq}).catch(e=>this.error(e));this.stats.patches++;}}
  receivePatch(bytes,id,meta){
   if(!this.guest||id!==this.hostId||!meta)return;
   if(this.syncing){if(this.pendingPatches.length<128)this.pendingPatches.push([bytes,id,meta]);return;}
   if(meta.epoch!==this.epoch||!Number.isInteger(meta.seq)||meta.seq<=this.patchSeq)return;
   if(meta.seq!==this.patchSeq+1){this.ready=false;this.syncing=true;this.pendingPatches=[];this.send({type:'need'},id);return;}
   try{TerrainChanges.apply(this.game.world,bytes);this.patchSeq=meta.seq;this.stats.patches++;if(this.pendingFrame?.fieldSeq<=this.patchSeq){const frame=this.pendingFrame;this.pendingFrame=null;this.receive(frame,id);}}catch(error){this.error(error);this.ready=false;this.syncing=true;this.send({type:'need'},id);}
  }
  captureFrame(){
   const g=this.game;for(const key of ['gadgets','thunder','refuges','combat','deep','foreman','crawlers','kinetics','fossil'])g[key]?.save();g.economy.state.expedition.bodies=g.expedition.physics.snapshot();
   return{type:'frame',epoch:this.epoch,seq:++this.frameSeq,fieldSeq:this.changes.seq,at:this.time,state:structuredClone(g.economy.state),collected:g.deposits.nodes.filter(n=>n.collected).map(n=>n.id),loose:g.orePhysics.snapshot(),bodies:Object.fromEntries(['expedition','gadgets','thunder','refuges','combat','deep','foreman','crawlers','kinetics','fossil'].map(key=>[key,(g[key]?.nodes||g[key]?.bodies||g[key]?.drops||[]).map(body)])),members:this.members,pulse:g.expedition.lastPulse,pulseSerial:g.expedition.pulseSerial,blastRecords:structuredClone(g.gadgets.blasts)};
  }
  applyFrame(m){
   const g=this.game;if(!m.state||m.state.seed!==g.world.seed||!Array.isArray(m.collected)||m.collected.length>g.deposits.nodes.length||!Array.isArray(m.loose)||!Array.isArray(m.members)||m.members.length>LIMIT)return;
   this.lastFrame=m.seq;const selected=g.expedition.state.tool,chargeMode=g.gadgets.state.chargeMode;
   const health=g.combat.state.health,sling={held:g.kinetics.state.held,charge:g.kinetics.state.charge};copy(g.economy.state,m.state);g.combat.state.health=health;Object.assign(g.kinetics.state,sling);g.expedition.state.tool=selected;g.gadgets.state.chargeMode=chargeMode;g.world.deepOpen=!!g.deep.state.open;g.world.deepUpgrades=g.deep.state.repaired;g.world.impactHead=g.crawlers.state.impactHead;
   g.survey.cells=new Set(g.survey.data.cells);g.survey.ore=new Set(g.survey.data.ore);g.survey.knownSites=new Set(g.survey.data.sites);g.survey.revision++;
   const collected=new Set(m.collected),loose=new Map(m.loose.map(n=>[n.id,n]));
   for(const n of g.deposits.nodes){const was=n.collected;n.collected=collected.has(n.id);const moving=loose.get(n.id);if(moving)Object.assign(n,moving,{motion:Math.hypot(moving.vx,moving.vy,moving.vz)>.01?'falling':'resting'});if(n.collected)g.index.remove(n);else if(moving)g.index.move(n);if(was!==n.collected||moving)g.view.updateOre(n);}
   g.orePhysics.loose=new Set([...loose.keys()].map(id=>g.deposits.nodes[id]).filter(n=>n&&!n.collected));g.orePhysics.awake=new Set([...g.orePhysics.loose].filter(n=>n.motion==='falling'));
   for(const [key,nodes]of Object.entries(m.bodies||{})){
    if(!['expedition','gadgets','thunder','refuges','combat','deep','foreman','crawlers','kinetics','fossil'].includes(key)||!Array.isArray(nodes)||nodes.length>128)continue;
    const system=g[key],target=system?.nodes||system?.bodies||system?.drops;if(!target)continue;
    const ids=new Set(nodes.map(n=>n.id));for(let i=target.length-1;i>=0;i--)if(!ids.has(target[i].id))target.splice(i,1);
    for(const n of nodes){let current=target.find(b=>b.id===n.id);if(!current){current={...n,radius:n.radius??.16,kind:n.kind??0,collected:false,offsets:key==='combat'?B.boxOffsets([.3,.3,.3]):n.size?B.boxOffsets(n.size):B.Gadgets.offsets()};target.push(current);}copy(current,n);}
   }
   this.applyPoses(m.members,m.at);
   if(m.pulseSerial!==g.expedition.pulseSerial){g.expedition.pulseSerial=m.pulseSerial;g.expedition.lastPulse=m.pulse;}
   if(Array.isArray(m.blastRecords))copy(g.gadgets.blasts,m.blastRecords);g.view.updateAnchor(g.expedition.state.anchor);g.fieldKit.sync();if(g.screen==='town')g.townUI.refresh();g.updateHUD();this.ready=true;
  }
  applyPoses(members,at){
   if(!Array.isArray(members)||members.length>LIMIT)return;
   // Poses and larger world frames travel through different action messages.
   // A delayed frame may update the world without rewinding newer miner poses.
   if(at!==undefined){if(!Number.isFinite(at)||at<0||at<(this.lastPoseAt??-Infinity))return;this.lastPoseAt=at;}
   const g=this.game;
   for(const member of members){if(!member?.player||!['x','y','z','yaw','pitch'].every(k=>Number.isFinite(member.player[k])))continue;
    if(member.id===this.id){this.serverPose={...member.player,received:this.time,error:this.predictionError(member.player,member.ack),waiting:this.awaitingPrediction(member.ack)};const health=B.clamp(member.health??100,.001,100);if(this.localHealth!==undefined&&health<this.localHealth){g.combat.hurtFlash=.4;g.audio.note(85,.2,.04);}this.localHealth=health;g.combat.state.health=health;if(member.transient)for(const k of TRANSIENT)if(Object.hasOwn(member.transient,k))g.expedition[k]=structuredClone(member.transient[k]);if(member.sling){g.kinetics.state.held=member.sling.held;g.kinetics.state.charge=member.sling.charge;g.kinetics.obstruction=member.sling.obstruction;}if(member.pickup&&member.pickup.seq>(this.pickupSeq||0)&&B.ORES[member.pickup.kind]){this.pickupSeq=member.pickup.seq;g.pickupUntil=g.clock+1.6;const ore=B.ORES[member.pickup.kind];document.getElementById('pickup').textContent='+ '+ore.name+'  $'+ore.value;g.audio.pickup?.(member.pickup.kind);g.feedback.collect(member.pickup);}}
    else{const p=this.peers.get(member.id);if(p){p.pose=member.player;p.profile={name:name(member.name),color:B.clamp(member.color||0,0,7)};p.health=member.health;p.tool=member.tool;p.contact=member.contact;p.transient=member.transient;p.sling=member.sling;p.input={...p.input,playing:member.playing,fire:member.fire};}}
   }
  }
  slingContext(peer,fn){
   const k=this.game.kinetics,s=k.state,saved={player:k.player,held:s.held,charge:s.charge,wasHeld:k.wasHeld,obstruction:k.obstruction};peer.sling ||= {held:null,charge:0,wasHeld:false,obstruction:null};Object.assign(s,{held:peer.sling.held,charge:peer.sling.charge});k.player=peer.player;k.wasHeld=peer.sling.wasHeld;k.obstruction=peer.sling.obstruction;
   try{return fn();}finally{peer.sling={held:s.held,charge:s.charge,wasHeld:k.wasHeld,obstruction:k.obstruction};Object.assign(s,{held:saved.held,charge:saved.charge});k.player=saved.player;k.wasHeld=saved.wasHeld;k.obstruction=saved.obstruction;}
  }
  context(peer,fn){
   const g=this.game,s=g.economy.state,e=g.expedition,saved={player:g.player,cutter:g.cutter,actions:g.actions,input:g.input,tool:e.state.tool,chargeMode:g.gadgets.state.chargeMode,screen:g.screen,running:g.running,weapon:{swing:g.combat.state.swing,weaponCooldown:g.combat.state.weaponCooldown},transient:Object.fromEntries(TRANSIENT.map(k=>[k,e[k]]))};
   g.player=peer.player;g.cutter=peer.cutter;g.actions=peer.actions;g.input={keys:peer.keys,fire:!!peer.input?.fire,aim:peer.input?.aim||null};e.state.tool=peer.tool;g.gadgets.state.chargeMode=peer.chargeMode;g.screen=null;g.running=true;Object.assign(e,peer.transient);Object.assign(g.combat.state,peer.weapon);this.remoteContext=peer;
   try{return fn();}finally{g.kinetics.consumePulse(e);g.thunder.consumePulse(e);peer.transient=Object.fromEntries(TRANSIENT.map(k=>[k,e[k]]));peer.weapon={swing:g.combat.state.swing,weaponCooldown:g.combat.state.weaponCooldown};peer.tool=e.state.tool;g.player=saved.player;g.cutter=saved.cutter;g.actions=saved.actions;g.input=saved.input;e.state.tool=saved.tool;g.gadgets.state.chargeMode=saved.chargeMode;g.screen=saved.screen;g.running=saved.running;Object.assign(e,saved.transient);Object.assign(g.combat.state,saved.weapon);this.remoteContext=null;}
  }
  stepRemotes(dt){
   if(!this.host)return;const g=this.game;
   for(const p of this.peers.values()){
    if(!p.synced||!p.player)continue;p.player.obstacles=g.player.obstacles;p.grace=Math.max(0,(p.grace||0)-dt);if(p.player.y>-.5)p.health=Math.min(100,p.health+dt*12);const alive=p.input?.playing&&this.time-(p.input.received??p.last)<2;
    let left=dt;const liftSpeed=g.playerLiftSpeed(p.player,p.transient?.tether??null);while(left>1e-8){const step=Math.min(left,1/120);p.player.step(step,alive?p.keys:new Set(),liftSpeed);left-=step;}
    if(p.input)p.input.simulated=(p.input.simulated||0)+dt;
    this.slingContext(p,()=>g.kinetics.control(p.player,alive&&!!p.input.fire,alive&&p.tool==='sling'&&!p.input.aim));if(!alive){p.transient.tether=null;continue;}
    this.context(p,()=>{g.economy.state.deepest=Math.max(g.economy.state.deepest,-p.player.y);g.actions.update(dt,p.player,g.economy.state,!!p.input.fire&&!p.input.aim);if(g.cutter.edited){g.changed();g.feedback.cut(g.cutter.contact,p.player.head,dt,p.tool);}g.expedition.update(dt,p.player,!!p.input.fire&&!p.input.aim,g.orePhysics,false);g.collect();g.survey.update(dt,p.player);});
   }
   for(const {p,action,args}of this.pendingCommands.splice(0))this.execute(p,action,args);
  }
  execute(p,action,args){
   const g=this.game,before=p.player.position;this.context(p,()=>{
    let result=false;const oldToast=g.toast;let text='';g.toast=(s)=>text=String(s);
    try{
     const atShop=()=>{const a=g.interaction();return a&&['shop','sell','resident'].includes(a.kind);};
     if(action==='use')result=g.use();
     else if(action==='deploy'&&['lamp','bomb'].includes(args[0]))result=g.deploy(args[0]);
     else if(action==='detonate')result=g.detonate();
     else if(action==='pulse')result=g.expedition.pulse(p.player,true);
     else if(action==='buy'&&Object.hasOwn(B.GEAR,args[0])&&atShop())result=g.buy(args[0]);
     else if(action==='restock'&&['bomb','lamp'].includes(args[0])&&atShop())result=g.restock(args[0]);
     else if(action==='sell'&&atShop())result=g.sell();
     else if(action==='buyFreight'&&atShop())result=g.buyFreight();
     else if(action==='freightAction'&&['send','recall','take','pack'].includes(args[0]))result=g.freightAction(args[0]);
     else if(action==='placeFreight')result=g.freight.place(p.player);
     else if(action==='anchor')result=g.anchor();else if(action==='descend')result=g.descend();else if(action==='recall')result=g.recall();
     else if(action==='foundryBore')result=g.foundryBore();else if(action==='scan')result=g.scan();
     else if(action==='rescueControl')result=g.rescue.control(p.player);
     else if(action==='service'&&typeof args[0]==='string'&&args[0]!=='Eastcut deed'){const person=g.town.target(p.player,g.world,g.view.obstacles);if(person?.id===args[1]){const prev=g.townUI.person;g.townUI.open(person.id);g.screen='town';const buttons=document.getElementById('town-services').children;for(const button of buttons)if((button.firstElementChild||button.children[0])?.textContent===args[0]&&!button.disabled){button.onclick?.();break;}g.townUI.person=prev;}}
     if(result!==false)g.changed();this.stats.commands++;
     const moved=['x','y','z'].some(k=>p.player[k]!==before[k]);
     this.send({type:'result',text,...(moved?{position:body(p.player)}:{})},p.id);
    }finally{g.toast=oldToast;}
   });
  }
  command(action,args=[]){if(!this.guest||!this.ready)return false;this.send({type:'command',seq:++this.commandSeq,action,args},this.hostId);return true;}
  clearPrediction(){this.predictionInputs.clear();this.predictionSamples.length=0;this.serverPose=null;}
  rememberInput(seq){
   // Anchor acknowledgements to completed local physics, not unrelated host clocks.
   this.predictionInputs.set(seq,this.time-this.game.accumulator);
   while(this.predictionInputs.size>64)this.predictionInputs.delete(this.predictionInputs.keys().next().value);
  }
  rememberPrediction(){
   const at=this.time-this.game.accumulator,samples=this.predictionSamples;
   if(samples.length&&at<=samples[samples.length-1].at)return;
   samples.push({at,...this.game.player.position});
   while(samples.length>361||samples.length>1&&at-samples[0].at>3)samples.shift();
  }
  predictionError(pose,ack){
   if(!ack||!Number.isSafeInteger(ack.seq)||ack.seq<1||!Number.isFinite(ack.age)||ack.age<0||ack.age>2)return null;
   const sent=this.predictionInputs.get(ack.seq),samples=this.predictionSamples;if(sent===undefined||!samples.length)return null;
   const at=sent+ack.age;if(at<samples[0].at-1e-8||at>samples[samples.length-1].at+1e-8)return null;
   let lo=0,hi=samples.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(samples[mid].at<=at)lo=mid;else hi=mid;}
   const a=samples[lo],b=samples[hi],t=a.at===b.at?0:B.clamp((at-a.at)/(b.at-a.at),0,1);
   return Object.fromEntries(['x','y','z'].map(k=>[k,pose[k]-(a[k]+(b[k]-a[k])*t)]));
  }
  awaitingPrediction(ack){
   // A joining host has not consumed our first input yet. Bound this grace period.
   const first=this.predictionInputs.values().next().value;
   return ack?.seq===0&&Number.isFinite(ack.age)&&ack.age>=0&&ack.age<=2&&first!==undefined&&this.time-first<=1;
  }
  // Carry consumed corrections into history so later poses do not apply them twice.
  shiftPrediction(delta){for(const sample of this.predictionSamples)for(const k of ['x','y','z'])sample[k]+=delta[k];}
  cadence(key,interval){
   const previous=this[key]||0,count=Math.floor((this.time-previous+1e-8)/interval);if(count<1)return false;
   this[key]=previous+count*interval;return true;
  }
  tick(dt){
   this.time+=dt;if(!this.room)return;
   if(this.host&&this.world!==this.game.world){this.becomeHost(false);for(const p of this.peers.values())if(p.hello){p.player=null;this.snapshot(p.id);}}
   if(this.cadence('inputAt',.05)&&this.guest&&this.ready){const g=this.game,seq=++this.inputSeq;this.rememberInput(seq);this.send({type:'input',seq,keys:[...g.input.keys].filter(k=>KEYS.includes(k)),yaw:g.player.yaw,pitch:g.player.pitch,fire:g.input.fire,aim:g.input.aim,playing:g.running,tool:g.expedition.state.tool,chargeMode:g.gadgets.state.chargeMode},this.hostId);}
   if(this.host&&this.cadence('patchAt',.1))this.flushTerrain();
   if(this.host&&this.count>1&&this.cadence('poseAt',.05))this.send({type:'poses',epoch:this.epoch,seq:++this.inputSeq,at:this.time,members:this.members});
   if(this.host&&this.count>1&&this.cadence('frameAt',.2)){this.flushTerrain();this.send(this.captureFrame());}
  }
  heartbeat(){
   if(!this.room)return;this.game.advanceSimulation?.(undefined,true);this.hello();for(const p of this.peers.values()){this.send({type:'ping',at:this.time},p.id);if(this.time-p.last>15&&!this.room.getPeers?.()[p.id]){if(this.host&&p.sling)this.slingContext(p,()=>this.game.kinetics.cancel());this.peers.delete(p.id);this.tails.delete(p.id);this.game.view.removeMiner?.(p.id);this.elect();}}
   if(this.guest&&(!this.ready||this.time-(this.lastHost||0)>4)&&this.time-(this.lastNeed||0)>6&&!this.installing){this.lastNeed=this.time;this.send({type:'need'},this.hostId);}
   this.status=this.syncing?this.status:this.count>1?'Crew connected':'Global crew open';
  }
  updateGuest(dt){
   const g=this.game;if(!this.ready||!g.running){this.clearPrediction();return;}g.clock+=dt;g.accumulator+=dt;g.combat.hurtFlash=Math.max(0,g.combat.hurtFlash-dt);g.refreshPlayerObstacles();const liftSpeed=g.playerLiftSpeed();
   if(!this.predictionSamples.length)this.rememberPrediction();
   while(g.accumulator>=1/120){g.player.step(1/120,g.input.keys,liftSpeed);g.accumulator-=1/120;this.rememberPrediction();}
   if(this.serverPose&&this.time-this.serverPose.received>.25)this.serverPose=null;
   if(this.serverPose){const s=this.serverPose,age=B.clamp(this.time-s.received,0,.12),target=s.error?Object.fromEntries(['x','y','z'].map(k=>[k,g.player[k]+s.error[k]])):{x:s.x+(s.vx||0)*age,y:s.y+(s.vy||0)*age,z:s.z+(s.vz||0)*age},d=Math.hypot(g.player.x-target.x,g.player.y-target.y,g.player.z-target.z);if(d>2.5){const p=s.error&&!g.player.blocked(target.x,target.y,target.z)?target:s;g.player.teleport(p.x,p.y,p.z);this.clearPrediction();}else if(d>.35&&!s.waiting){const alpha=1-Math.exp(-dt*3),delta=Object.fromEntries(['x','y','z'].map(k=>[k,(target[k]-g.player[k])*alpha])),p={x:g.player.x+delta.x,y:g.player.y+delta.y,z:g.player.z+delta.z};if(!g.player.blocked(p.x,p.y,p.z)){g.player.correctPosition(p.x,p.y,p.z);this.shiftPrediction(delta);if(s.error)for(const k of ['x','y','z'])s.error[k]-=delta[k];}}}
   const tool=g.expedition.state.tool,hit=['cutter','scoop','lance'].includes(tool)?g.cutter.trace(g.player,g.economy.state.gear.drill,tool):null;
   g.actions.swingAge+=dt;if(tool==='axe'&&g.input.fire&&!g.input.aim&&g.actions.swingAge>=.68)g.actions.swingAge=0;
   g.cutter.edited=!!(g.input.fire&&!g.input.aim&&hit&&!hit.protected);g.cutter.contact=hit?{...hit,normal:g.world.normal(hit.x,hit.y,hit.z),protected:!g.world.canDig(hit.x,hit.y,hit.z,.2)}:null;
   g.mining.update(dt,g);g.feedback.update(dt,g);for(const p of this.peers.values())if(p.input?.fire&&p.contact&&p.pose&&['cutter','scoop','lance'].includes(p.tool))g.feedback.cut(p.contact,{x:p.pose.x,y:p.pose.y+1.58,z:p.pose.z},dt,p.tool);g.audio.drill(g.input.fire,g.cutter.edited,-g.player.y,tool,0,g.mining);g.audio.update(g,dt);
   if(g.input.aim==='bomb')g.aimPreview=g.gadgets.preview(g.player);if(g.input.aim==='freight')g.freightPreview=g.freight.placement(g.player);
   if(g.input.keys.has('KeyR')){g.recallTime+=dt;if(g.recallTime>=1.25){g.recallTime=0;this.command('recall');g.input.keys.delete('KeyR');}}else g.recallTime=0;g.updateHUD();
  }
  rename(value){this.profile.name=name(value);write('b2-miner-name',this.profile.name);this.hello();}
  recolor(value){this.profile.color=B.clamp(value,0,7);write('b2-miner-color',this.profile.color);this.hello();}
  async leave(){const room=this.room;this.room=null;++this.generation;clearInterval(this.timer);try{await room?.leave();}catch(e){this.error(e);}this.clearPrediction();this.peers.clear();this.pendingPatches=[];this.pendingFrame=null;this.role='offline';this.ready=true;this.syncing=false;this.game.store.key='current';this.status='Your local claim';if(this.personal){this.game.setScreen('pause');await this.game.install(B.Saves.validate(this.personal));}this.game.view.clearMiners?.();}
 }
 Object.assign(B,{Crew,TerrainChanges,CREW_COLORS:COLORS,CREW_PROTOCOL:PROTOCOL,CREW_ROOM:ROOM,CREW_SAVE_KEY:SAVE_KEY,crewIceConfig:iceConfig,crewMerge:copy,crewCompress:compress,crewDecompress:decompress});
})(B2);
