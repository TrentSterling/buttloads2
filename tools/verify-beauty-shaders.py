"""Compile the actual expanded Three.js terrain stages on standalone OpenGL.

Adapts WebGL GLSL syntax to desktop GLSL. This catches shader integration errors
without a browser; it does not establish browser-specific driver behavior.
"""
import json,re
from pathlib import Path
import moderngl
data=json.loads((Path(__file__).parent/'out'/'beauty-shaders.json').read_text())
macros=set(re.findall(r'\b(?:NUM_[A-Z_]+|UNION_CLIPPING_PLANES)\b',data['vertex']+data['fragment']))
counts=''.join('#define '+name+' '+str(1 if name in ('NUM_DIR_LIGHTS','NUM_HEMI_LIGHTS','NUM_POINT_LIGHTS') else 0)+'\n' for name in sorted(macros))
defines='#version 330\n#define USE_COLOR\n#define USE_FOG\n'+counts
common='uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;\n'
vertex=defines+common+'in vec3 position,normal,color;in vec2 uv;\n'+data['vertex'].replace('varying ','out ').replace('attribute ','in ')
fragment=defines+common+'out vec4 finalColor;vec4 linearToOutputTexel(vec4 value){return value;}\n'+data['fragment'].replace('varying ','in ').replace('gl_FragColor','finalColor').replace('texture2D(','texture(').replace('textureCube(','texture(')
ctx=moderngl.create_standalone_context(require=330)
try:
 program=ctx.program(vertex_shader=vertex,fragment_shader=fragment)
 print('PASS actual expanded Three.js terrain vertex + fragment stages compile and link')
 print('GPU: '+ctx.info['GL_RENDERER']);program.release()
finally:ctx.release()
