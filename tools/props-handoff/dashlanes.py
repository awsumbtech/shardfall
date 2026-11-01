# Post-pass: drop blocking props that sit on any base dash row's travel line (start -> end), margin 12px.
import json,math,glob,sys
MARGIN=12
segs=[]
for f in glob.glob('dashout/base-*.json'):
    for m in json.load(open(f)):
        for r in m['rows']: segs.append((r['start'][0],r['start'][1],r['x'],r['y']))
def dseg(px,py,a):
    x1,y1,x2,y2=a; dx,dy=x2-x1,y2-y1; L=dx*dx+dy*dy or 1
    t=max(0,min(1,((px-x1)*dx+(py-y1)*dy)/L)); return math.hypot(px-x1-t*dx,py-y1-t*dy)
d=json.load(open('props-dense.json')); keep=[];drop=[]
for p in d['props']:
    if p['block']>0 and min(dseg(p['x'],p['y'],s) for s in segs) < p['block']+MARGIN: drop.append(p)
    else: keep.append(p)
d['props']=keep; d['dash_lane_pruned']=len(drop)
json.dump(d,open('props-dense.json','w'))
print(len(segs),'segs; dropped',len(drop)); [print(' ',p) for p in drop]
