from PIL import Image
exec(open('make.py').read().split('# ---------- 16x16')[0])
L=[
"...............",
"......KK.......",
"......KOK......",
"......KOOK.....",
"......KOPOK....",
"......KOPPOKKKK",
"......KOPPOOODD",
".....KOOPOOOOOD",
".....KOOOOOOOOO",
".....KOOOOOOOOO",
".....KDDOWGOOOO",
".....KOOOEEOOOO",
".....KDDOOOLLLL",
"......KOOOLLLLP",
".......KOOLLLLK",
"........KOOLLKL",
".........KOOOOO",
".........KRRRRR",
"........KOOOOLY",
".......KOOOOLLL",
"......KODDOOLLL",
"......KOOOOOLLL",
"......KODDOLLLL",
"......KOOOOLLLL",
"......KOOOOOLLL",
"......KOOOOOLLL",
".......KOOOOLLL",
".......KOOOOOLL",
".......KLLLKOOO",
"........KKKKKKK",
"...............",
"...............",
]
g=[list(r+r[::-1]+'..') for r in L]
# fix eye glint direction on right eye (mirror gives GW -> make W on left of each eye)
g[10][19]='W'; g[10][20]='G'
tail={
15:"..........................KK....",
16:".........................KOOK...",
17:".........................KODK...",
18:".........................KOOK...",
19:".........................KOOK...",
20:".........................KOOK...",
21:".........................KDDK...",
22:".........................KOOK...",
23:"........................KOOK....",
24:".......................KOOOK....",
25:"......................KSOOK.....",
26:".....................KSSSK......",
27:"....................KSSSK.......",
28:"...................KKKKK........",
}
for y,r in tail.items():
    for x,c in enumerate(r):
        if c!='.' and (g[y][x]=='.' or (g[y][x]=='K' and c!='K')): g[y][x]=c
# shading right side, highlight top-left
for y in range(19,28):
    for x in range(19,23):
        if g[y][x]=='O': g[y][x]='S'
for y in range(7,10):
    for x in range(7,11):
        if g[y][x]=='O': g[y][x]='H'
rows=[''.join(r) for r in g]
open('cat32_map.txt','w').write('\n'.join(rows))
c32=from_map(rows)
c32.save('cat32_idle.png'); c32.resize((256,256),Image.NEAREST).save('cat32_idle_x8.png')
c16=Image.open('cat16_idle.png')
sheet=Image.new('RGBA',(560,288),(30,78,84,255))
sheet.alpha_composite(c16.resize((256,256),Image.NEAREST),(16,16))
sheet.alpha_composite(c32.resize((256,256),Image.NEAREST),(288,16))
sheet.save('compare_16_vs_32.png')
print('\n'.join(rows))
