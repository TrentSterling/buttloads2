"""Compile the actual expanded Three.js terrain stages on standalone OpenGL.

Adapts WebGL GLSL syntax to desktop GLSL. This catches shader integration errors
without a browser; it does not establish browser-specific driver behavior.
"""
import json,re
from pathlib import Path
import moderngl
data=json.loads((Path(__file__).parent/'out'/'beauty-shaders.json').read_text())
macros=set(re.findall(r'\b(?:NUM_[A-Z_]+|UNION_CLIPPING_PLANES)\b',data['vertex']+data['fragment']))
common='uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;\n'
ctx=moderngl.create_standalone_context(require=330)
try:
 for shadows in [False,True]:
  enabled={'NUM_DIR_LIGHTS','NUM_HEMI_LIGHTS','NUM_POINT_LIGHTS'}
  if shadows: enabled.update({'NUM_DIR_LIGHT_SHADOWS','NUM_SPOT_LIGHTS','NUM_SPOT_LIGHT_SHADOWS'})
  counts=''.join('#define '+name+' '+str(int(name in enabled))+'\n' for name in sorted(macros))
  defines='#version 330\n#define USE_COLOR\n#define USE_FOG\n'+('#define USE_SHADOWMAP\n#define SHADOWMAP_TYPE_PCF_SOFT\n' if shadows else '')+counts
  vertex=defines+common+'in vec3 position,normal,color;in vec2 uv;\n'+data['vertex'].replace('varying ','out ').replace('attribute ','in ')
  fragment=defines+common+'out vec4 finalColor;vec4 linearToOutputTexel(vec4 value){return value;}\n'+data['fragment'].replace('varying ','in ').replace('gl_FragColor','finalColor').replace('texture2D(','texture(').replace('textureCube(','texture(')
  program=ctx.program(vertex_shader=vertex,fragment_shader=fragment)
  print('PASS actual expanded Three.js terrain stages compile and link'+(' with directional + spot shadows' if shadows else ''));program.release()
 print('GPU: '+ctx.info['GL_RENDERER'])
finally:ctx.release()
