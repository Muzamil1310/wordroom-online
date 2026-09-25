#!/usr/bin/env python3
"""Generates the WordRoom static pages. Mirrors what Astro will do in the real build."""
import json, pathlib, html
from datetime import datetime
from translations import LANGUAGES, UI, GROUPS as _GROUPS_T, HOME, TOOLS_T, FAQS_T, REFS_T, PAGES_T

OUT = pathlib.Path(__file__).parent
SITE = "WordRoom"
BASE = "https://wordroomonline.com"

def u(locale, key):
    """Get a UI chrome string for the given locale."""
    return UI.get(locale, UI["en"]).get(key, UI["en"][key])

def grp(locale, en_name):
    """Translate a group name."""
    return _GROUPS_T.get(locale, _GROUPS_T["en"]).get(en_name, en_name)

LOGO_TPL = '<img width="22" height="22" src="{asset_path}/favicon.svg" alt="" aria-hidden="true">'

ICONS = {
    "count": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h13"/></svg>',
    "case": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18 9 6l5 12M5.8 14h6.4M17 10v8M21 12.5a2.5 2.5 0 1 0-4 2"/></svg>',
    "gauge": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 17a9 9 0 1 1 17 0"/><path d="M12 17l4-5"/></svg>',
    "wrap": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h11a3 3 0 1 1 0 6h-2M4 18h4"/><path d="m14 15-2 3 2 3" transform="translate(0,-3)"/></svg>',
    "sort": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h9M4 12h6M4 18h3M17 4v16M17 20l3-3M17 20l-3-3"/></svg>',
    "dedupe": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="12" height="12" rx="2.5"/><path d="M9 21h9a2.5 2.5 0 0 0 2.5-2.5V9"/></svg>',
    "code": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>',
    "lock": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    "hash": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 8 21M16 3l-2 18M4 9h17M3 15h17"/></svg>',
    "link": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"/></svg>',
    "shield": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
}

TOOLS = [
    dict(slug="word-counter", nav="Word counter", icon="count", group="Count",
         h1="Word counter", eyebrow="Count",
         title="Free Online Word Counter — Count Words, Characters & Sentences Instantly",
         desc="Free online word counter and character counter. Count words, characters, sentences and paragraphs as you type. Perfect for essays, articles and student assignments. Handles Telugu, Hindi and CJK correctly, and can exclude citations and reference lists for academic word limits.",
         lede="Live counts as you type, with academic exclusions and correct segmentation for Indic and CJK scripts.",
         ph="Paste or write your text here. Counts update as you type, and nothing is sent anywhere."),
    dict(slug="case-converter", nav="Case converter", icon="case", group="Convert",
         h1="Case converter", eyebrow="Convert",
         title="Case Converter — Title Case, Sentence Case & 12 More",
         desc="Convert text between title case, sentence case, UPPERCASE, camelCase, snake_case and more. Title case follows real AP and Chicago rules instead of capitalising every word.",
         lede="Thirteen conversions, with title case that follows actual style-guide rules rather than capitalising everything.",
         ph="Paste the text you want to convert. Try a headline with short prepositions in it."),
    dict(slug="readability-checker", nav="Readability checker", icon="gauge", group="Analyse",
         h1="Readability checker", eyebrow="Analyse",
         title="Readability Checker — Flesch Reading Ease & Grade Level",
         desc="Score your writing with Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau and ARI. Shows which sentences are dragging the score down.",
         lede="Six formulas, plus the specific sentences holding your score back — not just a number.",
         ph="Paste a paragraph or a full draft. You need at least one complete sentence to score."),
    dict(slug="remove-line-breaks", nav="Remove line breaks", icon="wrap", group="Clean up",
         h1="Remove line breaks", eyebrow="Clean up",
         title="Remove Line Breaks — Fix Text Pasted from PDFs",
         desc="Strip unwanted line breaks from text copied out of PDFs and emails while keeping real paragraph breaks intact. Also trims lines and collapses double spaces.",
         lede="Join lines broken by a PDF column or an email client, while keeping genuine paragraph breaks.",
         ph="Paste text where every line ends early — typically copied out of a PDF or an email."),
    dict(slug="sort-lines", nav="Sort lines", icon="sort", group="Clean up",
         h1="Sort lines", eyebrow="Clean up",
         title="Sort Lines Alphabetically — Online Line Sorter",
         desc="Sort any list of lines alphabetically, by length, in reverse or shuffled. Supports natural number ordering and locale-aware alphabetising for non-English lists.",
         lede="Alphabetise, sort by length, reverse or shuffle — with natural number ordering and locale-aware collation.",
         ph="One item per line.\nPaste your list here.\nIt sorts as you go."),
    dict(slug="remove-duplicate-lines", nav="Remove duplicate lines", icon="dedupe", group="Clean up",
         h1="Remove duplicate lines", eyebrow="Clean up",
         title="Remove Duplicate Lines — Find & Delete Repeats",
         desc="Find and remove duplicate lines from any list. Choose whether case and surrounding whitespace count, and inspect which values repeat before you delete anything.",
         lede="Find repeats before you delete them, with control over whether case and whitespace count as a difference.",
         ph="Paste a list with duplicates in it — email addresses, keywords, IDs."),
    dict(slug="base64-encoder-decoder", nav="Base64 encoder / decoder", icon="code", group="Encode",
         h1="Base64 encoder / decoder", eyebrow="Encode",
         title="Base64 Encoder & Decoder — Encode or Decode Text Online",
         desc="Encode text to Base64 or decode Base64 back to text directly in your browser. Unicode-safe, private and free with no upload or account.",
         lede="Encode ordinary text to Base64 or decode Base64 back to readable text — entirely in your browser.",
         ph="Enter the text or Base64 string you want to convert."),
    dict(slug="url-encoder-decoder", nav="URL encoder / decoder", icon="link", group="Encode",
         h1="URL encoder / decoder", eyebrow="Encode",
         title="URL Encoder & Decoder — Encode URLs and Query Strings Online",
         desc="Encode or decode URL text and query-string components online. Choose URI or component mode and process everything locally in your browser.",
         lede="Safely encode URL components or decode percent-encoded text without sending it anywhere.",
         ph="Paste a URL, query string, or percent-encoded text here."),
    dict(slug="regex-tester", nav="Regex tester", icon="code", group="Developer",
         h1="Regex tester", eyebrow="Developer",
         title="Regex Tester — Test Regular Expressions Online",
         desc="Test JavaScript regular expressions against your text in real time. See matches, capture groups, match counts and regex errors directly in your browser.",
         lede="Write a JavaScript regex, test it against your text, and inspect every match and capture group instantly.",
         ph="Paste the text you want your regular expression to test."),
    dict(slug="password-generator", nav="Password generator", icon="lock", group="Generate",
         h1="Password generator", eyebrow="Generate",
         title="Password Generator — Create Strong Random Passwords",
         desc="Generate strong random passwords using your browser's cryptographic random generator. Choose length and character sets. Nothing is uploaded.",
         lede="Generate strong random passwords locally with cryptographic randomness and controls for length and character sets.",
         ph="Generated passwords will appear here. You can also type your own text."),
    dict(slug="json-formatter", nav="JSON formatter", icon="code", group="Developer",
         h1="JSON formatter", eyebrow="Developer",
         title="JSON Formatter — Pretty Print JSON Online",
         desc="Format and pretty-print JSON with adjustable indentation. Invalid JSON is explained with an error instead of silently changing your data.",
         lede="Turn compact or messy JSON into clean, readable formatted JSON with one click.",
         ph='Paste JSON here, for example: {"name":"WordRoom","free":true}'),
    dict(slug="json-validator", nav="JSON validator", icon="shield", group="Developer",
         h1="JSON validator", eyebrow="Developer",
         title="JSON Validator — Check JSON Syntax Online",
         desc="Validate JSON syntax instantly in your browser and get a useful error message when the input is invalid. No upload or account required.",
         lede="Check whether JSON is valid and get a clear syntax error when it is not.",
         ph='Paste JSON here, for example: {"name":"WordRoom"}'),
    dict(slug="json-minifier", nav="JSON minifier", icon="code", group="Developer",
         h1="JSON minifier", eyebrow="Developer",
         title="JSON Minifier — Compress JSON Online",
         desc="Minify valid JSON by removing unnecessary whitespace while preserving its data. Runs entirely in your browser.",
         lede="Remove unnecessary JSON whitespace to produce a compact payload ready for APIs and configuration files.",
         ph='Paste formatted JSON here, for example: {"name": "WordRoom"}'),
    dict(slug="jwt-decoder", nav="JWT decoder", icon="shield", group="Developer",
         h1="JWT decoder", eyebrow="Developer",
         title="JWT Decoder — Decode JSON Web Tokens Online",
         desc="Decode the header and payload of a JSON Web Token locally in your browser. The tool does not verify signatures and does not send your token to a server.",
         lede="Inspect a JWT's header and payload locally. Signature verification is intentionally not performed.",
         ph="Paste a JWT such as eyJhbGciOi... here."),
    dict(slug="uuid-generator", nav="UUID generator", icon="hash", group="Generate",
         h1="UUID generator", eyebrow="Generate",
         title="UUID Generator — Generate Random UUID v4 Values",
         desc="Generate random UUID version 4 identifiers using your browser's cryptographic random source. Create one or multiple UUIDs instantly.",
         lede="Generate random UUID v4 identifiers locally with a cryptographically secure random source.",
         ph="Generated UUIDs will appear here."),
    dict(slug="hash-generator", nav="Hash generator", icon="hash", group="Developer",
         h1="Hash generator", eyebrow="Developer",
         title="Hash Generator — SHA-1, SHA-256, SHA-384 & SHA-512",
         desc="Generate SHA-1, SHA-256, SHA-384 or SHA-512 hashes from text using the browser Web Crypto API. Your input never leaves the browser.",
         lede="Generate standard SHA hashes from text locally using your browser's built-in cryptography API.",
         ph="Enter the text you want to hash."),
    dict(slug="slug-generator", nav="Slug generator", icon="link", group="Convert",
         h1="Slug generator", eyebrow="Convert",
         title="Slug Generator — Create SEO-Friendly URL Slugs",
         desc="Convert titles and text into clean, URL-friendly slugs. Lowercase text, remove unnecessary punctuation and replace spaces with hyphens.",
         lede="Turn titles and phrases into clean, lowercase, URL-friendly slugs in one click.",
         ph="Example: 10 Best Websites to Learn Web Development in 2026"),
]

