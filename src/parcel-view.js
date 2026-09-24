/* Surface ownership markers and a deed board outside the excavatable parcel. */
'use strict';
(function(B){
  B.View.prototype.makeParcel=function(game){
    const T=THREE,p=this.palette;
    if(this.parcelScene){const mats=new Set();this.parcelScene.traverse(n=>{n.geometry?.dispose();if(n.material&&!Object.values(p).includes(n.material))mats.add(n.material);});for(const m of mats){m.map?.dispose();m.dispose();}this.scene.remove(this.parcelScene);}
    const root=this.parcelScene=new T.Group();this.scene.add(root);
    const owned=!!game.world.parcelVersion,box=(...a)=>this.box(root,...a);
    this.parcelCap=box(32,-.2,0,32,.4,32,p.grass);this.parcelCap.visible=!owned;
    for(let z=-14;z<=14;z+=2)if(!owned || z>=-2)box(14.1,.045,z,.16,.08,.9,z%4===0?p.yellow:p.black);
    for(let x=16;x<=46;x+=2)for(const z of [-14.1,-1.9])box(x,.05,z,.9,.08,.16,owned?(x%4===0?p.yellow:p.black):p.pale);
    for(let z=-14;z<=-2;z+=2)box(46.1,.05,z,.16,.08,.9,owned?p.yellow:p.pale);
    for(const x of [30.4,35.6]){box(x,1.25,-.6,.18,2.5,.18,p.wood);box(x,.12,-.6,.48,.24,.48,p.concrete);}
    box(33,1.65,-.6,5.55,1.2,.18,p.dark);
    this.sign(root,'EASTCUT / CLAIM 03',owned?'YOUR GROUND / KEEP THE ROAD CLEAR':'DEED AT VALE SUPPLY / $1,500',33,1.65,-.495,5.35,1,0,'#273d39',owned?'#aee3c2':'#e9c778');
    this.sign(root,owned?'384 m² / IRON TO PRISM':'32 x 12 METRES / OLD WORKINGS','THE EASTERN ROAD REMAINS COMMON LAND',33,.72,-.49,4.8,.5,0,'#273d39','#e0ddc3');
    const glow=new T.MeshStandardMaterial({color:owned?'#baf0cb':'#dec38c',emissive:owned?'#84d3a5':'#000000',emissiveIntensity:owned?1:.0});
    this.cylinder(root,35.6,2.65,-.6,.12,.14,.35,glow,8);box(35.6,2.87,-.6,.42,.1,.42,p.dark);
    this.parcelLight=new T.PointLight('#c5ecc0',0,9,1.7);this.parcelLight.position.set(35.6,2.65,-.4);root.add(this.parcelLight);
    this.renderer.shadowMap.needsUpdate=true;
  };
  B.View.prototype.renderParcel=function(game){if(this.parcelLight)this.parcelLight.intensity=game.world.parcelVersion && game.player.y>-4 && Math.hypot(game.player.x-35.6,game.player.z+.6)<14?.8:0;};
})(B2);
