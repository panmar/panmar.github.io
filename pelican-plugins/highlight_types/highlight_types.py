import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from pelican import signals

TYPE_RE = re.compile(r'\b(?:u8|u16|u32|u64|i8|i16|i32|i64|usize)\b')

def highlight_text_node(soup, text_node):
    text = str(text_node)
    parent = text_node.parent

    last = 0
    for m in TYPE_RE.finditer(text):
        if m.start() > last:
            text_node.insert_before(
                NavigableString(text[last:m.start()])
            )

        span = soup.new_tag("span", attrs={"class": "typename"})
        span.string = m.group(0)
        text_node.insert_before(span)

        last = m.end()

    if last < len(text):
        text_node.insert_before(
            NavigableString(text[last:])
        )

    text_node.extract()

def process_written_content(path, context):
    if not path.endswith(".html"):
        return

    html_path = Path(path)
    soup = BeautifulSoup(
        html_path.read_text(encoding="utf-8"),
        "html.parser",
    )

    for pre in soup.select("div.highlight pre"):
        for node in list(pre.descendants):
            if isinstance(node, NavigableString) and TYPE_RE.search(node):
                highlight_text_node(soup, node)

    html_path.write_text(str(soup), encoding="utf-8")

def register():
    signals.content_written.connect(process_written_content)
