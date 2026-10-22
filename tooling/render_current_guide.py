"""Approximate layout guide from current HTML/CSS; not a browser screenshot."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

root = Path(__file__).resolve().parent.parent
im = Image.new("RGB", (1600, 900), "#f5f3ed")
d = ImageDraw.Draw(im)
d.rectangle((832, 0, 1600, 900), fill="#101e49")
d.rectangle((0, 0, 1600, 96), fill="#101c43")

font_regular = "C:/Windows/Fonts/arial.ttf"
font_bold = "C:/Windows/Fonts/arialbd.ttf"
def txt(label, xy, size, color, bold=False):
    d.text(xy, label, font=ImageFont.truetype(font_bold if bold else font_regular, size), fill=color)

txt("айшмот", (72, 27), 43, "#fbfaf2", True)
for label, x in (("Техника", 545), ("Ремонт", 680), ("Trade-in", 805), ("Мы рядом", 950)):
    txt(label, (x, 37), 19, "#f7f7f1")
txt("+7 (995) 013-69-59", (1270, 38), 18, "#f7f7f1")
txt("ТЕХНИКА И СВОИ ЛЮДИ", (72, 139), 14, "#3154a1", True)
txt("СЕВЕРОДВИНСК", (1370, 139), 14, "#d9e6ff", True)
txt("айшмот", (845, 174), 100, "#375585", True)
txt("Магазин · Сервис · Trade-in", (72, 365), 18, "#3154a1", True)
txt("Твой лучший", (72, 411), 88, "#111e43", True)
txt("выбор.", (72, 510), 115, "#2851d6", True)
txt("iPhone, компьютеры, аксессуары.", (72, 649), 23, "#465779")
txt("Всё можно посмотреть. Всё можно попробовать.", (72, 683), 23, "#465779")
d.rounded_rectangle((72, 735, 347, 802), radius=34, fill="#2851d6")
txt("Выбрать технику", (111, 755), 21, "white", True)
d.rounded_rectangle((367, 735, 575, 802), radius=34, fill="#e9effb")
txt("Починить свою", (390, 757), 19, "#173b88", True)

screen = Image.open(root / "qa/phone-screen.png").convert("RGBA").resize((280, 616), Image.Resampling.LANCZOS)
phone = Image.new("RGBA", (320, 656))
pd = ImageDraw.Draw(phone)
pd.rounded_rectangle((1, 1, 319, 655), radius=50, fill="#7288af")
pd.rounded_rectangle((5, 3, 315, 651), radius=48, fill="#111b31")
mask = Image.new("L", (280, 616))
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 279, 615), radius=39, fill=255)
phone.paste(screen, (20, 20), mask)
phone = phone.rotate(3, expand=True, resample=Image.Resampling.BICUBIC)
shadow = Image.new("RGBA", im.size)
shadow.paste(Image.new("RGBA", phone.size, (2, 8, 33, 175)), (1044, 195), phone.getchannel("A"))
im = Image.alpha_composite(im.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(38)))
im.alpha_composite(phone, (1044, 195))
d = ImageDraw.Draw(im)
d.rounded_rectangle((1320, 164, 1525, 312), radius=28, fill="#2b4377", outline="#9fb9e0", width=2)
txt("Северодвинск", (1344, 184), 17, "#d9e6ff")
txt("12:00", (1344, 223), 52, "#ffffff", True)
d.line((0, 860, 1600, 860), fill="#7789b9", width=1)
txt("Ломоносова, 85к2   ·   Ежедневно 12–21", (72, 872), 16, "#33496e")
txt("Дальше — ваше", (1390, 872), 16, "#e1eaff")
im.convert("RGB").save(root / "concepts/current-hero/current-hero-guide.png")
