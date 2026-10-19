# -*- coding: utf-8 -*-
"""把已确认的家乡清单同步到独立离线地图，并更新首页/地图的地点数量。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    payload = json.loads((ROOT / 'assets/data/hometowns.json').read_text(encoding='utf-8'))
    homes = payload['homes']
    assert len(homes) == payload['meta']['places'], '家乡地点数量不一致'
    assert sum(h['n'] for h in homes) == payload['meta']['students'], '家乡人数不一致'
    path = ROOT / 'map3d.html'
    html = path.read_text(encoding='utf-8')
    match = re.search(r'(<script type="application/json" id="rm-geometry">)(.*?)(</script>)', html, re.S)
    assert match, '未找到内嵌地图数据'
    # homes 是 JSON 的最后一个字段；只替换它，避免重新序列化庞大的省界数据。
    data = json.loads(match[2])
    assert list(data)[-1] == 'homes', '地图结构已变化，请检查同步脚本'
    offset = match[2].rindex(',"homes":')
    encoded = json.dumps(homes, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    embedded = match[2][:offset] + ',"homes":' + encoded + '}'
    html = html[:match.start(2)] + embedded + html[match.end(2):]
    html = re.sub(r'家乡地点 · \d+', '家乡地点 · ' + str(len(homes)), html)
    pattern = r'<b>\d+</b><span>个家乡地点</span>'
    replacement = f'<b>{len(homes)}</b><span>个家乡地点</span>'
    path.write_text(re.sub(pattern, replacement, html), encoding='utf-8', newline='\n')
    index = ROOT / 'index.html'
    index.write_text(re.sub(pattern, replacement, index.read_text(encoding='utf-8')), encoding='utf-8', newline='\n')
    print(f'OK: {len(homes)} hometown places / {sum(h["n"] for h in homes)} students')


if __name__ == '__main__':
    main()