EN_GROUPS = ["Count", "Convert", "Analyse", "Clean up", "Encode", "Developer", "Generate"]

# ------------------------------------------------------------------ content
REFS = {
"word-counter": [
 ("How word counting actually works", """
<p>A word counter has to decide where one word ends and the next begins. For English that looks trivial — split on spaces — which is why almost every online counter does exactly that, and why almost every one of them is wrong for a large part of the world.</p>
<p>Splitting on whitespace fails immediately outside the Latin script. Chinese and Japanese do not put spaces between words. Thai does not either. Telugu, Hindi and Tamil use spaces, but they also use combining marks that naive counters miscount as separate characters. This tool uses the browser's built-in Unicode segmentation instead, which applies the proper word-boundary rules for the script it detects.</p>
<p>Character counting has the same trap. The JavaScript expression <code>"నమస్తే".length</code> returns 6, because it counts UTF-16 code units rather than characters a reader would recognise. A single emoji can return 2, and a flag emoji 4. This tool counts grapheme clusters, so the number matches what you would get by counting on screen.</p>
"""),
 ("Word limits and what your marker counts", """
<p>Academic word limits are the most common reason people reach for a counter, and the number your word processor reports is frequently not the number that will be marked. Institutions differ, but the usual pattern is that the body text counts and the scaffolding does not.</p>
<table><thead><tr><th>Element</th><th>Commonly counted</th></tr></thead><tbody>
<tr><td>Body paragraphs</td><td>Yes</td></tr>
<tr><td>In-text citations, e.g. (Smith, 2020)</td><td>Often excluded</td></tr>
<tr><td>Reference list or bibliography</td><td>Almost always excluded</td></tr>
<tr><td>Footnotes and endnotes</td><td>Varies — check your handbook</td></tr>
<tr><td>Headings and subheadings</td><td>Varies</td></tr>
<tr><td>Block quotations</td><td>Usually counted</td></tr>
<tr><td>Tables, figures and captions</td><td>Usually excluded</td></tr>
<tr><td>Abstract, title page, appendices</td><td>Usually excluded</td></tr>
</tbody></table>
<p>Academic mode lets you switch each of these off and shows both the raw and the countable total, so you can match whatever your handbook specifies rather than guessing. Where a rule is ambiguous, the handbook wins — this tool models the common conventions, not your specific institution's policy.</p>
"""),
 ("Reading and speaking time", """
<p>Reading time here uses 238 words per minute, the mean silent reading rate for English prose found in Brysbaert's 2019 meta-analysis of 190 studies. Many sites use 200 or 250 without saying where the figure came from; the difference on a 3,000-word piece is over two minutes.</p>
<p>Speaking time uses 130 words per minute, which is deliberately slower than conversational speech. Presenters read prepared text faster than they should when nervous, and rehearsal timings that assume 150 words per minute tend to leave people over-running. If you are timing a speech, treat the figure as a floor and rehearse aloud.</p>
<p>Both figures are averages across readers and text types. Dense technical prose reads slower; familiar narrative reads faster.</p>
"""),
 ("Use this word counter for essays, articles and assignments", """
<p>Whether you are writing a university essay, a blog article or a professional report, this free word counting tool gives you an accurate count in real time. Students use it to stay within assignment word limits; journalists use it to hit article targets; academics use it to check thesis chapters against departmental requirements.</p>
<p>Paste your text and the counter updates instantly — no button to press, no page to reload. The character counter runs alongside the word counter, so you always see both totals. For essays with strict word limits, switch on Academic mode to exclude citations, reference lists and footnotes from the countable total.</p>
"""),
 ("Word and character counter with live results", """
<p>This word and character counter gives you both totals simultaneously as you type. The word count uses Unicode word-boundary rules, so it works correctly for English, Chinese, Japanese, Hindi, Telugu and every other script. The character count uses grapheme clusters, so a flag emoji counts as one character, not four.</p>
<p>For articles and blog posts, the reading time estimate tells you how long your piece will take to read. For speeches, the speaking time estimate gives you a rehearsal baseline at 130 words per minute.</p>
"""),
],
"case-converter": [
 ("Title case is a style decision, not a rule", """
<p>Most case converters implement title case as "capitalise the first letter of every word." No style guide actually says that. Every major guide lowercases certain short words unless they fall first or last in the title, and they disagree about which words qualify.</p>
<p>AP style lowercases articles, coordinating conjunctions and prepositions of three letters or fewer. Chicago lowercases all prepositions regardless of length, along with articles and coordinating conjunctions. The practical result is that the same headline is capitalised differently depending on which guide you are writing for.</p>
<table><thead><tr><th>Style</th><th>Result</th></tr></thead><tbody>
<tr><td>Naive converter</td><td>The Guide To SEO For Small Businesses</td></tr>
<tr><td>AP</td><td>The Guide to SEO for Small Businesses</td></tr>
<tr><td>Chicago</td><td>The Guide to SEO for Small Businesses</td></tr>
</tbody></table>
<p>Hyphenated compounds are the other place converters fail. "state-of-the-art" should become "State-of-the-Art" — the first element capitalised, minor words inside the compound left alone. Splitting only on spaces gives you "State-of-the-art", which is wrong in both AP and Chicago.</p>
"""),
 ("Sentence case, and why lowercase first is wrong", """
<p>Sentence case means capitalising the first word of each sentence and leaving the rest alone. The naive implementation lowercases everything and then capitalises character zero, which destroys proper nouns and gives you one capital across an entire multi-sentence paragraph.</p>
<p>This tool segments the text into sentences using Unicode sentence-boundary rules, then capitalises the first letter of each. That handles abbreviations like "e.g." and "Dr." far better than splitting on full stops, and it works for Devanagari danda (।) and other non-Latin sentence terminators. The standalone English pronoun "I" is restored afterwards.</p>
<p>Proper nouns are still a genuine limitation: no offline tool can reliably tell that "paris" should be "Paris" without a named-entity model, and running one would mean sending your text to a server. The honest answer is that sentence case gets you most of the way and you check the nouns.</p>
"""),
 ("Programmer cases", """
<p>The developer conversions — camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, dot.case — all work by tokenising the input first rather than just replacing separators. That means <code>myXMLParser</code> tokenises to <code>my / XML / Parser</code> and converts to <code>my_xml_parser</code>, instead of the <code>my_x_m_l_parser</code> that a character-level approach produces.</p>
<ul>
<li><strong>camelCase</strong> — JavaScript variables and functions</li>
<li><strong>PascalCase</strong> — classes and React components</li>
<li><strong>snake_case</strong> — Python, Ruby, SQL columns</li>
<li><strong>CONSTANT_CASE</strong> — environment variables and constants</li>
<li><strong>kebab-case</strong> — URLs, CSS classes, file names</li>
</ul>
"""),
],
"readability-checker": [
 ("What the score means", """
<p>Flesch Reading Ease maps text to a 0–100 scale, where higher is easier. It is built from two inputs only: average sentence length and average syllables per word. That simplicity is both its strength and its ceiling — it is stable and reproducible, but it cannot tell whether your argument makes sense.</p>
<table><thead><tr><th>Score</th><th>Reads as</th><th>Audience</th></tr></thead><tbody>
<tr><td>90–100</td><td>Very easy</td><td>5th grade</td></tr>
<tr><td>80–89</td><td>Easy</td><td>6th grade</td></tr>
<tr><td>70–79</td><td>Fairly easy</td><td>7th grade</td></tr>
<tr><td>60–69</td><td>Plain English</td><td>8th–9th grade</td></tr>
<tr><td>50–59</td><td>Fairly difficult</td><td>10th–12th grade</td></tr>
<tr><td>30–49</td><td>Difficult</td><td>College</td></tr>
<tr><td>Below 30</td><td>Very difficult</td><td>College graduate</td></tr>
</tbody></table>
<p>For general web writing, aim for 60 or above. Plain-language guidance in government and healthcare often targets 60–70. Technical documentation for a specialist audience sitting at 40 is not a failure; the audience has the vocabulary.</p>
"""),
 ("The six formulas, and where they disagree", """
<p>All six formulas here are pure arithmetic over sentence length, word length and syllable counts. They were developed for different purposes and will not agree with each other, which is a feature rather than a bug — a wide spread tells you the text is uneven.</p>
<ul>
<li><strong>Flesch–Kincaid Grade</strong> — the same inputs as Reading Ease, expressed as a US school grade.</li>
<li><strong>Gunning Fog</strong> — weights polysyllabic words heavily. Punishes jargon.</li>
<li><strong>SMOG</strong> — designed for health materials; considered reliable on short passages.</li>
<li><strong>Coleman–Liau</strong> — uses letter counts rather than syllables, so it avoids syllable-estimation error.</li>
<li><strong>Automated Readability Index</strong> — characters per word plus sentence length.</li>
</ul>
<p>Syllable counting is the weak link. English orthography does not map cleanly to syllables, so every implementation uses heuristics and every implementation is wrong on some words. Coleman–Liau sidesteps this by counting letters, which is why it is worth reading alongside the others rather than in isolation.</p>
"""),
 ("Fix sentences, not words", """
<p>Because sentence length is one of only two inputs, splitting long sentences moves the score more than any amount of synonym substitution. A 45-word sentence broken into three costs you nothing in meaning and can shift Reading Ease by ten points or more.</p>
<p>This is why the panel lists your hardest individual sentences rather than only showing a total. A single 60-word sentence in an otherwise clear page will drag the average down and is invisible in a document-level score. Fix the outliers first, then look at vocabulary.</p>
<p>Passive-voice detection here is a regex heuristic — a form of "to be" followed by something that looks like a past participle. It over-flags. Treat the count as a prompt to reread, not a verdict.</p>
"""),
],
"remove-line-breaks": [
 ("Why PDF text pastes broken", """
<p>A PDF does not store paragraphs. It stores glyphs at coordinates. When you select text in a PDF viewer and copy it, the viewer reconstructs a reading order and inserts a line break wherever the visual line ended — which is the edge of the column, not the end of the sentence. Paste that into a document and every line stops early.</p>
<p>Email clients cause the same problem differently. Plain-text email traditionally hard-wraps at around 72 characters, so forwarded text arrives pre-broken. Code editors with a fixed ruler do it too.</p>
<p>The fix is to distinguish two kinds of break. A single newline inside a paragraph is an artefact and should become a space. A blank line between paragraphs is meaningful and should survive. "Keep paragraph breaks" does exactly that; switch it off only when you genuinely want everything on one line.</p>
"""),
 ("The cleanup order that works", """
<p>When text arrives badly formatted, the order of operations matters. Running these in the wrong sequence leaves seams behind.</p>
<ol>
<li><strong>Remove invisible characters</strong> first. Zero-width spaces and byte-order marks survive most other operations and break search later.</li>
<li><strong>Trim each line</strong>, so trailing spaces do not become double spaces when lines join.</li>
<li><strong>Remove the line breaks</strong>, keeping paragraph breaks.</li>
<li><strong>Collapse extra spaces</strong> to tidy the joins.</li>
<li><strong>Remove empty lines</strong> last, once you can see the real structure.</li>
</ol>
<p>Hyphenation is the case this tool deliberately does not guess at. PDFs often break a word across lines with a hyphen. Rejoining "compre-" and "hension" automatically would also destroy genuine hyphens in "state-of-the-art", so the safe behaviour is to leave them and let you search for remaining hyphens yourself.</p>
"""),
],
"sort-lines": [
 ("Alphabetical is not one thing", """
<p>Sorting looks like a solved problem until you sort real data. A naive sort compares code points, which puts every capital letter before every lowercase one — so "Zebra" sorts before "apple", and a list of names comes out in an order no human would call alphabetical.</p>
<p>This tool uses locale-aware collation instead, which is the same machinery your operating system uses to sort a file listing. Accented characters sort next to their base letters rather than at the end, and case is ignored by default because that is what people mean by alphabetical.</p>
<p>Natural number ordering is the other common surprise. Compared as text, "item 10" sorts before "item 2", because "1" is less than "2". Natural ordering compares the numeric runs as numbers, giving item 1, item 2, item 10. Leave it on for anything with numbers in it.</p>
"""),
 ("Sort modes", """
<ul>
<li><strong>Alphabetical</strong> — locale-aware, case-insensitive by default. Turn on Descending for Z to A.</li>
<li><strong>By line length</strong> — shortest first, ties broken alphabetically. Useful for spotting outliers in a list of keywords or headlines.</li>
<li><strong>Reverse current order</strong> — flips the list without sorting it, which is what you usually want for a chronological log.</li>
<li><strong>Shuffle</strong> — a Fisher–Yates shuffle, so every ordering is equally likely. Naive shuffles using a random comparator are biased.</li>
</ul>
<p>Empty lines are dropped by default, since a sorted list with a block of blanks at one end is rarely what anyone wants. Switch it off if the blank lines carry meaning.</p>
"""),
],
"remove-duplicate-lines": [
 ("What counts as a duplicate", """
<p>Deduplication is only well-defined once you decide what "the same" means, and the defaults matter more than the algorithm. Three questions decide the answer.</p>
<p><strong>Does case matter?</strong> For email addresses, no — the local part is technically case-sensitive but effectively never treated that way, so <code>Hello@example.com</code> and <code>hello@example.com</code> are the same address. For passwords or IDs, case absolutely matters. Default here is case-insensitive.</p>
<p><strong>Does surrounding whitespace matter?</strong> Almost never. A line with a trailing space is the same value as one without, and lists copied out of spreadsheets are full of them. Default is to trim before comparing.</p>
<p><strong>Which copy survives?</strong> This tool keeps the first occurrence and preserves the original order of what remains, so your list is not silently re-sorted. If you want it sorted too, that is a separate action.</p>
"""),
 ("Inspect before you delete", """
<p>The default behaviour of most dedupe tools is to hand back a shorter list and tell you nothing about what went missing. That is fine when you trust the input and risky when you do not — a stray leading space or an unexpected case difference can mean the tool removed something you needed, or kept something you thought was a duplicate.</p>
<p>The panel shows how many lines were removed, how many distinct values repeated, and which values repeated most, before you apply anything. "Keep only the duplicates" inverts the operation so you can look at exactly what is repeating — useful for auditing a mailing list or finding accidental copy-paste in a keyword set.</p>
"""),
],
}

