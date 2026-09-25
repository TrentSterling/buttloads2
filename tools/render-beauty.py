"""Render exported scene geometry without a browser, window activation or input.

Uses the game's procedural terrain functions. Lighting, tone mapping and shadows
are an offline adapter, not Three.js/WebGL certification. Canvas signs are omitted.
Requires the existing moderngl, numpy and Pillow installation.
"""
import json, sys
from pathlib import Path
import numpy as np
import moderngl
from PIL import Image

ROOT = Path(__file__).parent / 'out' / ('beauty-' + (sys.argv[1] if len(sys.argv)>1 else 'current'))
ctx = moderngl.create_standalone_context(require=330)
W,H=1280,720
def matrix(values): return np.array(values,dtype='f4').reshape((4,4),order='F')
def look_at(eye,target):
 e=np.array(eye,dtype=float);f=np.array(target,dtype=float)-e;f/=np.linalg.norm(f)
 s=np.cross(f,[0,1,0]);s/=np.linalg.norm(s);u=np.cross(s,f)
 m=np.eye(4);m[:3,:3]=[s,u,-f];m[:3,3]=-m[:3,:3]@e;return m
def uniform(program,key,value):
 if key not in program:return
 if isinstance(value,np.ndarray):program[key].write(value.astype('f4').T.tobytes())
 else:program[key].value=tuple(value) if isinstance(value,list) else value
