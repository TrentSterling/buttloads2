'use strict';
(function(B){
 B.installCrewControls=function(g){
  const route=(method,action=method)=>{const original=g[method];g[method]=function(...args){if(this.net?.guest){this.net.command(action,args);return false;}return original.apply(this,args);};};
  for(const method of ['deploy','detonate','buy','restock','sell','buyFreight','freightAction','anchor','descend','recall','foundryBore'])route(method);
  const use=g.use;g.use=function(){if(this.net?.guest){const a=this.interaction();if(a&&['shop','resident','freight','rescue'].includes(a.kind))return use.call(this);this.net.command('use');return;}return use.call(this);};
  const scan=g.scan;g.scan=function(){const result=scan.call(this);if(this.net?.guest)this.net.command('scan');return result;};
  const freight=g.releaseFreight;g.releaseFreight=function(){if(this.net?.guest){if(this.input.aim==='freight'){this.input.aim=null;this.freightPreview=null;this.net.command('placeFreight');}return;}return freight.call(this);};
  const parcel=g.buyParcel;g.buyParcel=async function(){if(this.net?.guest){this.toast('The crew lead handles deeds. Supplies and upgrades are shared.');return false;}return parcel.call(this);};
  const control=document.getElementById('rescue-control').onclick;document.getElementById('rescue-control').onclick=()=>{if(g.net?.guest){g.net.command('rescueControl');g.play();return;}return control();};
 };
})(B2);