FAQS = {
"word-counter": [
 ("Does the word count include citations and references?",
  "It depends on your institution, and the tool lets you match either convention. Reference lists are almost always excluded from a stated word limit; in-text citations are excluded by many but not all universities. Switch on the relevant exclusions in Academic mode and compare the raw and countable totals. Your course handbook is the authority."),
 ("Is my text uploaded anywhere?",
  "No. Every calculation runs in your browser using JavaScript. There is no server that receives your text, no account, and no analytics on what you type. You can confirm this by opening your browser's network tab — nothing is sent after the page itself loads."),
 ("Why does the character count differ from Microsoft Word?",
  "Word counts UTF-16 code units in some contexts, which inflates the count for emoji, Indic scripts and other characters outside the basic Latin range. This tool counts grapheme clusters — characters as a reader perceives them. For plain English text the two agree."),
 ("How is reading time calculated?",
  "Words divided by 238 words per minute, the mean silent reading rate for English prose from Brysbaert's 2019 meta-analysis. Speaking time uses a deliberately conservative 130 words per minute."),
 ("Does it count words in Telugu or Hindi correctly?",
   "Yes. The tool detects the script and applies Unicode word-boundary rules for it rather than splitting on spaces, so combining marks and conjuncts are handled properly. Mixed-script documents are counted with the rules for the dominant non-Latin script."),
 ("How do I count words in text online?",
   "Paste your text into the editor above. The word count, character count, sentence count and paragraph count all update live as you type. Nothing is sent to a server — every calculation happens in your browser."),
 ("Is this a free word counting tool?",
   "Yes. The tool is completely free with no sign-up and no file upload limit. All processing happens locally in your browser."),
 ("Can I use this as an essay word count checker?",
   "Yes. Paste your essay into the editor and the word count updates in real time. Switch on Academic mode to exclude citations and reference lists from the countable total, matching your institution's conventions."),
 ("How does the online text analyzer work?",
   "The tool uses Unicode segmentation rules to count words correctly across all scripts — English, Chinese, Japanese, Hindi, Telugu and more. It counts grapheme clusters for character counting, so emoji and combining marks are handled properly."),
],
"case-converter": [
 ("What is the difference between title case and capitalise each word?",
  "Capitalise Each Word capitalises everything. Title case follows a style guide, which lowercases short articles, conjunctions and prepositions unless they are the first or last word. \"The Guide to SEO for Small Businesses\" is title case; \"The Guide To SEO For Small Businesses\" is not."),
 ("Which title case style should I use?",
  "AP style for journalism, press releases and most web headlines. Chicago for books, academic writing and formal publishing. If nobody has told you, AP is the safer default for online content."),
 ("Will sentence case break my proper nouns?",
  "It can. Sentence case lowercases the text before recapitalising each sentence start, so names of people and places lose their capitals. No offline tool can reliably identify proper nouns without a language model, and running one would mean sending your text to a server. Check names afterwards."),
 ("Does it handle hyphenated words correctly?",
  "Yes. \"state-of-the-art\" becomes \"State-of-the-Art\" — the leading element capitalised and minor words inside the compound left lowercase, which is what AP and Chicago both specify."),
],
"readability-checker": [
 ("What is a good Flesch Reading Ease score?",
  "For general web writing, 60 or above. Plain-language standards in government and healthcare typically target 60 to 70. Technical documentation for specialists often sits in the 40s, which is appropriate for that audience. Below 30 is heavy going for almost anyone."),
 ("Why do the formulas give different grade levels?",
  "They were built for different purposes and weight their inputs differently — Gunning Fog punishes polysyllabic words heavily, Coleman-Liau uses letter counts instead of syllables, SMOG was designed for short health passages. A wide spread between them usually means the text is uneven rather than that one formula is wrong."),
 ("How accurate is the syllable counting?",
  "It is a heuristic, as it is in every implementation of these formulas. English spelling does not map cleanly to syllables, so some words are miscounted. This affects every readability tool equally. Coleman-Liau avoids the problem by counting letters, which is why it is worth reading alongside the syllable-based scores."),
 ("How do I improve my score fastest?",
  "Split your longest sentences. Sentence length is one of only two inputs to Flesch Reading Ease, so breaking a 45-word sentence into three moves the score more than any vocabulary change. The panel lists your hardest sentences for exactly this reason."),
],
"remove-line-breaks": [
 ("Why does text copied from a PDF have breaks everywhere?",
  "A PDF stores glyph positions, not paragraphs. When you copy, the viewer inserts a line break wherever the visual line ended — the edge of the column, not the end of the sentence. The structure was never in the file to begin with."),
 ("Will it destroy my paragraph breaks?",
  "Not with \"Keep paragraph breaks\" on, which is the default. Single newlines inside a paragraph become spaces; blank lines between paragraphs survive. Switch it off only when you deliberately want everything on one line."),
 ("Does it rejoin words hyphenated across lines?",
  "No, deliberately. Rejoining \"compre-\" and \"hension\" would also destroy genuine hyphens in words like \"state-of-the-art\", and there is no reliable way to tell the two apart without a dictionary. Search for remaining hyphens after cleaning."),
],
"sort-lines": [
 ("Why did my list sort with capitals first?",
  "That happens with tools that compare raw character codes, where every uppercase letter precedes every lowercase one. This tool uses locale-aware collation and ignores case by default, so you get the ordering a person would expect. Switch on Case sensitive if you need the strict version."),
 ("Why does item 10 come before item 2?",
  "Compared as text, \"1\" is less than \"2\", so \"item 10\" sorts first. Turn on Natural number order to compare the numeric runs as numbers, which gives item 1, item 2, item 10. It is on by default."),
 ("Is the shuffle actually random?",
  "It uses a Fisher-Yates shuffle, where every possible ordering is equally likely. Shuffling by passing a random comparator to a sort function is a common shortcut and produces measurably biased results."),
],
"remove-duplicate-lines": [
 ("Does it keep the first or the last copy?",
  "The first, and the order of the remaining lines is preserved. Your list is not silently re-sorted. If you want it sorted as well, use the separate \"Also sort the result\" action."),
 ("Are lines that differ only in case duplicates?",
  "By default yes, which is usually right for email addresses and keywords. Switch on Case sensitive when case is meaningful, as it is for passwords, IDs and code."),
 ("Can I see the duplicates before removing them?",
  "Yes. The panel lists how many lines repeat and which values repeat most as you type, and \"Keep only the duplicates\" inverts the operation so you can inspect exactly what is repeating."),
],
"base64-encoder-decoder": [
 ("Is Base64 encryption?", "No. Base64 is reversible encoding, not encryption. Anyone who has the encoded value can decode it."),
 ("What is Base64 used for?", "Base64 is commonly used to represent binary data as text in places such as JSON, email content and data URLs. It increases the size of the encoded data, so it is not compression."),
 ("Is Base64 safe for passwords or secrets?", "No. Base64 does not protect secrets. Do not treat a Base64-encoded password, API key or token as confidential merely because it is encoded."),
 ("Does this tool support Unicode text?", "Yes. Text is encoded as UTF-8 before Base64 conversion, so characters such as emoji, Hindi, Chinese and other Unicode text can be encoded and decoded correctly."),
],
"url-encoder-decoder": [
 ("What does URL encoding do?", "URL encoding percent-escapes characters that have special meaning or are not safe in a URL component. For example, a space can become <code>%20</code>."),
 ("What is the difference between URI and component encoding?", "Component mode is suited to individual query parameters or fragments. URI mode is intended for a complete URI and preserves characters that are normally valid within it."),
 ("Should I encode an entire URL or only a parameter?", "Usually encode individual parameter values rather than the entire URL. Encoding the full URL can also encode separators such as <code>?</code>, <code>&</code> and <code>=</code> that define its structure."),
 ("Does URL encoding encrypt my data?", "No. Percent-encoding is reversible formatting, not encryption. Anyone can decode an encoded URL or parameter."),
],
"regex-tester": [
 ("What regex syntax does this tester use?", "This tester uses the JavaScript regular-expression engine available in your browser, including common flags such as <code>g</code>, <code>i</code>, <code>m</code>, <code>s</code>, <code>u</code> and <code>y</code>."),
 ("What does the global g flag do?", "The <code>g</code> flag tells JavaScript to find multiple matches instead of stopping after the first match. The tester lists each match and its character index."),
 ("Can I see capture groups?", "Yes. When your pattern contains capturing parentheses, the tester shows the captured group values beneath the full match."),
 ("Does the tester send my text anywhere?", "No. Matching happens locally in your browser. Your test text and regular expression are processed on the device running the page."),
],
"password-generator": [
 ("How are passwords generated?", "The generator uses the browser's cryptographic random-number source rather than a predictable pseudo-random sequence. The selected character sets are sampled locally."),
 ("How long should a generated password be?", "Longer passwords generally provide more possible combinations. A unique password of 16 or more characters is a practical starting point for many accounts, subject to the service's own limits."),
 ("Should I reuse a generated password?", "No. Use a unique password for each important account and store it in a reputable password manager rather than reusing the same password."),
 ("Are generated passwords sent to a server?", "No. Generation happens in your browser using the Web Crypto API. The password is not uploaded by the generator."),
],
"json-formatter": [
 ("Does formatting change my JSON data?", "For valid JSON, formatting changes whitespace only. The tool parses the JSON and serializes it again with the indentation you choose."),
 ("What indentation options are available?", "You can format JSON with 1, 2 or 4 spaces, or with tabs. Choose the style that best fits your project or coding convention."),
 ("Why does the formatter reject my JSON?", "The input must follow JSON syntax. Common problems include single-quoted strings, missing commas, trailing commas and unquoted property names."),
 ("Does JSON formatting upload my data?", "No. Parsing and formatting happen locally in your browser, so the JSON you paste is not sent to a server by the tool."),
],
"json-validator": [
 ("What does valid JSON mean?", "Valid JSON follows the JSON syntax rules: strings use double quotes, objects and arrays are correctly structured, and values use valid JSON types such as strings, numbers, booleans and null."),
 ("Can a JSON value be just a number or true?", "Yes. A JSON document can have a primitive root value such as <code>123</code>, <code>true</code>, <code>false</code> or <code>null</code>, as well as an object or array."),
 ("Why is my JSON invalid?", "Common causes include single quotes, missing commas or brackets, trailing commas, unquoted keys and comments. JSON is stricter than JavaScript object-literal syntax."),
 ("Is validation performed locally?", "Yes. The validator uses the browser's built-in JSON parser, so the JSON you enter is processed locally."),
],
"json-minifier": [
 ("What does JSON minification remove?", "It removes unnecessary whitespace such as indentation, spaces and line breaks while keeping the JSON data intact."),
 ("Does minifying JSON change the data?", "For valid JSON, minification changes formatting rather than the parsed data. The resulting JSON contains the same values and structure."),
 ("Why does the minifier reject my JSON?", "The input must first be valid JSON. Missing commas, trailing commas, single quotes and unquoted keys are common causes of errors."),
 ("When should I minify JSON?", "Minified JSON is useful when reducing payload size matters, such as API responses, configuration embedded in pages or data transferred over a network."),
],
"jwt-decoder": [
 ("Does decoding a JWT verify it?", "No. Decoding only reads the token's encoded header and payload. A decoded JWT is not proof that its signature is valid or that its claims should be trusted."),
 ("What parts of a JWT can this tool decode?", "The tool decodes the header and payload segments. It does not attempt to reverse the signature or verify the token against a signing key."),
 ("Is my JWT uploaded?", "No. The token is decoded in your browser. For security, only paste tokens into tools you trust and avoid exposing live credentials unnecessarily."),
 ("Can I use a decoded JWT as proof of authentication?", "No. Decoding reveals claims but does not establish that the token was signed by the expected issuer or that the claims are trustworthy. Verification requires the appropriate key and validation rules."),
],
"uuid-generator": [
 ("What type of UUID is generated?", "The generator creates random version 4 UUIDs. The version and variant bits are set according to the UUID format."),
 ("How many UUIDs can I generate?", "You can generate 1, 5, 10 or 20 UUID v4 values at a time, with each value generated independently in the browser."),
 ("Are the UUIDs generated randomly?", "Yes. The generator uses the browser's cryptographic random source, including <code>crypto.randomUUID()</code> where available."),
 ("Are generated UUIDs sent to a server?", "No. UUID generation happens locally in your browser and does not require an API, account or upload."),
],
"hash-generator": [
 ("Which hash algorithms are available?", "You can generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes using the browser's Web Crypto API."),
 ("Can a hash be decoded?", "A cryptographic hash is designed to be one-way. You can compare a newly generated hash with a known value, but there is no general decode operation that recovers the original input."),
 ("What is a hash used for?", "Hashes are commonly used for integrity checks, fingerprints and other applications where you need a deterministic digest of data. The appropriate algorithm depends on the use case."),
 ("Should I use SHA-1 for passwords?", "No. SHA-1 is not an appropriate password-storage algorithm. Password storage should use a dedicated password-hashing scheme such as Argon2, scrypt or bcrypt with appropriate parameters."),
],
"slug-generator": [
 ("What is a URL slug?", "A slug is the readable part of a URL that usually identifies a page, such as <code>best-writing-tools</code>. This generator lowercases text, removes unnecessary punctuation and joins words with hyphens."),
 ("Can slugs contain spaces?", "They can be encoded, but clean web URLs normally use hyphens instead of spaces. The generator converts runs of whitespace into a single hyphen."),
 ("Should a slug be lowercase?", "Lowercase slugs are common because they are easier to read, share and keep consistent. The generator uses lowercase output by default."),
 ("Should I include keywords in a slug?", "Use a short, descriptive slug that accurately identifies the page. Avoid stuffing it with repeated keywords or making it unnecessarily long."),
],

}

