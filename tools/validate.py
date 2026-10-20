# -*- coding: utf-8 -*-
"""校验公开活动内容、统计与相册文件；失败时退出码为 1。无第三方依赖。"""
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class TagCheck(HTMLParser):
    """使用 HTML 解析器忽略脚本/样式中的标签文本，检查页面标签配平。"""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f'line {self.getpos()[0]}: unexpected </{tag}>')


def main():
    errors = []

    def check(condition, message):
        if not condition:
            errors.append(message)

    def read(path):
        return json.loads((ROOT / path).read_text(encoding='utf-8'))

    try:
        data = read('assets/data/activities.json')
        manifest = read('assets/img/gallery/manifest.json')
        articles = read('assets/data/articles.json')
        # 其他 JSON 也必须可解析。
        for path in (ROOT / 'assets/data').glob('*.json'):
            json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        print('FAIL: ' + str(error))
        return 1

    activities = data['activities']
    counts = Counter(a['status'] for a in activities)
    check(len({a['id'] for a in activities}) == len(activities), '活动 id 重复')
    for key, value in [('total', len(activities)), ('done', counts['done']), ('planned', counts['planned'])]:
        check(data['meta'].get(key) == value, f'meta.{key} 与实际活动数不符')

    forbidden = re.compile(r'打车|包车|带队|费用台账|新闻稿\s*48\s*小时|报名制|名额|预算|经费|签到表|参与名单|\d+\s*人|全班')
    for a in activities:
        label = a['id']
        check(a['status'] in ('done', 'planned'), label + ': 状态无效')
        check(a['ch'] in data['meta']['chapters'], label + ': 篇章无效')
        if a['ch'] in data['meta']['chapters']:
            check(a.get('main') == data['meta']['chapters'][a['ch']]['main'], label + ': 主线与篇章不一致')
        check(a.get('href') == 'activity.html?id=' + label, label + ': 详情链接不一致')
        check('count' not in a, label + ': 不应保留参与人数 count 字段')
        for field in ('lead', 'story', 'summary'):
            check(bool(a.get(field)), label + ': 缺少 ' + field)
        public = {k: a.get(k) for k in ('title', 'when', 'tags', 'lead', 'story', 'summary', 'insight')}
        matches = forbidden.findall(json.dumps(public, ensure_ascii=False))
        check(not matches, label + ': 公开文案含内部信息或人数 ' + repr(matches))
        for section in a.get('story', []):
            check(bool(section.get('p')), label + ': 正文分节缺少段落')
        gallery = a.get('gallery')
        if gallery:
            check(gallery in manifest, label + ': 相册不存在 ' + gallery)
            if gallery in manifest:
                check(manifest[gallery]['count'] == a.get('photos'), label + ': 照片数与相册不一致')
        else:
            check(not a.get('photos'), label + ': 没有相册但标有照片数')

    for slug, info in manifest.items():
        photos = info['photos']
        check(len(photos) == info['count'], slug + ': 清单张数不一致')
        check(len(set(photos)) == len(photos), slug + ': 照片文件名重复')
        for filename in photos:
            check(Path(filename).name == filename, slug + ': 照片文件名须为相册内文件')
            for size in ('t', 'f'):
                check((ROOT / 'assets/img/gallery' / slug / size / filename).is_file(),
                      f'{slug}/{size}/{filename}: 文件缺失')

    check(articles['meta']['draftCount'] == len(articles['drafts']), '推文草稿统计不一致')
    check(articles['meta']['totalPlanned'] == len(articles['articles']) + len(articles['drafts']), '推文总计不一致')
    by_id = {a['id']: a for a in activities}
    for item in articles['articles'] + articles['drafts']:
        if item.get('activityId'):
            activity = by_id.get(item['activityId'])
            check(activity is not None, item['title'] + ': 关联活动不存在')
            if activity:
                check(item['chapter'] == activity['ch'], item['title'] + ': 推文分类与活动不一致')
    for path in ROOT.glob('*.html'):
        parser = TagCheck()
        parser.feed(path.read_text(encoding='utf-8'))
        check(not parser.errors and not parser.stack,
              path.name + ': HTML 标签不配平 ' + repr(parser.errors or parser.stack))
    hometowns = read('assets/data/hometowns.json')
    map_html = (ROOT / 'map3d.html').read_text(encoding='utf-8')
    embedded = re.search(r'<script type="application/json" id="rm-geometry">(.*?)</script>', map_html, re.S)
    map_data = json.loads(embedded[1])
    homes = hometowns['homes']
    check(map_data['homes'] == homes, '家乡清单与地图内嵌数据不一致，请运行 tools/sync_hometowns.py')
    check(len(homes) == hometowns['meta']['places'], '家乡地点数不一致')
    check(sum(h['n'] for h in homes) == hometowns['meta']['students'], '家乡人数不一致')
    check(len({h['name'] for h in homes}) == len(homes), '家乡地点重复，请合并人数')
    check(all(isinstance(h['n'], int) and h['n'] > 0 and len(h['p']) == 2 for h in homes), '家乡点位格式错误')
    for name in ('index.html', 'map3d.html'):
        html = (ROOT / name).read_text(encoding='utf-8')
        check(f'<b>{len(homes)}</b><span>个家乡地点</span>' in html, name + ': 家乡地点计数未同步')
    source_sites = read('assets/data/map-locations.json')
    embedded_sites = {s['id']: s for s in map_data['sites']}
    check(len(source_sites) == len(embedded_sites), '地图站点数量与源数据不一致')
    for site in source_sites:
        embedded_site = embedded_sites.get(site['id'], {})
        check(all(embedded_site.get(k) == v for k, v in site.items()), site['id'] + ': 地图站点内容与源数据不一致')
    if errors:
        for error in errors:
            print('FAIL: ' + error)
        return 1
    print(f'OK: {len(activities)} activities ({counts["done"]} done, {counts["planned"]} planned); '
          f'{len(manifest)} albums / {sum(m["count"] for m in manifest.values())} photos; '
          f'{len(articles["articles"])} published / {len(articles["drafts"])} drafts')
    return 0


if __name__ == '__main__':
    sys.exit(main())
