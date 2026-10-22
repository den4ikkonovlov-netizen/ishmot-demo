import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule()});
const doc=await io.read('../research/iphone17promax.glb');
for(const extension of doc.getRoot().listExtensionsUsed())if(extension.extensionName==='KHR_draco_mesh_compression')extension.dispose();
// The library's glTF export contains black baked base maps. Keep its detailed
// geometry and replace the studio materials in the renderer, plus a live screen.
for(const mat of doc.getRoot().listMaterials()){
 mat.setBaseColorTexture(null).setEmissiveTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null);
}
for(const texture of doc.getRoot().listTextures())texture.dispose();
for(const extension of doc.getRoot().listExtensionsUsed())if(extension.extensionName==='EXT_texture_webp')extension.dispose();
const bytes=await io.writeBinary(doc);
fs.mkdirSync('../src',{recursive:true});
fs.writeFileSync('../src/phone-model-data.js',`// Fiq KM / BlenderKit Royalty Free; see dist/vendor/iphone-model-LICENSE.txt\nexport default '${Buffer.from(bytes).toString('base64')}';\n`);
fs.writeFileSync('../research/iphone17promax-decoded.glb',bytes);
fs.writeFileSync('../src/avatar-data.js',`// User-supplied meme, already part of this website.\nexport default 'data:image/png;base64,${fs.readFileSync('../dist/assets/tim-meme.png').toString('base64')}';\n`);
console.log('Prepared local model:',bytes.length,'bytes; primitives:',doc.getRoot().listMeshes()[0].listPrimitives().length);
