from PIL import Image
import math
C = {
 '.':(0,0,0,0),'K':(43,24,22,255),'O':(232,137,43,255),'H':(248,178,88,255),
 'S':(184,96,32,255),'D':(150,70,24,255),'L':(250,224,180,255),'P':(238,138,150,255),
 'E':(30,26,30,255),'G':(120,200,110,255),'W':(255,255,255,255),'R':(196,40,52,255),'Y':(250,206,70,255),
}
def from_map(rows):
    h=len(rows); w=len(rows[0]); im=Image.new('RGBA',(w,h))
    for y,r in enumerate(rows):
        assert len(r)==w,(y,len(r),r)
        for x,c in enumerate(r): im.putpixel((x,y),C[c])
    return im

# ---------- 16x16: bold, chunky ----------
cat16 = [
"................",
"..KK......KK....",
"..KOK....KOK....",
"..KPOKKKKOPK....",
".KOOOOOOOOOOK...",
".KOEOOOOOOEOK...",
".KOOOOPPOOOOK...",
"..KOLLLLLLOK....",
"..KRRRYRRRRK....",
"..KOOLLLLOOK.KK.",
".KOOOLLLLOOOKOK.",
".KOOOLLLLOOOKOK.",
".KOSOLLLLOSOKOK.",
".KOSOLLLLOSOOK..",
".KKLLKKKKLLKKK..",
"................",
]
c16 = from_map(cat16)

# ---------- 32x32: procedural shapes + auto-outline ----------
W=32; g=[['.']*W for _ in range(W)]
def inell(x,y,cx,cy,rx,ry): return ((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1
def intri(x,y,a,b,c):
    px,py=x+.5,y+.5
    def s(p,q,r): return (p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1])
    d1=s((px,py),a,b);d2=s((px,py),b,c);d3=s((px,py),c,a)
    return not((d1<0 or d2<0 or d3<0) and (d1>0 or d2>0 or d3>0))
for y in range(W):
    for x in range(W):
        body=inell(x,y,15,23,8,7.2) and y<=29
        head=inell(x,y,15,11,8.5,6.5)
        earL=intri(x,y,(7,1.5),(7,10),(13.5,6)); earR=intri(x,y,(23,1.5),(23,10),(16.5,6))
        tail=False
        for t in range(0,40):
            a=t/39; tx=23+5*math.sin(a*2.4); ty=29-a*12
            if (x+.5-tx)**2+(y+.5-ty)**2<=2.3**2: tail=True
        if body or head or earL or earR or tail: g[y][x]='O'
        if tail and not body and (ty if False else 0)==0 and y<20 and x>=26: g[y][x]='O'
        if intri(x,y,(8,3.5),(8.5,8),(11.5,6.5)) or intri(x,y,(22,3.5),(21.5,8),(18.5,6.5)): g[y][x]='P'
        if body and inell(x,y,15,23,3.6,6): g[y][x]='L'
        if inell(x,y,15,14.2,3.6,2.4): g[y][x]='L'
# shading: right/bottom of fills -> S, top-left of head -> H
for y in range(W):
    for x in range(W):
        if g[y][x]=='O':
            if inell(x,y,15,23,8,7.2) and x>=20 and y>=20: g[y][x]='S'
            elif inell(x,y,15,23,8,7.2) and x<=9 and y>=24: g[y][x]='S'
            elif inell(x,y,15,11,8.5,6.5) and y<=7 and 9<=x<=13: g[y][x]='H'
            elif y>=26 and x>=24: g[y][x]='S'
# stripes
for (x,y) in [(14,5),(15,5),(16,5),(15,6),(12,6),(18,6),(7,11),(8,11),(22,11),(23,11),(7,13),(22,13),
              (8,20),(9,20),(8,22),(9,22),(21,20),(22,20),(21,22),(22,22),(24,24),(25,24),(26,21),(27,21),(27,18),(26,15)]:
    if g[y][x] in 'OHS': g[y][x]='D'
# eyes
for (x,y,c) in [(10,10,'G'),(11,10,'G'),(10,11,'E'),(11,11,'G'),(10,10,'W'),
                (19,10,'G'),(20,10,'G'),(19,11,'G'),(20,11,'E'),(19,10,'W')]:
    g[y][x]=c
g[10][10]='W'; g[11][10]='E'; g[10][11]='G'; g[11][11]='E'
g[10][19]='W'; g[10][20]='G'; g[11][19]='E'; g[11][20]='E'
# nose + mouth
g[13][14]='P';g[13][15]='P';g[14][14]='K';g[14][15]='K'
g[15][13]='K';g[15][16]='K'
# collar + bell
for x in range(W):
    if g[17][x]!='.' and 8<=x<=22: g[17][x]='R'
g[18][14]='Y';g[18][15]='Y'
# paws
for x in [10,11,12,18,19,20]: g[29][x]='L'
for x in [13,17]: g[29][x]='K'
# auto outline
out=[r[:] for r in g]
for y in range(W):
    for x in range(W):
        if g[y][x]=='.':
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                X,Y=x+dx,y+dy
                if 0<=X<W and 0<=Y<W and g[Y][X]!='.': out[y][x]='K';break
c32=from_map([''.join(r) for r in out])

c16.save('cat16_idle.png'); c16.resize((256,256),Image.NEAREST).save('cat16_idle_x16.png')
c32.save('cat32_idle.png'); c32.resize((256,256),Image.NEAREST).save('cat32_idle_x8.png')
open('cat32_map.txt','w').write('\n'.join(''.join(r) for r in out))

# ---------- preview scene 96x64, low detail, x8 ----------
S=Image.new('RGBA',(96,64),(0,0,0,255)); px=S.load()
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1):
        for x in range(x0,x1):
            if 0<=x<96 and 0<=y<64: px[x,y]=c