VERT='''#version 330
in vec3 in_pos,in_normal,in_color,in_emit,in_meta;
uniform mat4 camera,shadowCamera; uniform bool tool;
out vec3 p,n,color,emission,meta;out vec4 shadowPosition;
void main(){p=in_pos;n=in_normal;color=in_color;emission=in_emit;meta=in_meta;shadowPosition=shadowCamera*vec4(p,1);gl_Position=camera*vec4(p,1);}
'''
LEGACY='''float grain(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
vec3 b2Terrain(vec3 p,vec3 n,vec3 base){float speck=grain(floor(p*31.));float coarse=grain(floor(p*5.));float sediment=sin(p.y*31.+sin(p.x*1.4)*1.8+sin(p.z*1.5));return base*(.84+.23*speck+.12*coarse+.045*sediment);}
float b2Height(vec3 p){return 0.;}
'''
FRAG='''
in vec3 p,n,color,emission,meta;in vec4 shadowPosition;out vec4 frag;
uniform vec3 eye,sunDir,sunColor,hemiSky,hemiGround,fogColor;
uniform float sunPower,hemiPower,fogNear,fogFar;uniform bool tool;
uniform vec3 lampPos[12],lampColor[12];uniform float lampPower[12],lampReach[12];uniform int lightCount;
uniform sampler2D shadowMap;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec3 normal=normalize(n),base=color,view=normalize(eye-p);
 if(meta.z>.5){base=b2Terrain(p,normal,base);float height=b2Height(p)*(1.-smoothstep(5.,22.,length(eye-p)));vec3 q0=dFdx(p),q1=dFdy(p),r0=cross(q1,normal),r1=cross(normal,q0);float det=dot(q0,r0);if(abs(det)>1e-8)normal=normalize(abs(det)*normal-sign(det)*(dFdx(height)*r0+dFdy(height)*r1));}
 vec3 shade=mix(hemiGround,hemiSky,normal.y*.5+.5)*hemiPower;
 vec3 sp=shadowPosition.xyz/shadowPosition.w*.5+.5;float shadow=0.;
 for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(shadowMap,sp.xy+vec2(x,y)/2048.).r;shadow+=sp.z-.001>d?.25:1.;}shadow/=9.;if(any(lessThan(sp,vec3(0)))||any(greaterThan(sp,vec3(1))))shadow=1.;
 if(tool){shade=vec3(.30)+vec3(.8,.74,.61)*max(0.,dot(normal,normalize(vec3(-2,4,3))));}
 else{shade+=sunColor*sunPower*max(0.,dot(normal,sunDir))*shadow;for(int i=0;i<lightCount;i++){vec3 d=lampPos[i]-p;float fall=pow(max(0.,1.-length(d)/lampReach[i]),2.);shade+=lampColor[i]*lampPower[i]*fall*max(0.,dot(normal,normalize(d)));}}
 vec3 halfVector=normalize(view+sunDir);float spec=pow(max(0.,dot(normal,halfVector)),mix(80.,8.,meta.x))*.25*(.2+meta.y)*sunPower;
 vec3 lit=meta.z<-.5?base:base*shade+vec3(spec)+emission;
 if(!tool)lit=mix(lit,fogColor,smoothstep(fogNear,fogFar,length(eye-p)));
 frag=vec4(pow(aces(lit*.95),vec3(1./2.2)),1);
}
'''
for file in ROOT.glob('*.json'):
 data=json.loads(file.read_text());program=ctx.program(vertex_shader=VERT,fragment_shader='#version 330\n'+(data['terrainGLSL'] or LEGACY)+FRAG)
 sun=data['sun'];direction=np.array(sun['position'],dtype=float)-np.array(sun['target'],dtype=float);direction/=np.linalg.norm(direction)
 shadow_eye=np.array(sun['target'])+direction*90
 ortho=np.diag([1/68,1/68,-2/180,1.]);ortho[2,3]=-1
 shadow_camera=ortho@look_at(shadow_eye,sun['target'])
 raw=(ROOT/(data['name']+'.bin')).read_bytes();buf=ctx.buffer(raw);vao=ctx.vertex_array(program,[(buf,'3f 3f 3f 3f 3f','in_pos','in_normal','in_color','in_emit','in_meta')])
 depth=ctx.depth_texture((2048,2048));depth.compare_func='';depth.repeat_x=depth.repeat_y=False
 sfbo=ctx.framebuffer(depth_attachment=depth);sfbo.use();sfbo.clear(depth=1);ctx.enable(moderngl.DEPTH_TEST|moderngl.CULL_FACE)
 sp=ctx.program(vertex_shader='#version 330\nin vec3 in_pos;uniform mat4 camera;void main(){gl_Position=camera*vec4(in_pos,1);}',fragment_shader='#version 330\nvoid main(){}')
 uniform(sp,'camera',shadow_camera);svao=ctx.vertex_array(sp,[(buf,'3f 48x','in_pos')]);svao.render()
 color=ctx.texture((W,H),4);fbo=ctx.framebuffer(color_attachments=[color],depth_attachment=ctx.depth_renderbuffer((W,H)));fbo.use();fbo.clear(*data['fog']['color'],1,depth=1)
 if data.get('skyShader'):
  fs=data['skyShader'].replace('varying vec3 skyDirection;','in vec3 skyDirection;out vec4 frag;').replace('gl_FragColor','frag').replace('#include <tonemapping_fragment>','frag.rgb=clamp((frag.rgb*.95*(2.51*frag.rgb*.95+.03))/(frag.rgb*.95*(2.43*frag.rgb*.95+.59)+.14),0.,1.);').replace('#include <encodings_fragment>','frag.rgb=pow(frag.rgb,vec3(1./2.2));')
  sky=ctx.program(vertex_shader='#version 330\nin vec2 in_pos;uniform mat4 inverseCamera;uniform vec3 eye;out vec3 skyDirection;void main(){vec4 w=inverseCamera*vec4(in_pos,1,1);skyDirection=w.xyz/w.w-eye;gl_Position=vec4(in_pos,.99999,1);}',fragment_shader='#version 330\n'+fs)
  quad=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());qvao=ctx.vertex_array(sky,[(quad,'2f','in_pos')]);uniform(sky,'inverseCamera',np.linalg.inv(matrix(data['camera'])));uniform(sky,'eye',data['eye'])
  for key,value in data['skyValues'].items():uniform(sky,key,value)
  qvao.render(moderngl.TRIANGLE_STRIP);qvao.release();quad.release();sky.release()
 depth.use(0);uniform(program,'shadowMap',0);uniform(program,'shadowCamera',shadow_camera);uniform(program,'camera',matrix(data['camera']));uniform(program,'tool',False)
 for key,value in {'eye':data['eye'],'sunDir':direction.tolist(),'sunColor':sun['color'],'sunPower':sun['intensity'],'hemiSky':data['hemi']['sky'],'hemiGround':data['hemi']['ground'],'hemiPower':data['hemi']['intensity'],'fogColor':data['fog']['color'],'fogNear':data['fog']['near'],'fogFar':data['fog']['far'],'lightCount':len(data['lights'])}.items():uniform(program,key,value)
 for key,source,size in [('lampPos','position',3),('lampColor','color',3),('lampPower','intensity',1),('lampReach','distance',1)]:
  values=[l[source] for l in data['lights']]+([[0]*size] if size>1 else [0])*(12-len(data['lights']));program[key].write(np.array(values,dtype='f4').tobytes())
 vao.render()
 world_image=Image.frombytes('RGBA',(W,H),fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 tool_fbo=ctx.simple_framebuffer((W,H),components=4);tool_fbo.use();tool_fbo.clear(0,0,0,0,depth=1)
 tbuf=tvao=None
 if data['toolVertices']:
  tbuf=ctx.buffer((ROOT/(data['name']+'-tool.bin')).read_bytes());tvao=ctx.vertex_array(program,[(tbuf,'3f 3f 3f 3f 3f','in_pos','in_normal','in_color','in_emit','in_meta')]);uniform(program,'tool',True);uniform(program,'eye',[0,0,0]);uniform(program,'camera',matrix(data['toolCamera']));tvao.render()
 tool_image=Image.frombytes('RGBA',(W,H),tool_fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 Image.alpha_composite(world_image,tool_image).save(ROOT/(data['name']+'.png'));tool_fbo.release()
 print(data['name']+': '+str(data['vertices']//3)+' triangles rendered on '+ctx.info['GL_RENDERER'])
 for obj in [tvao,tbuf,vao,svao,buf,sp,program,fbo,color,sfbo,depth]:
  if obj is not None:obj.release()
ctx.release()
