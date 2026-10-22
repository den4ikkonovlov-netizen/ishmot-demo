"""CPU depth-buffer geometry diagnostic. Not a browser or WebGL screenshot."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parent.parent
meshes=json.loads((root/'qa/phone-meshes.json').read_text())
texture=np.asarray(Image.open(root/'qa/phone-screen.png').convert('RGB'))/255.
panels=[]
for angle in [2.72,1.25,-.07]:
    cx,sx=math.cos(.04),math.sin(.04);cy,sy=math.cos(angle),math.sin(angle);cz,sz=math.cos(-.04),math.sin(-.04)
    # Three.js Euler XYZ convention.
    rot=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]])@np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]])@np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])
    image=np.zeros((760,400,3));image[:]=np.array([16,27,22])/255.;depth=np.full((760,400),-np.inf)
    lights=[(np.array([-.5,.8,1.]),.8),(np.array([1.,.2,.4]),.35)]
    lights=[(v/np.linalg.norm(v),i) for v,i in lights]
    for mesh in meshes:
        if mesh['name']=='17ProMax_glass':continue
        v=np.array(mesh['position']).reshape(-1,3)@rot.T
        n=np.array(mesh['normal']).reshape(-1,3)@rot.T
        uv=np.array(mesh['uv']).reshape(-1,2)
        xy=v[:,:2]*np.array([400/4.2,-760/7.98])+np.array([200,380])
        color=np.array(mesh['color']);screen=mesh['name']=='17ProMax_Screen'
        for ids in np.array(mesh['indices']).reshape(-1,3):
            tri=xy[ids];z=v[ids,2];normal=n[ids]
            # Back-face culling, matching the site's opaque materials.
            face=np.cross(v[ids[1]]-v[ids[0]],v[ids[2]]-v[ids[0]])
            if face[2]<=0:continue
            x0=max(0,int(np.floor(tri[:,0].min())));x1=min(399,int(np.ceil(tri[:,0].max())))
            y0=max(0,int(np.floor(tri[:,1].min())));y1=min(759,int(np.ceil(tri[:,1].max())))
            if x1<x0 or y1<y0:continue
            a,b,c=tri;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-9:continue
            yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
            w0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
            w1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;w2=1-w0-w1
            zz=w0*z[0]+w1*z[1]+w2*z[2];d=depth[y0:y1+1,x0:x1+1]
            mask=(w0>=-1e-5)&(w1>=-1e-5)&(w2>=-1e-5)&(zz>d)
            if not np.any(mask):continue
            weights=np.stack([w0[mask],w1[mask],w2[mask]],axis=1)
            if screen:
                tuv=weights@uv[ids];tx=np.clip((tuv[:,0]*767).astype(int),0,767);ty=np.clip(((1-tuv[:,1])*1663).astype(int),0,1663);rgb=texture[ty,tx]
            else:
                norms=weights@normal;norms/=np.maximum(1e-8,np.linalg.norm(norms,axis=1,keepdims=True))
                lum=np.full(len(norms),.34);spec=np.zeros(len(norms))
                for light,intensity in lights:
                    lum+=np.maximum(0,norms@light)*intensity
                    half=light+np.array([0,0,1]);half/=np.linalg.norm(half)
                    spec+=np.maximum(0,norms@half)**(12+100*(1-mesh['roughness']))*.35
                rgb=np.clip(color[None,:]*lum[:,None]+spec[:,None],0,1)**(1/2.2)
            region=image[y0:y1+1,x0:x1+1];region[mask]=rgb;d[mask]=zz[mask]
    panels.append(Image.fromarray(np.clip(image*255,0,255).astype('uint8')))
out=Image.new('RGB',(1200,760))
for i,panel in enumerate(panels):out.paste(panel,(i*400,0))
out.save(root/'qa/phone-depth-preview.png')
print('CPU depth-buffer geometry preview saved')