# Extra reference content for the developer/utility expansion.
REFS.update({
"base64-encoder-decoder": [
 ("What is Base64?", "<p>Base64 represents binary bytes as printable text characters. It is useful when data needs to travel through text-oriented formats, but it is <strong>not encryption</strong> and should not be used to hide secrets.</p>"),
 ("Is Base64 encoding safe for passwords?", "<p>No. Base64 is reversible encoding, not password protection. Never treat an encoded password, API key or token as secret merely because it is Base64 encoded.</p>"),
],
"url-encoder-decoder": [
 ("What does URL encoding do?", "<p>URL encoding percent-escapes characters that have special meaning or are not safe in a URL component. For example, a space can become <code>%20</code>.</p>"),
 ("URI or component mode?", "<p>Use component mode for individual query parameters or fragments. URI mode preserves characters that are normally valid within a complete URL.</p>"),
],
"regex-tester": [
 ("What regex syntax does this tester use?", "<p>This tester uses the JavaScript regular-expression engine available in your browser, including flags such as <code>g</code>, <code>i</code>, <code>m</code>, <code>s</code>, <code>u</code> and <code>y</code>.</p>"),
 ("Does the tester send my text anywhere?", "<p>No. Matching happens locally in your browser. The pattern and test text are not uploaded by the tool.</p>"),
],
"password-generator": [
 ("How are passwords generated?", "<p>The generator uses the browser's cryptographic random-number source rather than a predictable pseudo-random sequence. You can choose length and character sets before generating.</p>"),
 ("Should I reuse a generated password?", "<p>No. Use a unique password for each account and store it in a reputable password manager. A generated password is strongest when it is long, unique and not reused.</p>"),
],
"json-formatter": [
 ("Does formatting change my JSON data?", "<p>For valid JSON, formatting changes whitespace only. The parsed data is serialized back as JSON with indentation.</p>"),
],
"json-validator": [
 ("What does valid JSON mean?", "<p>Valid JSON follows the JSON syntax rules: strings use double quotes, objects and arrays are correctly structured, and values use valid JSON types such as strings, numbers, booleans and null.</p>"),
],
"json-minifier": [
 ("What does JSON minification remove?", "<p>It removes unnecessary whitespace such as indentation and line breaks while keeping the JSON data intact.</p>"),
],
"jwt-decoder": [
 ("Does decoding a JWT verify it?", "<p>No. Decoding only reads the token's encoded header and payload. A decoded JWT is not proof that its signature is valid or that its claims should be trusted.</p>"),
 ("Is my JWT uploaded?", "<p>No. The token is decoded in your browser. Do not paste production secrets into tools you do not trust.</p>"),
],
"uuid-generator": [
 ("What type of UUID is generated?", "<p>The generator creates random version 4 UUIDs. They contain randomly generated bits with the version and variant bits set according to the UUID format.</p>"),
],
"hash-generator": [
 ("Which hash algorithms are available?", "<p>You can generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes using the browser's Web Crypto API.</p>"),
 ("Can a hash be decoded?", "<p>A cryptographic hash is designed to be one-way. You can compare a newly generated hash with a known value, but there is no general decode operation that recovers the original input.</p>"),
],
"slug-generator": [
 ("What is a URL slug?", "<p>A slug is the readable part of a URL that usually identifies a page, such as <code>best-writing-tools</code>. This generator lowercases text, removes unnecessary punctuation and joins words with hyphens.</p>"),
 ("Can slugs contain spaces?", "<p>They can technically be encoded, but clean web URLs normally use hyphens instead of spaces. The generator therefore converts runs of whitespace into a single hyphen.</p>"),
],
})


