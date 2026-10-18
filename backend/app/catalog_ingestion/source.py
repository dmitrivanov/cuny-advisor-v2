"""Pure, bounded decoding of the official public Bulletin's SSR source format."""

import json
import re
from html import unescape
from html.parser import HTMLParser
from decimal import Decimal


def nuxt_document(html):
    match = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not match:
        raise ValueError("Official source format changed; manual review required")
    values = json.loads(match[1], parse_float=Decimal)
    cache = {}
    visiting = set()

    def resolve(index, depth=0):
        if depth > 80 or not isinstance(index, int):
            raise ValueError("Unsupported source reference")
        if index == -1:
            return None
        if index < 0 or index >= len(values) or index in visiting:
            raise ValueError("Unsupported/cyclic source encoding")
        if index in cache:
            return cache[index]
        visiting.add(index)
        value = values[index]
        if isinstance(value, dict):
            result = {k: resolve(v, depth + 1) for k, v in value.items()}
        elif isinstance(value, list):
            if value and isinstance(value[0], str):
                if value[0] == "Set" and len(value) == 1:
                    result = []
                elif (
                    value[0] in ("Reactive", "ShallowReactive", "Ref", "ShallowRef")
                    and len(value) == 2
                ):
                    result = resolve(value[1], depth + 1)
                else:
                    raise ValueError("Unsupported source tag")
            else:
                result = [resolve(v, depth + 1) for v in value]
        else:
            result = value
        visiting.remove(index)
        cache[index] = result
        return result

    return resolve(0)


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        if tag in ("p", "div", "br", "li"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("p", "div", "li"):
            self.parts.append("\n")


def plain(value):
    parser = Text()
    parser.feed(value or "")
    return unescape("".join(parser.parts)).strip()