WALL=(30,78,84,255);WALL2=(24,62,68,255);FLOOR=(52,120,118,255);FLOOR2=(44,104,102,255)
WOOD=(92,56,36,255);WOOD2=(64,38,26,255);RUG=(128,30,40,255);RUG2=(96,22,32,255)
GLASS=(110,210,214,255);GLASS2=(170,236,236,255);LAN=(220,50,50,255);LAN2=(255,140,90,255)
rect(0,0,96,30,WALL); rect(0,28,96,30,WALL2)
rect(0,30,96,64,FLOOR)
for y in range(30,64,8):
    for x in range((y//8%2)*8,96,16): rect(x,y,x+8,y+8,FLOOR2)
# window
rect(10,6,30,24,WOOD2); rect(12,8,28,22,GLASS); rect(12,8,18,12,GLASS2); rect(19,8,21,22,WOOD2); rect(12,14,28,16,WOOD2)
# lantern
rect(41,0,42,5,WOOD2); rect(38,5,45,13,LAN); rect(40,7,42,10,LAN2); rect(39,13,44,14,WOOD2)
# shelf + plant
rect(60,12,80,14,WOOD); rect(63,8,67,12,(70,130,70,255)); rect(64,6,66,8,(90,160,80,255))
rect(72,9,76,12,(200,200,190,255))
# heart sign
for (x,y) in [(84,4),(85,4),(87,4),(88,4),(83,5),(86,5),(89,5),(83,6),(89,6),(84,7),(88,7),(85,8),(87,8),(86,9)]:
    px[x,y]=(255,90,120,255)
# rug
rect(28,44,76,60,RUG); rect(30,46,74,58,RUG2); rect(32,48,72,56,RUG)
# cushion under cat
rect(36,48,58,54,(150,40,60,255)); rect(36,48,58,49,(190,70,90,255))
rect(40,52,53,53,(70,14,24,255)); S.alpha_composite(c16,(40,38))
S.save('preview_scene_96x64.png'); S.resize((768,512),Image.NEAREST).save('preview_scene_x8.png')

# comparison sheet: both cats at same displayed size 256
sheet=Image.new('RGBA',(560,288),(30,78,84,255))
sheet.alpha_composite(c16.resize((256,256),Image.NEAREST),(16,16))
sheet.alpha_composite(c32.resize((256,256),Image.NEAREST),(288,16))
sheet.save('compare_16_vs_32.png')