def rail(active, locale="en"):
    loc_groups = _GROUPS_T.get(locale, _GROUPS_T["en"])
    out = []
    for g in EN_GROUPS:
        links = [t for t in TOOLS if t["group"] == g]
        if not links: continue
        out.append(f'  <div class="rail__group"><p class="rail__label">{loc_groups.get(g, g)}</p>')
        for t in links:
            cur = ' aria-current="page"' if t["slug"] == active else ''
            nav_label = TOOLS_T.get(locale, TOOLS_T["en"]).get(t["slug"], {}).get("nav", t["nav"])
            out.append(f'    <a class="rail__link" href="{t["slug"]}"{cur}>{ICONS[t["icon"]]}<span>{nav_label}</span></a>')
        out.append('  </div>')
    return "\n".join(out)

def head(title, desc, canonical, schema, locale="en", slug=None):
    hreflang_links = []
    for lc, ln in LANGUAGES.items():
        if slug:
            page_part = f"/{slug}"
        else:
            page_part = "/"
        if lc == "en":
            hreflang_links.append(f'<link rel="alternate" hreflang="{lc}" href="{BASE}{page_part}">')
        else:
            hreflang_links.append(f'<link rel="alternate" hreflang="{lc}" href="{BASE}/{lc}{page_part}">')
    # x-default points to English
    default_part = f"/{slug}" if slug else "/"
    hreflang_links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}{default_part}">')
    hreflang_str = "\n".join(hreflang_links)
    return f"""<!DOCTYPE html>
<html lang="{locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} | {SITE}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
{hreflang_str}
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{locale.replace('-', '_')}">
<meta property="og:site_name" content="{SITE}">
<meta property="og:image" content="{BASE}/assets/og-image.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{html.escape(title)}">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{BASE}/assets/og-image.png">
<link rel="icon" type="image/png" href="{'../assets' if locale != 'en' else 'assets'}/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="{'../assets' if locale != 'en' else 'assets'}/favicon.svg" />
<link rel="shortcut icon" href="{'../assets' if locale != 'en' else 'assets'}/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="{'../assets' if locale != 'en' else 'assets'}/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Word Room" />
<link rel="manifest" href="{'../assets' if locale != 'en' else 'assets'}/site.webmanifest" />
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<!-- Fontshare silently drops the second family in a combined f[] request, so one link per family. -->
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f%5B%5D=switzer@400,500,600&display=swap">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f%5B%5D=gambetta@400,500,600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{'../assets' if locale != 'en' else 'assets'}/base.css">
<link rel="stylesheet" href="{'../assets' if locale != 'en' else 'assets'}/app.css">
<script type="application/ld+json">{json.dumps(schema)}</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H94B49VY8R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-H94B49VY8R');
</script>
</head>"""

