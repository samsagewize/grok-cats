from PIL import Image, ImageDraw, ImageFont
PAL=[ # (role, hex)
("outline",      "#1b1420"),
("aqua-0 deep",  "#0e3a44"),
("aqua-1 dark",  "#17606b"),
("aqua-2 mid",   "#2a8f96"),
("aqua-3 bright","#4fc1c0"),
("aqua-4 light", "#8fe3dc"),
("aqua-5 pale",  "#d2f7f0"),
("cherry-0 deep","#3d0f1c"),
("cherry-1 dark","#6e1a2e"),
("cherry-2 base","#a3243f"),
("cherry-3 bright","#d6435f"),
("cherry-4 light","#f08a9a"),
("cream",        "#fbf1dc"),
]
def h(x): return tuple(int(x[i:i+2],16) for i in (1,3,5))+(255,)
P={r:h(x) for r,x in PAL}
open('palette.hex','w').write('\n'.join(x[1:] for _,x in PAL)+'\n')
open('palette.gpl','w').write("GIMP Palette\nName: Aqua Cherry Cafe\nColumns: 7\n#\n"+
  '\n'.join(f"{h(x)[0]:3d} {h(x)[1]:3d} {h(x)[2]:3d}\t{r}" for r,x in PAL)+'\n')
# swatch sheet
font=ImageFont.load_default()
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
except: pass
sw=Image.new('RGBA',(7*120,2*120),P['cream']); d=ImageDraw.Draw(sw)
for i,(r,x) in enumerate(PAL):
    cx,cy=(i%7)*120,(i//7)*120
    d.rectangle([cx+10,cy+8,cx+110,cy+78],fill=h(x),outline=P['outline'],width=2)
    d.text((cx+10,cy+82),r,fill=P['outline'],font=font); d.text((cx+10,cy+98),x,fill=P['outline'],font=font)
sw.save('palette.png')

from make import C  # orange source colors (re-runs make.py harmlessly)
MAP={'K':'outline','O':'aqua-4 light','H':'aqua-5 pale','S':'aqua-3 bright','D':'aqua-2 mid',
     'L':'cream','P':'cherry-3 bright','E':'outline','G':'aqua-1 dark','W':'cream',
     'R':'cherry-2 base','Y':'cherry-4 light'}
def recolor(path):
    im=Image.open(path).convert('RGBA'); px=im.load()
    inv={C[k]:P[v] for k,v in MAP.items()}
    for y in range(im.height):
        for x in range(im.width):
            if px[x,y][3]: px[x,y]=inv[px[x,y]]
    return im
c16=recolor('cat16_idle.png'); c32=recolor('cat32_idle.png')
c16.save('cat16_aqua.png'); c16.resize((256,256),Image.NEAREST).save('cat16_aqua_x16.png')
c32.save('cat32_aqua.png'); c32.resize((256,256),Image.NEAREST).save('cat32_aqua_x8.png')

# scene 96x64 palette-only
S=Image.new('RGBA',(96,64),P['outline']); px=S.load()
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1):
        for x in range(x0,x1):
            if 0<=x<96 and 0<=y<64: px[x,y]=P[c]
rect(0,0,96,30,'aqua-1 dark'); rect(0,28,96,30,'aqua-0 deep')
rect(0,30,96,64,'aqua-2 mid')
for y in range(30,64,8):
    for x in range((y//8%2)*8,96,16): rect(x,y,x+8,y+8,'aqua-3 bright')
rect(10,6,30,24,'cherry-0 deep'); rect(12,8,28,22,'aqua-4 light'); rect(12,8,18,12,'aqua-5 pale')
rect(19,8,21,22,'cherry-0 deep'); rect(12,14,28,16,'cherry-0 deep')
rect(41,0,42,5,'cherry-0 deep'); rect(38,5,45,13,'cherry-2 base'); rect(40,7,42,10,'cherry-4 light'); rect(39,13,44,14,'cherry-0 deep')
rect(60,12,80,14,'cherry-1 dark'); rect(63,9,67,12,'cherry-2 base'); rect(62,6,68,9,'aqua-3 bright'); rect(64,4,66,6,'aqua-4 light'); rect(61,7,62,8,'aqua-3 bright'); rect(68,7,69,8,'aqua-3 bright')
rect(72,9,76,12,'cream')
for (x,y) in [(84,4),(85,4),(87,4),(88,4),(83,5),(86,5),(89,5),(83,6),(89,6),(84,7),(88,7),(85,8),(87,8),(86,9)]:
    px[x,y]=P['cherry-3 bright']
rect(28,44,76,60,'cherry-2 base'); rect(30,46,74,58,'cherry-1 dark'); rect(32,48,72,56,'cherry-2 base')
rect(36,48,58,54,'cherry-3 bright'); rect(36,48,58,49,'cherry-4 light')
rect(40,52,53,53,'cherry-0 deep'); S.alpha_composite(c16,(40,38))
S.save('preview_scene_aqua_96x64.png'); S.resize((768,512),Image.NEAREST).save('preview_scene_aqua_x8.png')

# compare
o16=Image.open('cat16_idle.png'); o32=Image.open('cat32_idle.png')
cmp=Image.new('RGBA',(4*208+16,240),P['aqua-0 deep']); d=ImageDraw.Draw(cmp)
for i,(im,lab) in enumerate([(o16,'16 orange'),(o32,'32 orange'),(c16,'16 aqua'),(c32,'32 aqua')]):
    cmp.alpha_composite(im.resize((192,192),Image.NEAREST),(16+i*208,16)); d.text((16+i*208,214),lab,fill=P['cream'],font=font)
cmp.save('compare_orange_vs_aqua.png')
# palette check
allowed=set(P.values())
for f in ['cat16_aqua.png','cat32_aqua.png','preview_scene_aqua_96x64.png']:
    cols={c for c in Image.open(f).convert('RGBA').get_flattened_data() if c[3]}
    print(f, len(cols),'colors, off-palette:', cols-allowed)
