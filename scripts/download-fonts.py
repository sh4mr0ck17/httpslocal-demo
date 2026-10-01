import sys, io, hashlib, urllib.request
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
fonts = {
    'be-vietnam-pro-400': 'https://fonts.gstatic.com/s/bevietnampro/v12/QdVPSTAyLFyeg_IDWvOJmVES_Eww.ttf',
    'be-vietnam-pro-600': 'https://fonts.gstatic.com/s/bevietnampro/v12/QdVMSTAyLFyeg_IDWvOJmVES_HToIV8y.ttf',
    'be-vietnam-pro-800': 'https://fonts.gstatic.com/s/bevietnampro/v12/QdVMSTAyLFyeg_IDWvOJmVES_HSQI18y.ttf',
    'ibm-plex-mono-400': 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n5ig.ttf',
}
output = root / 'assets/fonts'
output.mkdir(parents=True, exist_ok=True)
for name, url in fonts.items():
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    font = TTFont(io.BytesIO(data))
    missing = [c for c in 'Tiếng Việt Đọc ghi chép mật mã ăâêôơưđẤỘỄ' if not c.isspace() and ord(c) not in font.getBestCmap()]
    if missing:
        raise ValueError(f'{name}: thiếu ký tự tiếng Việt {missing}')
    font.flavor = 'woff2'
    dest = output / f'{name}.woff2'
    font.save(dest)
    print(name, dest.stat().st_size, hashlib.sha256(dest.read_bytes()).hexdigest())
for family in ('bevietnampro', 'ibmplexmono'):
    url = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/OFL.txt'
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    (output / f'LICENSE-{family}.txt').write_bytes(data)
    print('Giấy phép:', family, len(data))