LANG_FLAGS = {
    "en": "gb", "es": "es", "ja": "jp", "fr": "fr", "de": "de",
    "pt": "pt", "ko": "kr", "it": "it", "ru": "ru",
}

def lang_switcher(locale, slug=None):
    """Build the language switcher dropdown."""
    cur_flag = LANG_FLAGS.get(locale, "gb")
    cur_name = LANGUAGES.get(locale, "English")
    opts = []
    for lc, ln in LANGUAGES.items():
        if lc == locale:
            continue
        if lc == "en":
            href = f'/{slug}' if slug else '/'
        else:
            href = f'/{lc}/{slug}' if slug else f'/{lc}/'
        fc = LANG_FLAGS.get(lc, lc)
        opts.append(f'    <a class="lang-switcher__opt" role="option" href="{href}"><img class="lang-switcher__flag" src="https://flagcdn.com/16x12/{fc}.png" alt="" width="16" height="12">{ln}</a>')
    return f'''<div class="lang-switcher" id="langSwitcher">
  <button class="lang-switcher__btn" type="button" aria-haspopup="listbox" aria-expanded="false">
    <img class="lang-switcher__flag" src="https://flagcdn.com/16x12/{cur_flag}.png" alt="" width="16" height="12">
    <span class="lang-switcher__name">{cur_name}</span>
    <svg class="lang-switcher__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>
  <nav class="lang-switcher__menu" role="listbox" aria-label="Switch language">
{chr(10).join(opts)}
  </nav>
</div>'''

