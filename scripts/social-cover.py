from pathlib import Path
from io import BytesIO
from math import sin, cos, pi
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
def load_font(name, size):
    font = TTFont(root / 'assets/fonts' / name)
    font.flavor = None
    data = BytesIO()
    font.save(data)
    data.seek(0)
    return ImageFont.truetype(data, size)

image = Image.new('RGB', (1200, 630), '#09090b')
draw = ImageDraw.Draw(image)
red = '#ff414a'
for x in range(700, 1150, 28):
    draw.line((x, 60, x, 570), fill='#25171b')
for y in range(60, 571, 28):
    draw.line((700, y, 1150, y), fill='#25171b')
center = (943, 316)
nodes = [(center[0] + 175*cos(a*2*pi/12), center[1] + 175*sin(a*2*pi/12)) for a in range(12)]
for index, point in enumerate(nodes):
    draw.line((*point, *nodes[(index+1)%12]), fill='#be2638', width=1)
    draw.line((*point, *nodes[(index+4)%12]), fill='#572330', width=1)
    draw.ellipse((point[0]-3,point[1]-3,point[0]+3,point[1]+3),fill=red)
draw.ellipse((center[0]-205,center[1]-82,center[0]+205,center[1]+82), outline=red, width=2)
draw.ellipse((center[0]-84,center[1]-201,center[0]+84,center[1]+201), outline='#713341', width=1)
draw.text((60,54),'sh4mr0ck.ctf',font=load_font('be-vietnam-pro-800.woff2',28),fill='#f2f0f0')
draw.text((60,148),'GHI CHÉP CTF & AN TOÀN THÔNG TIN',font=load_font('ibm-plex-mono-400.woff2',15),fill='#a4a0a5')
draw.text((55,214),'Giải mã giới hạn.',font=load_font('be-vietnam-pro-800.woff2',54),fill='#f2f0f0')
draw.text((55,300),'Viết lại cuộc chơi.',font=load_font('be-vietnam-pro-800.woff2',54),fill=red)
draw.text((60,439),'Rèn tư duy. Giữ tò mò.',font=load_font('be-vietnam-pro-400.woff2',22),fill='#a4a0a5')
draw.line((60,534,1140,534),fill='#3b2a30')
draw.text((60,562),'BLOG CTF TIẾNG VIỆT',font=load_font('ibm-plex-mono-400.woff2',14),fill='#b897a0')
path=root/'assets/social-cover.png'
image.save(path,optimize=True)
print('Ảnh chia sẻ:',path,image.size,path.stat().st_size)
