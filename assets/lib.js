/* ============================================================
   TextKit core — pure functions, no DOM, no dependencies.
   This file becomes the npm package verbatim.
   ============================================================ */
const TK = (() => {
  'use strict';

  const hasSeg = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
  const segCache = new Map();
  function seg(granularity, locale) {
    const k = granularity + '|' + locale;
    if (!segCache.has(k)) segCache.set(k, new Intl.Segmenter(locale, { granularity }));
    return segCache.get(k);
  }

  /* ---------------- Segmentation ---------------- */

  // Correct word counts for Telugu, Hindi, Tamil, Chinese, Japanese, Thai — and English.
  function words(text, locale = 'en') {
    if (!text) return [];
    if (!hasSeg) return text.match(/[\p{L}\p{N}'’-]+/gu) || [];
    const out = [];
    for (const s of seg('word', locale).segment(text)) if (s.isWordLike) out.push(s.segment);
    return out;
  }

  // User-perceived characters: "నమస్తే" and emoji count as humans count them,
  // not as the UTF-16 code units that text.length reports.
  function graphemes(text) {
    if (!text) return 0;
    if (!hasSeg) return [...text].length;
    let n = 0;
    for (const _ of seg('grapheme', undefined).segment(text)) n++;
    return n;
  }

  // Words that end in a full stop without ending a sentence.
  const ABBREV = new Set(('mr mrs ms dr prof sr jr st rev hon gen col lt sgt capt sen rep '
    + 'vs etc eg ie cf al ca approx fig figs no nos vol vols ch chap pp ed eds trans '
    + 'inc ltd co corp dept univ assn dept est min max avg '
    + 'jan feb mar apr jun jul aug sep sept oct nov dec mon tue wed thu fri sat sun '
    + 'am pm us uk eu un phd md ba ma bsc msc llb jd esq').split(' '));

  function endsMidSentence(piece) {
    const m = piece.match(/([\p{L}\p{N}]+)\.["'”’)\]]*\s*$/u);
    if (!m) return false;
    return ABBREV.has(m[1].toLowerCase()) || /^\p{L}$/u.test(m[1]);
  }

  /**
   * Splits text into sentence pieces whose concatenation is exactly the input
   * (whitespace and punctuation preserved), so callers can rebuild the text.
   *
   * Intl.Segmenter alone is not enough: UAX #29 refuses to break a sentence when the
   * next word begins with a lowercase letter, so all-lowercase text — which is exactly
   * what people paste into a sentence-case converter — comes back as one giant sentence.
   * We run a second, abbreviation-guarded pass to catch those.
   */
  function rawSentences(text, locale = 'en') {
    const coarse = [];
    if (hasSeg) {
      for (const s of seg('sentence', locale).segment(text)) coarse.push(s.segment);
    } else {
      coarse.push(text);
    }
    // The segmenter happily breaks "J. R. Smith" into three sentences and "fig. 3"
    // into two. Merge a piece back into the previous one when the previous piece ends
    // in an abbreviation or a single-letter initial.
    const merged = [];
    for (const piece of coarse) {
      const prev = merged[merged.length - 1];
      if (prev && endsMidSentence(prev)) merged[merged.length - 1] = prev + piece;
      else merged.push(piece);
    }

    const out = [];
    const BREAK = /([.!?…।॥]+["'”’)\]]*)(\s+)/g;
    for (const chunk of merged) {
      let last = 0, m;
      BREAK.lastIndex = 0;
      while ((m = BREAK.exec(chunk)) !== null) {
        const cut = m.index + m[0].length;
        if (cut >= chunk.length) break;                 // terminator ends the chunk already
        const before = chunk.slice(last, m.index);
        const word = (before.match(/[\p{L}\p{N}]+$/u) || [''])[0];
        if (ABBREV.has(word.toLowerCase())) continue;   // "etc. and so on"
        if (/^\p{L}$/u.test(word)) continue;            // initials: "J. R. Smith"
        out.push(chunk.slice(last, cut));
        last = cut;
      }
      if (last < chunk.length) out.push(chunk.slice(last));
    }
    return out.length ? out : [text];
  }

  function sentences(text, locale = 'en') {
    if (!text || !text.trim()) return [];
    return rawSentences(text, locale)
      .map((s) => s.trim())
      .filter((t) => t && /[\p{L}\p{N}]/u.test(t));
  }

  function paragraphs(text) {
    if (!text || !text.trim()) return [];
    return text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  }

  const SCRIPTS = [
    ['Telugu', /[\u0C00-\u0C7F]/u],
    ['Devanagari', /[\u0900-\u097F]/u],
    ['Tamil', /[\u0B80-\u0BFF]/u],
    ['Bengali', /[\u0980-\u09FF]/u],
    ['Kannada', /[\u0C80-\u0CFF]/u],
    ['Malayalam', /[\u0D00-\u0D7F]/u],
    ['Gurmukhi', /[\u0A00-\u0A7F]/u],
    ['Gujarati', /[\u0A80-\u0AFF]/u],
    ['Arabic', /[\u0600-\u06FF]/u],
    ['Han', /[\u4E00-\u9FFF]/u],
    ['Hiragana/Katakana', /[\u3040-\u30FF]/u],
    ['Hangul', /[\uAC00-\uD7AF]/u],
    ['Thai', /[\u0E00-\u0E7F]/u],
    ['Cyrillic', /[\u0400-\u04FF]/u],
    ['Greek', /[\u0370-\u03FF]/u],
  ];
  const LOCALE_FOR = {
    Telugu: 'te', Devanagari: 'hi', Tamil: 'ta', Bengali: 'bn', Kannada: 'kn',
    Malayalam: 'ml', Gurmukhi: 'pa', Gujarati: 'gu', Arabic: 'ar', Han: 'zh',
    'Hiragana/Katakana': 'ja', Hangul: 'ko', Thai: 'th', Cyrillic: 'ru', Greek: 'el',
  };

  function detectScripts(text) {
    const found = [];
    for (const [name, re] of SCRIPTS) if (re.test(text)) found.push(name);
    if (/[a-zA-Z]/.test(text)) found.push('Latin');
    return found;
  }
  function bestLocale(text) {
    for (const [name, re] of SCRIPTS) if (re.test(text)) return LOCALE_FOR[name] || 'en';
    return 'en';
  }

  /* ---------------- Academic stripping ---------------- */
  // Nobody else in this category does this, and it is what students actually ask for.
  const REF_HEADING =
    /^[ \t]*(references|bibliography|works\s+cited|reference\s+list|citations)[ \t]*:?[ \t]*$/im;

  function stripAcademic(text, opts = {}) {
    let t = text;
    if (opts.refList) {
      const m = t.match(REF_HEADING);
      if (m && m.index !== undefined) t = t.slice(0, m.index);
    }
    if (opts.citations) {
      t = t
        .replace(/\[[0-9,\s–—-]+\]/g, ' ')                        // [12], [3–5]
        .replace(/\((?:[^()]*?\d{4}[a-z]?(?:[,;:][^()]*)?)\)/g, ' ') // (Smith, 2020, p. 4)
        .replace(/\((?:see\s+)?(?:e\.g\.|cf\.|ibid\.?)[^()]*\)/gi, ' ')
        .replace(/\{\{[^}]*\}\}/g, ' ');
    }
    if (opts.footnotes) {
      t = t.replace(/\[\^[^\]]+\]/g, ' ').replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, '');
    }
    if (opts.headings) t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+.*$/gm, ' ');
    if (opts.quotes) t = t.replace(/^[ \t]{0,3}>[ \t]?.*$/gm, ' ');
    if (opts.urls) t = t.replace(/https?:\/\/\S+|www\.\S+/gi, ' ');
    if (opts.tables) t = t.replace(/^[ \t]*\|.*\|[ \t]*$/gm, ' ');
    if (opts.code) t = t.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
    return t;
  }

  /* ---------------- Counting ---------------- */
  const WPM_READ = 238;   // Brysbaert 2019 mean silent reading rate for English prose
  const WPM_SPEAK = 130;  // conservative presentation pace

  function count(text, locale) {
    const loc = locale || bestLocale(text);
    const w = words(text, loc);
    const s = sentences(text, loc);
    const p = paragraphs(text);
    const g = graphemes(text);
    const noSpace = graphemes(text.replace(/\s/g, ''));
    const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
    const uniq = new Set(w.map((x) => x.toLowerCase())).size;
    const longest = s.reduce((a, b) => (words(b, loc).length > words(a, loc).length ? b : a), '');
    return {
      locale: loc,
      words: w.length,
      characters: g,
      charactersNoSpaces: noSpace,
      sentences: s.length,
      paragraphs: p.length,
      lines,
      uniqueWords: uniq,
      avgWordsPerSentence: s.length ? w.length / s.length : 0,
      avgCharsPerWord: w.length ? w.reduce((a, x) => a + graphemes(x), 0) / w.length : 0,
      readingSeconds: (w.length / WPM_READ) * 60,
      speakingSeconds: (w.length / WPM_SPEAK) * 60,
      longestSentence: longest,
      wordList: w,
      sentenceList: s,
    };
  }

  function duration(sec) {
    if (!sec || sec < 1) return '0s';
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
    if (h) return `${h}h ${m}m`;
    if (m) return s ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  }

  function frequency(wordList, stopwords = false) {
    const STOP = new Set(('a an the and or but if then than that this these those of in on at to for with '
      + 'from by as is are was were be been being it its i you he she they we my your his her their our not '
      + 'no do does did have has had will would can could should may might there here what which who whom')
      .split(' '));
    const map = new Map();
    for (const w of wordList) {
      const k = w.toLowerCase();
      if (stopwords && STOP.has(k)) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  /* ---------------- Case transforms ---------------- */
  // AP style: lowercase articles, coordinating conjunctions and prepositions under
  // four letters — except as the first or last word. Every competitor gets this wrong.
  const MINOR_AP = new Set(['a','an','and','at','but','by','for','in','nor','of','on','or','so','the','to','up','yet','as','if','per','via']);
  const MINOR_CHICAGO = new Set([...MINOR_AP, 'from','into','like','over','with','upon','than','that','when','once','onto','down','off','out','past','till','unto']);

  // A token the writer capitalised on purpose: an acronym (SEO, NASA, PDF) or an
  // internal capital (iPhone, McDonald, JavaScript). Preserving these is the single
  // biggest quality difference between this and every other case converter.
  function isDeliberate(tok) {
    const bare = tok.replace(/[^\p{L}\p{N}]/gu, '');
    if (bare.length < 2) return false;
    if (bare === bare.toUpperCase() && /\p{Lu}/u.test(bare)) return true;   // SEO, API, R&D
    return /\p{Ll}/u.test(bare) && /\p{Lu}/u.test(bare.slice(1));           // iPhone, McDonald
  }
  // If the whole line is shouting, the capitals carry no information.
  // Shouting = most of the words are all-caps, not just "contains no lowercase".
  function isShouting(s) {
    const toks = s.match(/\p{L}[\p{L}'’]*/gu);
    if (!toks || !toks.length) return false;
    let caps = 0;
    for (const t of toks) if (t === t.toUpperCase()) caps += 1;
    return caps / toks.length > 0.6;
  }

  function titleCase(text, style = 'ap') {
    const minor = style === 'chicago' ? MINOR_CHICAGO : MINOR_AP;
    // Split per line so each title or heading gets its own first/last word.
    return text.split(/(\n)/).map((chunk) => {
      if (chunk === '\n') return chunk;
      const parts = chunk.split(/(\s+)/);
      const wordIdx = parts.map((v, i) => i).filter((i) => parts[i].trim());
      if (!wordIdx.length) return chunk;
      const shout = isShouting(chunk);
      const first = wordIdx[0], last = wordIdx[wordIdx.length - 1];
      return parts.map((tok, i) => {
        if (!tok.trim()) return tok;
        if (!shout && isDeliberate(tok)) return tok;
        const lower = tok.toLowerCase();
        const bare = lower.replace(/[^\p{L}\p{N}'’-]/gu, '');
        if (i !== first && i !== last && minor.has(bare)) return lower;
        // hyphenates: "state-of-the-art" → "State-of-the-Art"
        return lower.split('-').map((piece, j) => {
          if (j > 0 && minor.has(piece)) return piece;
          return upFirst(piece);
        }).join('-');
      }).join('');
    }).join('');
  }

  function upFirst(s) {
    const m = s.match(/\p{L}|\p{N}/u);
    if (!m) return s;
    const i = s.indexOf(m[0]);
    return s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
  }

  function sentenceCase(text, locale = 'en') {
    const shout = isShouting(text);
    // Lowercase token by token so acronyms and internal capitals survive.
    const soften = (s) => s.split(/(\s+)/)
      .map((tok) => (!shout && tok.trim() && isDeliberate(tok) ? tok : tok.toLowerCase()))
      .join('');
    // Find boundaries on the ORIGINAL text — lowercasing first defeats the segmenter.
    const out = rawSentences(text, locale).map((s) => upFirst(soften(s))).join('');
    // Restore the standalone pronoun "I" in English.
    return out.replace(/\bi\b/g, 'I').replace(/\bi'(m|ve|ll|d)\b/g, "I'$1");
  }

  const tokens = (t) => t.split(/[\s_\-.]+/).flatMap((x) =>
    x.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/\s+/)
  ).filter(Boolean);

  const CASES = {
    upper:    (t) => t.toUpperCase(),
    lower:    (t) => t.toLowerCase(),
    title:    (t, o) => titleCase(t, o && o.style),
    sentence: (t, o) => sentenceCase(t, (o && o.locale) || 'en'),
    capitalize: (t) => t.replace(/\p{L}[\p{L}'’]*/gu, (w) =>
      (!isShouting(t) && isDeliberate(w) ? w : upFirst(w.toLowerCase()))),
    camel:    (t) => tokens(t).map((w, i) => (i ? upFirst(w.toLowerCase()) : w.toLowerCase())).join(''),
    pascal:   (t) => tokens(t).map((w) => upFirst(w.toLowerCase())).join(''),
    snake:    (t) => tokens(t).map((w) => w.toLowerCase()).join('_'),
    constant: (t) => tokens(t).map((w) => w.toUpperCase()).join('_'),
    kebab:    (t) => tokens(t).map((w) => w.toLowerCase()).join('-'),
    dot:      (t) => tokens(t).map((w) => w.toLowerCase()).join('.'),
    train:    (t) => tokens(t).map((w) => upFirst(w.toLowerCase())).join('-'),
    alternate:(t) => { let u = false; return [...t].map((c) => /\p{L}/u.test(c) ? ((u = !u) ? c.toUpperCase() : c.toLowerCase()) : c).join(''); },
    inverse:  (t) => [...t].map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
  };

  /* ---------------- Line operations ---------------- */
  const splitLines = (t) => t.split(/\r\n|\r|\n/);

  const LINES = {
    removeBreaks: (t, o = {}) => {
      let s = t;
      if (o.keepParagraphs) {
        s = s.replace(/\r\n|\r/g, '\n')
             .split(/\n\s*\n+/).map((p) => p.replace(/\n+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim())
             .join('\n\n');
      } else {
        s = s.replace(/[\r\n]+/g, o.replaceWith !== undefined ? o.replaceWith : ' ');
      }
      if (o.collapseSpaces !== false) s = s.replace(/[ \t]{2,}/g, ' ');
      return o.trim === false ? s : s.trim();
    },
    removeEmpty: (t) => splitLines(t).filter((l) => l.trim()).join('\n'),
    trimLines: (t) => splitLines(t).map((l) => l.trim()).join('\n'),
    sort: (t, o = {}) => {
      let ls = splitLines(t);
      if (o.ignoreEmpty !== false) ls = ls.filter((l) => l.trim());
      const coll = new Intl.Collator(o.locale || undefined, {
        sensitivity: o.caseSensitive ? 'variant' : 'base',
        numeric: !!o.natural,
      });
      if (o.mode === 'length') ls.sort((a, b) => a.length - b.length || coll.compare(a, b));
      else if (o.mode === 'random') { for (let i = ls.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ls[i], ls[j]] = [ls[j], ls[i]]; } }
      else if (o.mode === 'reverse') ls.reverse();
      else ls.sort(coll.compare);
      if (o.desc && o.mode !== 'random' && o.mode !== 'reverse') ls.reverse();
      return ls.join('\n');
    },
    dedupe: (t, o = {}) => {
      const ls = splitLines(t);
      const seen = new Map();
      const keep = [];
      for (const l of ls) {
        let k = l;
        if (!o.caseSensitive) k = k.toLowerCase();
        if (o.ignoreWhitespace !== false) k = k.trim().replace(/\s+/g, ' ');
        if (o.ignoreEmpty !== false && !l.trim()) { keep.push(l); continue; }
        if (seen.has(k)) { seen.set(k, seen.get(k) + 1); continue; }
        seen.set(k, 1);
        keep.push(l);
      }
      const dupes = [...seen.entries()].filter(([, n]) => n > 1);
      return {
        text: (o.onlyDuplicates ? ls.filter((l) => { const k = o.caseSensitive ? l : l.toLowerCase(); return seen.get(k.trim().replace(/\s+/g,' ')) > 1; }) : keep).join('\n'),
        removed: ls.length - keep.length,
        duplicateGroups: dupes.length,
        top: dupes.sort((a, b) => b[1] - a[1]).slice(0, 5),
      };
    },
    addNumbers: (t, o = {}) => splitLines(t).map((l, i) => `${i + (o.start || 1)}${o.sep || '. '}${l}`).join('\n'),
    reverseText: (t, o = {}) =>
      o.mode === 'words' ? t.split(/(\s+)/).reverse().join('')
      : o.mode === 'lines' ? splitLines(t).reverse().join('\n')
      : [...(hasSeg ? [...seg('grapheme', undefined).segment(t)].map((s) => s.segment) : [...t])].reverse().join(''),
  };

  /* ---------------- Readability ---------------- */
  // Heuristic syllable counter — the standard approach. Approximate by design;
  // the UI says so rather than pretending to precision it does not have.
  function syllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    const trimmed = w
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')  // silent -es, -ed, trailing -e
      .replace(/^y/, '');                                // leading y is a consonant
    const m = trimmed.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  const READ_BANDS = [
    [90, 'Very easy', '5th grade'],
    [80, 'Easy', '6th grade'],
    [70, 'Fairly easy', '7th grade'],
    [60, 'Plain English', '8th–9th grade'],
    [50, 'Fairly difficult', '10th–12th grade'],
    [30, 'Difficult', 'College'],
    [-Infinity, 'Very difficult', 'College graduate'],
  ];

  function readability(text, locale = 'en') {
    const c = count(text, locale);
    const w = c.words, s = c.sentences;
    if (!w || !s) return null;
    let syl = 0, poly = 0, letters = 0, longWords = 0;
    for (const word of c.wordList) {
      const n = syllables(word);
      syl += n;
      if (n >= 3) poly++;
      const L = word.replace(/[^\p{L}\p{N}]/gu, '').length;
      letters += L;
      if (L > 6) longWords++;
    }
    const wps = w / s, spw = syl / w;
    const fre = 206.835 - 1.015 * wps - 84.6 * spw;
    const band = READ_BANDS.find(([min]) => fre >= min);

    // Per-sentence findings, hardest first — the part no competitor shows.
    const findings = c.sentenceList
      .map((sent) => {
        const sw = words(sent, locale);
        const sSyl = sw.reduce((a, x) => a + syllables(x), 0);
        const sFre = sw.length ? 206.835 - 1.015 * sw.length - 84.6 * (sSyl / sw.length) : 100;
        return { text: sent, words: sw.length, score: sFre };
      })
      .filter((f) => f.words >= 25 || f.score < 30)
      .sort((a, b) => a.score - b.score)
      .slice(0, 4);

    const passive = c.sentenceList.filter((sent) =>
      /\b(?:is|are|was|were|be|been|being|got|gets)\s+(?:\w+ly\s+)?\w+(?:ed|en|wn|rn|ne|de|un|it)\b/i.test(sent)
    ).length;

    return {
      words: w, sentences: s, syllables: syl, polysyllables: poly, letters,
      fleschReadingEase: fre,
      fleschKincaidGrade: 0.39 * wps + 11.8 * spw - 15.59,
      gunningFog: 0.4 * (wps + 100 * (poly / w)),
      colemanLiau: 0.0588 * ((letters / w) * 100) - 0.296 * ((s / w) * 100) - 15.8,
      smog: 1.043 * Math.sqrt(poly * (30 / s)) + 3.1291,
      automatedReadability: 4.71 * (letters / w) + 0.5 * wps - 21.43,
      daleChallLite: 0.1579 * ((longWords / w) * 100) + 0.0496 * wps,
      band: band[1], gradeLabel: band[2],
      avgWordsPerSentence: wps,
      passiveSentences: passive,
      findings,
    };
  }

  /* ---------------- Misc utilities ---------------- */
  const UTIL = {
    slug: (t, o = {}) => t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, o.sep || '-')
      .replace(new RegExp(`^\\${o.sep || '-'}+|\\${o.sep || '-'}+$`, 'g'), ''),
    collapseSpaces: (t) => t.replace(/[ \t]{2,}/g, ' ').replace(/ +$/gm, ''),
    smartQuotes: (t) => t
      .replace(/(^|[\s([{<])"/g, '$1\u201C').replace(/"/g, '\u201D')
      .replace(/(^|[\s([{<])'/g, '$1\u2018').replace(/'/g, '\u2019')
      .replace(/---/g, '\u2014').replace(/--/g, '\u2013').replace(/\.\.\./g, '\u2026'),
    straightQuotes: (t) => t.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2014/g, '---').replace(/\u2013/g, '--').replace(/\u2026/g, '...'),
    stripHtml: (t) => t.replace(/<[^>]*>/g, ''),
    zeroWidth: (t) => t.replace(/[\u200B-\u200D\uFEFF\u2060]/g, ''),
  };

  return {
    words, graphemes, sentences, paragraphs, count, duration, frequency,
    detectScripts, bestLocale, stripAcademic, titleCase, sentenceCase,
    syllables, readability, CASES, LINES, UTIL,
    WPM_READ, WPM_SPEAK,
  };
})();

if (typeof module !== 'undefined') module.exports = TK;