def shell(active, body, locale="en", slug=None):
    ui = UI.get(locale, UI["en"])
    prefix = f"/{locale}" if locale != "en" else ""
    home_href = f"{prefix}/" if locale != "en" else "/"
    # JS/CSS paths: English root = assets/, localized = ../assets/
    a = "../assets" if locale != "en" else "assets"
    # Footer links
    footer_pages = ["privacy", "about", "terms", "contact"]
    footer_links = []
    for p in footer_pages:
        pt = PAGES_T.get(locale, PAGES_T.get("en", {})).get(p, PAGES_T.get("en", {}).get(p, {}))
        page_title = pt.get("title", p.replace("-", " ").title())
        if locale != "en":
            href = f"/{locale}/{p}"
        else:
            href = f"/{p}"
        footer_links.append(f'<a href="{href}">{page_title}</a>')
    footer_html = f"""<footer class="ftr">
  <div class="wrap">
    <div class="ftr__inner">
      <span class="ftr__copy">&copy; 2026 {SITE}</span>
      <nav class="ftr__links" aria-label="Legal">{" ".join(footer_links)}</nav>
    </div>
  </div>
</footer>"""
    return f"""<body data-tool="{active}" lang="{locale}">
<div class="app">
<header class="hdr">
  <button class="iconbtn" id="railToggle" aria-label="{u(locale, 'open_menu')}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  <a class="hdr__brand" href="{home_href}">{LOGO_TPL.format(asset_path=a)}<span>WordRoom</span></a>
  <span class="hdr__spacer"></span>
  <span class="privacy" title="Every calculation runs in your browser. Your text is never uploaded."><span class="privacy__dot"></span><span>{u(locale, 'privacy')}</span></span>
  {lang_switcher(locale, slug)}
  <button class="kbtrigger" data-pal-open type="button" aria-label="{u(locale, 'search')}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>{u(locale, 'search')}</span><kbd>⌘K</kbd></button>
  <button class="iconbtn" data-theme-toggle aria-label="{u(locale, 'switch_theme')}"></button>
</header>

<div class="rail__scrim" aria-hidden="true"></div>
<nav class="rail" aria-label="Tools">
  <button class="iconbtn rail__close" aria-label="{u(locale, 'close_menu')}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
{rail(active, locale)}
</nav>

<main class="main"><div class="wrap">
{body}
</div></main>
{footer_html}
</div>

<div class="pal" role="dialog" aria-modal="true" aria-label="Command palette">
  <div class="pal__box">
    <div class="pal__in">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="palInput" type="text" placeholder="{u(locale, 'search_ph')}" autocomplete="off" spellcheck="false">
    </div>
    <div class="pal__list" id="palList"></div>
    <div class="pal__ft">
      <span><kbd>↑</kbd><kbd>↓</kbd> {u(locale, 'tools')}</span><span><kbd>↵</kbd> run</span><span><kbd>esc</kbd> close</span>
    </div>
  </div>
</div>

<div class="toasts" aria-live="polite"></div>
<script src="{a}/lib.js"></script>
<script src="{a}/app.js"></script>
</body>
</html>"""

SHEET_BAR = """<div class="sheet__bar">
  <div class="seg" role="group" aria-label="Editor typeface">
    <button type="button" data-face-set="sans" aria-pressed="true">Sans</button>
    <button type="button" data-face-set="serif" aria-pressed="false">Serif</button>
    <button type="button" data-face-set="mono" aria-pressed="false">Mono</button>
  </div>
  <span class="grow"></span>
  <div class="tacts">
    <button class="tbtn" id="sampleBtn" type="button">Sample</button>
    <button class="tbtn" id="undoBtn" type="button" disabled>Undo</button>
    <button class="tbtn" id="focusBtn" type="button" aria-pressed="false">Focus</button>
    <button class="tbtn" id="copyBtn" type="button">Copy</button>
    <button class="tbtn" id="dlBtn" type="button">Download</button>
    <button class="tbtn tbtn--danger" id="clearBtn" type="button">Clear</button>
  </div>
</div>"""

_FAQ_H = {"en": "Common questions", "es": "Preguntas frecuentes", "ja": "よくある質問",
           "fr": "Questions fréquentes", "de": "Häufige Fragen", "pt": "Perguntas frequentes",
           "ko": "자주 묻는 질문", "it": "Domande frequenti", "ru": "Частые вопросы"}
_REL_H = {"en": "Related tools", "es": "Herramientas relacionadas", "ja": "関連ツール",
           "fr": "Outils connexes", "de": "Verwandte Tools", "pt": "Ferramentas relacionadas",
           "ko": "관련 도구", "it": "Strumenti correlati", "ru": "Похожие инструменты"}

def refs_html(slug, locale="en"):
    parts = []
    # The newer utility pages keep their educational content inside the
    # Common questions accordion. Do not render the older standalone
    # reference blocks above it, which makes the FAQ area look duplicated.
    FAQ_ONLY_SLUGS = {
        "base64-encoder-decoder", "url-encoder-decoder", "regex-tester",
        "password-generator", "json-formatter", "json-validator",
        "json-minifier", "jwt-decoder", "uuid-generator",
        "hash-generator", "slug-generator",
    }
    refs = [] if slug in FAQ_ONLY_SLUGS else REFS_T.get(locale, REFS_T.get("en", {})).get(slug, REFS.get(slug, []))
    for h, body in refs:
        parts.append(f"<section><h2>{h}</h2>{body}</section>")
    faqs = FAQS_T.get(locale, FAQS_T.get("en", {})).get(slug, FAQS.get(slug, []))
    if faqs:
        parts.append(f'<section class="refs-faq"><h2>{_FAQ_H.get(locale, "Common questions")}</h2>' + "".join(
            f'<details class="faq"><summary>{html.escape(q)}</summary><div><p>{html.escape(a)}</p></div></details>'
            for q, a in faqs) + "</section>")
    rel = [t for t in TOOLS if t["slug"] != slug][:3]
    loc_tools = TOOLS_T.get(locale, TOOLS_T.get("en", {}))
    parts.append(f'<section class="refs-related"><h2>{_REL_H.get(locale, "Related tools")}</h2><div class="rel">' + "".join(
        f'<a class="relcard" href="{t["slug"]}"><strong>{loc_tools.get(t["slug"], {}).get("nav", t["nav"])}</strong><span>{loc_tools.get(t["slug"], {}).get("lede", t["lede"])}</span></a>' for t in rel
    ) + "</div></section>")
    return '<div class="refs">' + "".join(parts) + '</div>'

def tool_page(t, locale="en"):
    slug = t["slug"]
    loc_tools = TOOLS_T.get(locale, TOOLS_T.get("en", {}))
    lt = loc_tools.get(slug, {})
    # Build translated tool dict, falling back to English
    tt = {k: lt.get(k, t[k]) for k in ("nav", "h1", "eyebrow", "title", "desc", "lede", "ph")}
    prefix = f"/{locale}" if locale != "en" else ""
    canonical = f"{BASE}{prefix}/{slug}"
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "SoftwareApplication", "name": tt["h1"], "applicationCategory": "UtilityApplication",
             "operatingSystem": "Any browser", "description": tt["desc"], "url": canonical,
             "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
             "featureList": ["Runs entirely in the browser", "No sign-up", "No file upload"]},
            {"@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in (FAQS_T.get(locale, FAQS_T.get("en", {})).get(slug, FAQS.get(slug, [])))]},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "WordRoom", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 2, "name": tt["h1"], "item": canonical}]},
        ],
    }
    body = f"""<div class="pagehead">
  <p class="eyebrow">{tt["eyebrow"]}</p>
  <h1>{tt["h1"]}</h1>
  <p>{tt["lede"]}</p>
</div>
<div class="work">
  <div>
    <div class="sheet">
      {SHEET_BAR}
      <label class="sr-only" for="editor">Your text</label>
      <textarea class="editor" id="editor" spellcheck="false" placeholder="{html.escape(tt["ph"])}"></textarea>
      <div class="strip" id="strip" role="status" aria-live="polite" aria-atomic="true"></div>
    </div>
  </div>
  <aside class="panel" id="panel" aria-label="Tool options and results"></aside>
</div>
{refs_html(slug, locale)}"""
    return head(tt["title"], tt["desc"], canonical, schema, locale, slug) + shell(slug, body, locale, slug)

def index_page(locale="en"):
    h = HOME.get(locale, HOME.get("en", {}))
    loc_tools = TOOLS_T.get(locale, TOOLS_T.get("en", {}))
    prefix = f"/{locale}" if locale != "en" else ""
    canonical = f"{BASE}{prefix}/" if locale != "en" else f"{BASE}/"
    schema = {"@context": "https://schema.org", "@type": "WebSite", "name": SITE,
              "url": canonical,
              "description": h.get("schema_desc", HOME["en"]["schema_desc"])}
    cards = "".join(
        f'<a class="relcard" href="{t["slug"]}"><strong>{loc_tools.get(t["slug"], {}).get("nav", t["nav"])}</strong><span>{loc_tools.get(t["slug"], {}).get("lede", t["lede"])}</span></a>' for t in TOOLS)
    # Use translated home page content
    body = f"""<div class="hero">
  <p class="eyebrow">{h.get("eyebrow", HOME["en"]["eyebrow"])}</p>
  <h1>{h.get("h1", HOME["en"]["h1"])}</h1>
  <p>{h.get("desc", HOME["en"]["desc"])}</p>
  <div class="herobtns">
    <a class="btn" href="word-counter">{h.get("cta", HOME["en"]["cta"])}</a>
    <button class="btn btn--ghost" data-pal-open type="button">{h.get("cta2", HOME["en"]["cta2"])} <kbd>⌘K</kbd></button>
  </div>
</div>

<div class="refs" style="max-width:var(--content-wide);margin-top:var(--space-12)">
  <section><h2>{h.get("tools_h", HOME["en"]["tools_h"])}</h2><div class="rel">{cards}</div></section>
  <section>
    <h2>{h.get("diff_h", HOME["en"]["diff_h"])}</h2>
    <h3>{h.get("s1t", HOME["en"]["s1t"])}</h3>
    <p>{h.get("s1d", HOME["en"]["s1d"])}</p>
    <h3>{h.get("s2t", HOME["en"]["s2t"])}</h3>
    <p>{h.get("s2d", HOME["en"]["s2d"])}</p>
    <h3>{h.get("s3t", HOME["en"]["s3t"])}</h3>
    <p>{h.get("s3d", HOME["en"]["s3d"])}</p>
    <h3>{h.get("s4t", HOME["en"]["s4t"])}</h3>
    <p>{h.get("s4d", HOME["en"]["s4d"])}</p>
  </section>
</div>"""
    return head(h.get("meta_title", HOME["en"]["meta_title"]),
                h.get("meta_desc", HOME["en"]["meta_desc"]),
                canonical, schema, locale) + shell("home", body, locale)

STATIC_PAGES = ["privacy", "about", "terms", "contact"]

def static_page(slug, locale="en"):
    pages = PAGES_T.get(locale, PAGES_T.get("en", {}))
    page = pages.get(slug, pages.get(slug, PAGES_T.get("en", {}).get(slug, {})))
    title = page.get("title", slug.replace("-", " ").title())
    desc = page.get("desc", title)
    h1 = page.get("h1", title)
    last_updated = page.get("last_updated", "")
    sections = page.get("sections", [])
    prefix = f"/{locale}" if locale != "en" else ""
    canonical = f"{BASE}{prefix}/{slug}"
    schema = {"@context": "https://schema.org", "@type": "WebPage",
              "name": h1, "url": canonical, "description": title}
    sections_html = ""
    for heading, content in sections:
        sections_html += f"<section><h2>{heading}</h2>{content}</section>"
    updated_html = f'<p class="eyebrow">{last_updated}</p>' if last_updated else ""
    body = f"""<div class="pagehead">
  <h1>{h1}</h1>
  {updated_html}
</div>
<div class="refs">
{sections_html}
</div>"""
    return head(title, desc, canonical, schema, locale, slug) + shell(slug, body, locale, slug)

# ------------------------------------------------------------------ build
page_count = 0

# English pages (root)
(OUT / "index.html").write_text(index_page("en"), encoding="utf-8")
page_count += 1
for t in TOOLS:
    (OUT / f"{t['slug']}.html").write_text(tool_page(t, "en"), encoding="utf-8")
    page_count += 1
for slug in STATIC_PAGES:
    (OUT / f"{slug}.html").write_text(static_page(slug, "en"), encoding="utf-8")
    page_count += 1

# Localized pages (subdirectories)
for locale in LANGUAGES:
    if locale == "en":
        continue
    loc_dir = OUT / locale
    loc_dir.mkdir(exist_ok=True)
    (loc_dir / "index.html").write_text(index_page(locale), encoding="utf-8")
    page_count += 1
    for t in TOOLS:
        (loc_dir / f"{t['slug']}.html").write_text(tool_page(t, locale), encoding="utf-8")
        page_count += 1
    for slug in STATIC_PAGES:
        (loc_dir / f"{slug}.html").write_text(static_page(slug, locale), encoding="utf-8")
        page_count += 1

# robots.txt
(OUT / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: https://wordroomonline.com/sitemap.xml\n", encoding="utf-8")

# sitemap.xml with hreflang entries
TODAY = datetime.now().strftime("%Y-%m-%d")
sitemap_urls = []
# English URLs
sitemap_urls.append(f"  <url><loc>{BASE}/</loc><lastmod>{TODAY}</lastmod>")
for lc in LANGUAGES:
    if lc == "en":
        sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/"/>')
    else:
        sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/{lc}/"/>')
sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/"/>')
sitemap_urls.append("  </url>")

for t in TOOLS:
    s = t["slug"]
    # English tool URL
    sitemap_urls.append(f"  <url><loc>{BASE}/{s}</loc><lastmod>{TODAY}</lastmod>")
    for lc in LANGUAGES:
        if lc == "en":
            sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/{s}"/>')
        else:
            sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/{lc}/{s}"/>')
    sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/{s}"/>')
    sitemap_urls.append("  </url>")

for s in STATIC_PAGES:
    sitemap_urls.append(f"  <url><loc>{BASE}/{s}</loc><lastmod>{TODAY}</lastmod>")
    for lc in LANGUAGES:
        if lc == "en":
            sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/{s}"/>')
        else:
            sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{BASE}/{lc}/{s}"/>')
    sitemap_urls.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/{s}"/>')
    sitemap_urls.append("  </url>")

(OUT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + "\n".join(sitemap_urls) + "\n</urlset>\n", encoding="utf-8")

# llms.txt
(OUT / "llms.txt").write_text(
    "# WordRoom\n\nPrivate, client-side text and writing utilities. No upload, no account.\n\n"
    + "".join(f"- [{t['nav']}](https://wordroomonline.com/{t['slug']}): {t['desc']}\n" for t in TOOLS), encoding="utf-8")

print(f"built {page_count} pages across {len(LANGUAGES)} languages")
