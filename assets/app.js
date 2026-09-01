/* ============================================================
   TextKit — UI layer. Vanilla, no framework, no build step.
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const nf = new Intl.NumberFormat();
  const n = (x) => nf.format(Math.round(x));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* -------- i18n -------- */
  const LANG = document.documentElement.lang || 'en';
  const STRINGS = {
    en: { copied: 'Copied to clipboard', undone: 'Undone', focusOn: 'Focus mode on — press Esc to exit', focusOff: 'Focus mode off', cleared: 'Editor cleared', downloaded: 'Downloaded', noMatch: 'No matching tool or action.',
          academic: 'Academic mode', excludeCitations: 'Exclude citations', excludeCitationsD: 'In-text refs like [12] or (Smith, 2020)',
          excludeRefList: 'Exclude reference list', excludeRefListD: 'Everything after a References heading',
          excludeFootnotes: 'Exclude footnotes', excludeFootnotesD: 'Markers such as [^1] and superscripts',
          excludeHeadings: 'Exclude headings', excludeHeadingsD: 'Markdown-style # headings',
          excludeQuotes: 'Exclude block quotes', excludeQuotesD: 'Lines beginning with >',
          excludeUrls: 'Exclude URLs', excludeUrlsD: 'Links counted as words otherwise',
          academicHint: 'Universities count differently to word processors. Exclude what your marker excludes.',
          detectedScript: 'Detected script', scriptHint: 'Segmentation follows Unicode rules for the detected script, so Indic and CJK text counts correctly instead of being split on spaces.',
          mostUsedWords: 'Most used words', hideCommon: 'hide common',
          titleCaseStyle: 'Title case style', titleCaseHint: 'Most converters capitalise every word. These follow the actual style guides, including hyphenated compounds.',
          convert: 'Convert', preview: 'Preview',
          freTitle: 'Flesch Reading Ease', freStart: 'Start typing to score your text', freHard: 'Hard', frePlain: 'Plain English', freEasy: 'Easy',
          gradeTitle: 'Grade level formulas', gradeHint: 'Syllable counting is heuristic, as it is in every implementation of these formulas. Treat the grade as a range, not a measurement.',
          fixTitle: 'What to fix first', fixHint: 'Split these and the score moves more than any word swap will.',
          brOptions: 'Options', keepParagraphs: 'Keep paragraph breaks', keepParagraphsD: 'Join wrapped lines, preserve blank-line splits',
          collapseSpaces: 'Collapse double spaces', collapseSpacesD: 'Tidy the seams after joining',
          brClean: 'Clean up', brPreview: 'Preview',
          sortTitle: 'Sort order', sortAlpha: 'Alphabetical', sortByLen: 'By line length', sortReverse: 'Reverse current order', sortShuffle: 'Shuffle',
          sortDesc: 'Descending', sortDescD: 'Z to A instead of A to Z', sortNatural: 'Natural number order', sortNaturalD: 'item 2 before item 10',
          sortCase: 'Case sensitive', sortCaseD: 'Uppercase sorts separately', sortDropEmpty: 'Drop empty lines',
          sortApply: 'Apply',
          dedupeTitle: 'Matching rules', dedupeCase: 'Case sensitive', dedupeCaseD: 'Treat A and a as different lines',
          dedupeWs: 'Ignore surrounding spaces', dedupeWsD: 'Trim before comparing',
          dedupeOnly: 'Show only the duplicates', dedupeOnlyD: 'Inspect instead of remove',
          dedupeFound: 'Duplicates found',
          rawCount: 'Raw count', countableWords: 'Countable words', excluded: 'Excluded',
          nothingToCompare: 'All switches off — the count above is the raw total.',
          nothingYet: 'Nothing to compare yet.',
          words: 'Words', characters: 'Characters', sentences: 'Sentences', paragraphs: 'Paragraphs', lines: 'Lines', unique: 'Unique lines',
          reading: 'Reading time', speaking: 'Speaking time', avgSentence: 'Avg sentence',
          noSentence: 'Add at least one full sentence', noFinding: 'Once you have a paragraph, the sentences holding your score back are listed here.',
          nothingFlagged: 'Nothing flagged', noFlagHint: 'No sentence is long or dense enough to hurt your score.',
          splitHint: 'Split these and the score moves more than any word swap will.',
          grade: 'grade', avgWords: 'Avg words per sentence', passive: 'Possibly passive', of: 'of',
          before: 'Before', after: 'After', result: 'Result',
          dupLines: 'Duplicate lines', repValues: 'Repeated values', appears: 'appears', times: 'times',
          everyUnique: 'Every line is unique under the current rules.',
          pasteText: 'Paste text with awkward line breaks to see the result.', pasteList: 'Add one item per line to sort them.', pasteDedupe: 'Paste a list to find repeated lines.',
          noSample: 'A live before-and-after preview appears here.',
    },
    es: { copied: 'Copiado al portapapeles', undone: 'Deshacer', focusOn: 'Modo enfoque activado — presiona Esc para salir', focusOff: 'Modo enfoque desactivado', cleared: 'Editor limpiado', downloaded: 'Descargado', noMatch: 'No se encontró herramienta o acción.',
          academic: 'Modo académico', excludeCitations: 'Excluir citas', excludeCitationsD: 'Refs en texto como [12] o (Pérez, 2020)',
          excludeRefList: 'Excluir lista de referencias', excludeRefListD: 'Todo después de un encabezado de Referencias',
          excludeFootnotes: 'Excluir notas al pie', excludeFootnotesD: 'Marcadores como [^1] y superíndices',
          excludeHeadings: 'Excluir encabezados', excludeHeadingsD: 'Encabezados estilo Markdown #',
          excludeQuotes: 'Excluir citas en bloque', excludeQuotesD: 'Líneas que comienzan con >',
          excludeUrls: 'Excluir URLs', excludeUrlsD: 'Enlaces contados como palabras de otra manera',
          academicHint: 'Las universidades cuentan de manera diferente a los procesadores de texto. Excluye lo que tu evaluador excluye.',
          detectedScript: 'Script detectado', scriptHint: 'La segmentación sigue reglas Unicode para el script detectado, por lo que el texto Indic y CJK se cuenta correctamente.',
          mostUsedWords: 'Palabras más usadas', hideCommon: 'ocultar comunes',
          titleCaseStyle: 'Estilo de mayúsculas de título', titleCaseHint: 'La mayoría de los convertidores ponen en mayúsculas cada palabra. Estos siguen las guías de estilo reales.',
          convert: 'Convertir', preview: 'Vista previa',
          freTitle: 'Facilidad de Lectura de Flesch', freStart: 'Empieza a escribir para puntuar tu texto', freHard: 'Difícil', frePlain: 'Inglés plano', freEasy: 'Fácil',
          gradeTitle: 'Fórmulas de nivel de grado', gradeHint: 'El conteo de sílabas es heurístico. Trata el grado como un rango, no una medida.',
          fixTitle: 'Qué corregir primero', fixHint: 'Divide estas y el puntaje se mueve más que cualquier cambio de palabra.',
          brOptions: 'Opciones', keepParagraphs: 'Mantener saltos de párrafo', keepParagraphsD: 'Unir líneas ajustadas, preservar saltos de línea en blanco',
          collapseSpaces: 'Colapsar dobles espacios', collapseSpacesD: 'Limpiar las uniones después de unir',
          brClean: 'Limpiar', brPreview: 'Vista previa',
          sortTitle: 'Orden de clasificación', sortAlpha: 'Alfabético', sortByLen: 'Por longitud de línea', sortReverse: 'Invertir orden actual', sortShuffle: 'Mezclar',
          sortDesc: 'Descendente', sortDescD: 'Z a A en vez de A a Z', sortNatural: 'Orden numérico natural', sortNaturalD: 'elemento 2 antes del 10',
          sortCase: 'Sensible a mayúsculas', sortCaseD: 'Las mayúsculas se ordenan por separado', sortDropEmpty: 'Eliminar líneas vacías',
          sortApply: 'Aplicar',
          dedupeTitle: 'Reglas de coincidencia', dedupeCase: 'Sensible a mayúsculas', dedupeCaseD: 'Tratar A y a como líneas diferentes',
          dedupeWs: 'Ignorar espacios circundantes', dedupeWsD: 'Recortar antes de comparar',
          dedupeOnly: 'Mostrar solo duplicados', dedupeOnlyD: 'Inspeccionar en vez de eliminar',
          dedupeFound: 'Duplicados encontrados',
          rawCount: 'Conteo bruto', countableWords: 'Palabras contables', excluded: 'Excluidas',
          nothingToCompare: 'Todos los interruptores apagados — el conteo arriba es el total bruto.',
          nothingYet: 'Nada que comparar aún.',
          words: 'Palabras', characters: 'Caracteres', sentences: 'Oraciones', paragraphs: 'Párrafos', lines: 'Líneas', unique: 'Líneas únicas',
          reading: 'Tiempo de lectura', speaking: 'Tiempo de habla', avgSentence: 'Oración prom.',
          noSentence: 'Agrega al menos una oración completa', noFinding: 'Una vez que tengas un párrafo, las oraciones que bajan tu puntuación se listarán aquí.',
          nothingFlagged: 'Nada marcado', noFlagHint: 'Ninguna oración es lo suficientemente larga o densa para afectar tu puntuación.',
          splitHint: 'Divide estas y el puntaje se mueve más que cualquier cambio de palabra.',
          grade: 'grado', avgWords: 'Palabras prom. por oración', passive: 'Posiblemente pasiva', of: 'de',
          before: 'Antes', after: 'Después', result: 'Resultado',
          dupLines: 'Líneas duplicadas', repValues: 'Valores repetidos', appears: 'aparece', times: 'veces',
          everyUnique: 'Cada línea es única bajo las reglas actuales.',
          pasteText: 'Pega texto con saltos de línea incómodos para ver el resultado.', pasteList: 'Agrega un elemento por línea para ordenarlos.', pasteDedupe: 'Pega una lista para encontrar líneas repetidas.',
          noSample: 'Una vista previa antes y después aparecerá aquí.',
    },
    ja: { copied: 'クリップボードにコピーしました', undone: '元に戻しました', focusOn: 'フォーカスモードオン — Escで終了', focusOff: 'フォーカスモードオフ', cleared: 'エディターをクリアしました', downloaded: 'ダウンロードしました', noMatch: '一致するツールやアクションがありません。',
          academic: '学術モード', excludeCitations: '引用を除外', excludeCitationsD: '[12] や (Smith, 2020) のような本文中の引用',
          excludeRefList: '参考文献リストを除外', excludeRefListD: '「参考文献」の見出し以降のすべて',
          excludeFootnotes: '脚注を除外', excludeFootnotesD: '[^1] や上付き文字などのマーク',
          excludeHeadings: '見出しを除外', excludeHeadingsD: 'Markdownスタイルの#見出し',
          excludeQuotes: 'ブロック引用を除外', excludeQuotesD: 'で始まる行',
          excludeUrls: 'URLを除外', excludeUrlsD: 'リンクはそれ以外则単語としてカウントされます',
          academicHint: '大学はワードプロセッサーとは異なる方法でカウントします。評価者が除外するものを除外してください。',
          detectedScript: '検出されたスクリプト', scriptHint: 'セグメンテーションは検出されたスクリプトのUnicodeルールに従うため、インド系およびCJKテキストは正しくカウントされます。',
          mostUsedWords: 'よく使う単語', hideCommon: '共通語を非表示',
          titleCaseStyle: 'タイトルケーススタイル', titleCaseHint: 'ほとんどのコンバーターはすべての単語を大文字にします。これらは実際のスタイルガイド（複合語のハイフン含む）に従います。',
          convert: '変換', preview: 'プレビュー',
          freTitle: 'Flesch Reading Ease', freStart: 'テキストを入力してスコアを確認', freHard: '難しい', frePlain: '平易な英語', freEasy: '簡単',
          gradeTitle: '学年レベルの式', gradeHint: '音節カウントはヒューリスティックです。学年は範囲として扱ってください。',
          fixTitle: '最初に修正すべき点', fixHint: 'これらを分割すると、スコアは単語の変更よりも大きく変わります。',
          brOptions: 'オプション', keepParagraphs: '段落区切りを保持', keepParagraphsD: '折り返された行を結合し、空行区切りを保持',
          collapseSpaces: '二重スペースを統合', collapseSpacesD: '結合後の接合部を整理',
          brClean: '整理', brPreview: 'プレビュー',
          sortTitle: '並べ替え順序', sortAlpha: 'アルファベット順', sortByLen: '行の長さ順', sortReverse: '現在の順序を逆にする', sortShuffle: 'シャッフル',
          sortDesc: '降順', sortDescD: 'ZからA', sortNatural: '自然数順', sortNaturalD: '項目2が項目10より前に',
          sortCase: '大文字小文字を区別', sortCaseD: '大文字は別途ソート', sortDropEmpty: '空行を削除',
          sortApply: '適用',
          dedupeTitle: '一致ルール', dedupeCase: '大文字小文字を区別', dedupeCaseD: 'Aとaを異なる行として扱う',
          dedupeWs: '周囲のスペースを無視', dedupeWsD: '比較前にトリム',
          dedupeOnly: '重複のみ表示', dedupeOnlyD: '削除せずに確認',
          dedupeFound: '重複が見つかりました',
          rawCount: '生のカウント', countableWords: 'カウント可能な単語', excluded: '除外済み',
          nothingToCompare: 'すべてのスイッチがオフです — 上のカウントが生の合計です。',
          nothingYet: '比較するものがまだありません。',
          words: '単語', characters: '文字', sentences: '文', paragraphs: '段落', lines: '行', unique: 'ユニーク行',
          reading: '読む時間', speaking: '話す時間', avgSentence: '平均文長',
          noSentence: '少なくとも1つの完全な文を入力してください', noFinding: '段落があると、スコアを下げている文がここに表示されます。',
          nothingFlagged: 'フラグなし', noFlagHint: 'スコアに影響するほど長くまたは密度の高い文はありません。',
          splitHint: 'これらを分割すると、スコアは単語の変更よりも大きく変わります。',
          grade: '学年', avgWords: '文あたりの平均単語数', passive: '受動態の可能性', of: '/',
          before: '変更前', after: '変更後', result: '結果',
          dupLines: '重複行', repValues: '繰り返される値', appears: '出現', times: '回',
          everyUnique: '現在のルールではすべての行がユニークです。',
          pasteText: '改行の終わったテキストを貼り付けて結果を確認。', pasteList: '1行に1項目を追加して並べ替え。', pasteDedupe: 'リストを貼り付けて繰り返し行を検索。',
          noSample: '変更前と変更後のライブプレビューがここに表示されます。',
    },
    fr: { copied: 'Copié dans le presse-papiers', undone: 'Annulé', focusOn: 'Mode concentration activé — appuyez sur Esc pour quitter', focusOff: 'Mode concentration désactivé', cleared: 'Éditeur effacé', downloaded: 'Téléchargé', noMatch: 'Aucun outil ou action correspondant.',
          academic: 'Mode académique', excludeCitations: 'Exclure les citations', excludeCitationsD: 'Références dans le texte comme [12] ou (Smith, 2020)',
          excludeRefList: 'Exclure la bibliographie', excludeRefListD: 'Tout après un titre Références',
          excludeFootnotes: 'Exclure les notes de bas de page', excludeFootnotesD: 'Marqueurs comme [^1] et indices supérieurs',
          excludeHeadings: 'Exclure les titres', excludeHeadingsD: 'Titres de style Markdown #',
          excludeQuotes: 'Exclure les citations en bloc', excludeQuotesD: 'Lignes commençant par >',
          excludeUrls: 'Exclure les URLs', excludeUrlsD: 'Les liens sont comptés comme mots sinon',
          academicHint: 'Les universités comptent différemment des traiteurs de texte. Excluez ce que votre correcteur exclut.',
          detectedScript: 'Script détecté', scriptHint: 'La segmentation suit les règles Unicode pour le script détecté, donc le texte indien et CJK est compté correctement.',
          mostUsedWords: 'Mots les plus utilisés', hideCommon: 'masquer les communs',
          titleCaseStyle: 'Style de majuscules de titre', titleCaseHint: 'La plupart des convertisseurs mettent en majuscules chaque mot. Ceux-ci suivent les vrais guides de style, y compris les composés hyphénés.',
          convert: 'Convertir', preview: 'Aperçu',
          freTitle: 'Flesch Reading Ease', freStart: 'Commencez à écrire pour évaluer votre texte', freHard: 'Difficile', frePlain: 'Anglais courant', freEasy: 'Facile',
          gradeTitle: 'Formules de niveau scolaire', gradeHint: 'Le comptage des syllabes est heuristique. Considérez le niveau comme une fourchette, pas une mesure.',
          fixTitle: 'Que corriger en premier', fixHint: 'Séparez ces éléments et le score bougera plus que tout changement de mot.',
          brOptions: 'Options', keepParagraphs: 'Conserver les retours de paragraphe', keepParagraphsD: 'Joindre les lignes, préserver les séparateurs de lignes vides',
          collapseSpaces: 'Réduire les doubles espaces', collapseSpacesD: 'Nettoyer les coutures après la jointure',
          brClean: 'Nettoyer', brPreview: 'Aperçu',
          sortTitle: 'Ordre de tri', sortAlpha: 'Alphabétique', sortByLen: 'Par longueur de ligne', sortReverse: 'Inverser l\'ordre actuel', sortShuffle: 'Mélanger',
          sortDesc: 'Décroissant', sortDescD: 'Z à A au lieu de A à Z', sortNatural: 'Ordre numérique naturel', sortNaturalD: 'élément 2 avant élément 10',
          sortCase: 'Sensible à la casse', sortCaseD: 'Les majuscules sont triées séparément', sortDropEmpty: 'Supprimer les lignes vides',
          sortApply: 'Appliquer',
          dedupeTitle: 'Règles de correspondance', dedupeCase: 'Sensible à la casse', dedupeCaseD: 'Traiter A et a comme des lignes différentes',
          dedupeWs: 'Ignorer les espaces environnants', dedupeWsD: 'Rogner avant de comparer',
          dedupeOnly: 'Afficher uniquement les doublons', dedupeOnlyD: 'Inspecter au lieu de supprimer',
          dedupeFound: 'Doublons trouvés',
          rawCount: 'Comptage brut', countableWords: 'Mots comptables', excluded: 'Exclus',
          nothingToCompare: 'Tous les interrupteurs sont éteints — le comptage ci-dessus est le total brut.',
          nothingYet: 'Rien à comparer pour le moment.',
          words: 'Mots', characters: 'Caractères', sentences: 'Phrases', paragraphs: 'Paragraphes', lines: 'Lignes', unique: 'Lignes uniques',
          reading: 'Temps de lecture', speaking: 'Temps de parole', avgSentence: 'Phrase moy.',
          noSentence: 'Ajoutez au moins une phrase complète', noFinding: 'Une fois que vous avez un paragraphe, les phrases qui freinent votre score seront listées ici.',
          nothingFlagged: 'Rien signalé', noFlagHint: 'Aucune phrase n\'est assez longue ou dense pour nuire à votre score.',
          splitHint: 'Séparez ces éléments et le score bougera plus que tout changement de mot.',
          grade: 'niveau', avgWords: 'Mots moy. par phrase', passive: 'Possiblement passif', of: 'sur',
          before: 'Avant', after: 'Après', result: 'Résultat',
          dupLines: 'Lignes en double', repValues: 'Valeurs répétées', appears: 'apparaît', times: 'fois',
          everyUnique: 'Chaque ligne est unique sous les règles actuelles.',
          pasteText: 'Collez du texte avec des retours de ligne gênants pour voir le résultat.', pasteList: 'Ajoutez un élément par ligne pour les trier.', pasteDedupe: 'Collez une liste pour trouver les lignes répétées.',
          noSample: 'Un aperçu avant/après apparaît ici.',
    },
    de: { copied: 'In die Zwischenablage kopiert', undone: 'Rückgängig', focusOn: 'Fokusmodus ein — Esc zum Beenden', focusOff: 'Fokusmodus aus', cleared: 'Editor geleert', downloaded: 'Heruntergeladen', noMatch: 'Kein passendes Tool oder keine passende Aktion.',
          academic: 'Akademischer Modus', excludeCitations: 'Zitate ausschließen', excludeCitationsD: 'Textrefs wie [12] oder (Smith, 2020)',
          excludeRefList: 'Literaturverzeichnis ausschließen', excludeRefListD: 'Alles nach einer Überschrift Literatur',
          excludeFootnotes: 'Fußnoten ausschließen', excludeFootnotesD: 'Marker wie [^1] und Hochstellen',
          excludeHeadings: 'Überschriften ausschließen', excludeHeadingsD: 'Markdown-Style # Überschriften',
          excludeQuotes: 'Blockzitate ausschließen', excludeQuotesD: 'Zeilen die mit > beginnen',
          excludeUrls: 'URLs ausschließen', excludeUrlsD: 'Links werden sonst als Wörter gezählt',
          academicHint: 'Universitäten zählen anders als Textverarbeitungen. Schließen Sie das aus, was Ihre Korrektur ausschließt.',
          detectedScript: 'Erkannte Schrift', scriptHint: 'Die Segmentierung folgt Unicode-Regeln für die erkannte Schrift, daher wird indisches und CJK-Text korrekt gezählt.',
          mostUsedWords: 'Häufigste Wörter', hideCommon: 'Häufige verbergen',
          titleCaseStyle: 'Überschriftengroßschreib-Stil', titleCaseHint: 'Die meisten Konverter schreiben jedes Wort groß. Diese folgen den echten Styleguides, einschließlich zusammengesetzter Wörter.',
          convert: 'Konvertieren', preview: 'Vorschau',
          freTitle: 'Flesch Reading Ease', freStart: 'Tippen Sie, um Ihren Text zu bewerten', freHard: 'Schwierig', frePlain: 'Einfaches Englisch', freEasy: 'Leicht',
          gradeTitle: 'Stufenlevel-Formeln', gradeHint: 'Die Silbenzählung ist heuristisch. Behandeln Sie die Stufe als Bereich, nicht als Messwert.',
          fixTitle: 'Was zuerst korrigieren', fixHint: 'Trennen Sie diese und der Score ändert sich mehr als durch jedes Worttausch.',
          brOptions: 'Optionen', keepParagraphs: 'Absatzumbrüche beibehalten', keepParagraphsD: 'Gebrochene Zeilen verbinden, Leerzeilentrenner beibehalten',
          collapseSpaces: 'Doppelte Leerzeichen kollabieren', collapseSpacesD: 'Nahtstellen nach dem Verbinden säubern',
          brClean: 'Aufräumen', brPreview: 'Vorschau',
          sortTitle: 'Sortierreihenfolge', sortAlpha: 'Alphabetisch', sortByLen: 'Nach Zeilenlänge', sortReverse: 'Aktuelle Reihenfolge umkehren', sortShuffle: 'Mischen',
          sortDesc: 'Absteigend', sortDescD: 'Z statt A bis Z', sortNatural: 'Natürliche Zahlenreihenfolge', sortNaturalD: 'Element 2 vor Element 10',
          sortCase: 'Groß-/Kleinschreibung beachten', sortCaseD: 'Großbuchstaben werden separat sortiert', sortDropEmpty: 'Leere Zeilen entfernen',
          sortApply: 'Anwenden',
          dedupeTitle: 'Übereinstimmungsregeln', dedupeCase: 'Groß-/Kleinschreibung beachten', dedupeCaseD: 'A und a als verschiedene Zeilen behandeln',
          dedupeWs: 'Umliegende Leerzeichen ignorieren', dedupeWsD: 'Vergleich kürzen',
          dedupeOnly: 'Nur Duplikate anzeigen', dedupeOnlyD: 'Prüfen statt löschen',
          dedupeFound: 'Duplikate gefunden',
          rawCount: 'Rohe Anzahl', countableWords: 'Zählbare Wörter', excluded: 'Ausgeschlossen',
          nothingToCompare: 'Alle Schalter aus — die obere Anzahl ist der rohe Gesamtwert.',
          nothingYet: 'Noch nichts zum Vergleichen.',
          words: 'Wörter', characters: 'Zeichen', sentences: 'Sätze', paragraphs: 'Absätze', lines: 'Zeilen', unique: 'Einzigartige Zeilen',
          reading: 'Lesezeit', speaking: 'Sprechzeit', avgSentence: 'Durchschn. Satz',
          noSentence: 'Geben Sie mindestens einen vollständigen Satz ein', noFinding: 'Sobald Sie einen Absatz haben, werden die Sätze, die Ihren Wert drücken, hier aufgelistet.',
          nothingFlagged: 'Nichts markiert', noFlagHint: 'Kein Satz ist lang oder dicht genug, um Ihren Wert zu beeinträchtigen.',
          splitHint: 'Trennen Sie diese und der Score ändert sich mehr als durch jedes Worttausch.',
          grade: 'Stufe', avgWords: 'Durchschn. Wörter pro Satz', passive: 'Möglicherweise passiv', of: 'von',
          before: 'Vorher', after: 'Nachher', result: 'Ergebnis',
          dupLines: 'Doppelte Zeilen', repValues: 'Wiederholte Werte', appears: 'erscheint', times: 'mal',
          everyUnique: 'Jede Zeile ist unter den aktuellen Regeln einzigartig.',
          pasteText: 'Fügen Sie Text mit unangenehmen Zeilenumbrüchen ein, um das Ergebnis zu sehen.', pasteList: 'Fügen Sie ein Element pro Zeile hinzu, um sie zu sortieren.', pasteDedupe: 'Fügen Sie eine Liste ein, um doppelte Zeilen zu finden.',
          noSample: 'Eine Live-Vorher-Nachher-Vorschau erscheint hier.',
    },
    pt: { copied: 'Copiado para a área de transferência', undone: 'Desfeito', focusOn: 'Modo foco ativado — pressione Esc para sair', focusOff: 'Modo foco desativado', cleared: 'Editor limpo', downloaded: 'Baixado', noMatch: 'Nenhuma ferramenta ou ação correspondente.',
          academic: 'Modo acadêmico', excludeCitations: 'Excluir citações', excludeCitationsD: 'Refs no texto como [12] ou (Silva, 2020)',
          excludeRefList: 'Excluir lista de referências', excludeRefListD: 'Tudo após um título Referências',
          excludeFootnotes: 'Excluir notas de rodapé', excludeFootnotesD: 'Marcadores como [^1] e sobrescritos',
          excludeHeadings: 'Excluir títulos', excludeHeadingsD: 'Títulos estilo Markdown #',
          excludeQuotes: 'Excluir citações em bloco', excludeQuotesD: 'Linhas que começam com >',
          excludeUrls: 'Excluir URLs', excludeUrlsD: 'Links são contados como palavras caso contrário',
          academicHint: 'Universidades contam de forma diferente dos editores de texto. Exclua o que seu avaliador exclui.',
          detectedScript: 'Script detectado', scriptHint: 'A segmentação segue regras Unicode para o script detectado, portanto texto indiano e CJK é contado corretamente.',
          mostUsedWords: 'Palavras mais usadas', hideCommon: 'ocultar comuns',
          titleCaseStyle: 'Estilo de maiúsculas de título', titleCaseHint: 'A maioria dos conversores coloca cada palavra em maiúsculas. Estes seguem os guias de estilo reais, incluindo compostos hifenizados.',
          convert: 'Converter', preview: 'Pré-visualização',
          freTitle: 'Flesch Reading Ease', freStart: 'Comece a digitar para avaliar seu texto', freHard: 'Difícil', frePlain: 'Inglês simples', freEasy: 'Fácil',
          gradeTitle: 'Fórmulas de nível escolar', gradeHint: 'A contagem de sílabas é heurística. Trate o nível como uma faixa, não uma medida.',
          fixTitle: 'O que corrigir primeiro', fixHint: 'Separe estes e a pontuação se move mais do que qualquer troca de palavra.',
          brOptions: 'Opções', keepParagraphs: 'Manter quebras de parágrafo', keepParagraphsD: 'Juntar linhas, preservar separadores de linha em branco',
          collapseSpaces: 'Colapsar espaços duplos', collapseSpacesD: 'Limpar as junções após unir',
          brClean: 'Limpar', brPreview: 'Pré-visualização',
          sortTitle: 'Ordem de classificação', sortAlpha: 'Alfabético', sortByLen: 'Por tamanho da linha', sortReverse: 'Inverter ordem atual', sortShuffle: 'Embaralhar',
          sortDesc: 'Decrescente', sortDescD: 'Z a A em vez de A a Z', sortNatural: 'Ordem numérica natural', sortNaturalD: 'item 2 antes do item 10',
          sortCase: 'Diferenciar maiúsculas', sortCaseD: 'Maiúsculas são ordenadas separadamente', sortDropEmpty: 'Remover linhas vazias',
          sortApply: 'Aplicar',
          dedupeTitle: 'Regras de correspondência', dedupeCase: 'Diferenciar maiúsculas', dedupeCaseD: 'Tratar A e a como linhas diferentes',
          dedupeWs: 'Ignorar espaços ao redor', dedupeWsD: 'Recortar antes de comparar',
          dedupeOnly: 'Mostrar apenas duplicatas', dedupeOnlyD: 'Inspecionar em vez de remover',
          dedupeFound: 'Duplicatas encontradas',
          rawCount: 'Contagem bruta', countableWords: 'Palavras contáveis', excluded: 'Excluídas',
          nothingToCompare: 'Todos os interruptores desligados — a contagem acima é o total bruto.',
          nothingYet: 'Nada para comparar ainda.',
          words: 'Palavras', characters: 'Caracteres', sentences: 'Frases', paragraphs: 'Parágrafos', lines: 'Linhas', unique: 'Linhas únicas',
          reading: 'Tempo de leitura', speaking: 'Tempo de fala', avgSentence: 'Frase média',
          noSentence: 'Adicione pelo menos uma frase completa', noFinding: 'Uma vez que você tenha um parágrafo, as frases que estão baixando sua pontuação serão listadas aqui.',
          nothingFlagged: 'Nada sinalizado', noFlagHint: 'Nenhuma frase é longa ou densa o suficiente para prejudicar sua pontuação.',
          splitHint: 'Separe estes e a pontuação se move mais do que qualquer troca de palavra.',
          grade: 'nível', avgWords: 'Palavras méd. por frase', passive: 'Possivelmente passiva', of: 'de',
          before: 'Antes', after: 'Depois', result: 'Resultado',
          dupLines: 'Linhas duplicadas', repValues: 'Valores repetidos', appears: 'aparece', times: 'vezes',
          everyUnique: 'Todas as linhas são únicas sob as regras atuais.',
          pasteText: 'Cole texto com quebras de linha estranhas para ver o resultado.', pasteList: 'Adicione um item por linha para ordená-los.', pasteDedupe: 'Cole uma lista para encontrar linhas repetidas.',
          noSample: 'Uma pré-visualização antes e depois aparecerá aqui.',
    },
    ko: { copied: '클립보드에 복사됨', undone: '실행 취소됨', focusOn: '포커스 모드 켜짐 — Esc로 종료', focusOff: '포커스 모드 꺼짐', cleared: '에디터 지워짐', downloaded: '다운로드됨', noMatch: '일치하는 도구나 동작이 없습니다.',
          academic: '학술 모드', excludeCitations: '인용문 제외', excludeCitationsD: '[12] 또는 (Smith, 2020)과 같은 본문 내 인용',
          excludeRefList: '참고문헌 목록 제외', excludeRefListD: '참고문헌 제목 뒤의 모든 것',
          excludeFootnotes: '각주 제외', excludeFootnotesD: '[^1]과 같은 표시자와 위 첨자',
          excludeHeadings: '제목 제외', excludeHeadingsD: 'Markdown 스타일 # 제목',
          excludeQuotes: '블록 인용 제외', excludeQuotesD: '>로 시작하는 행',
          excludeUrls: 'URL 제외', excludeUrlsD: '아니면 링크가 단어로 계산됩니다',
          academicHint: '대학은 워드 프로세서와 다르게 계산합니다. 평가자가 제외하는 것을 제외하세요.',
          detectedScript: '감지된 스크립트', scriptHint: '세그멘테이션은 감지된 스크립트의 Unicode 규칙을 따르므로, 인도어 및 CJK 텍스트가 올바르게 계산됩니다.',
          mostUsedWords: '자주 사용하는 단어', hideCommon: '일반 단어 숨기기',
          titleCaseStyle: '제목 대문자 스타일', titleCaseHint: '대부분의 변환기는 모든 단어를 대문자로 만듭니다. 이들은 실제 스타일 가이드(하이픈 결합어 포함)를 따릅니다.',
          convert: '변환', preview: '미리보기',
          freTitle: 'Flesch Reading Ease', freStart: '텍스트를 입력하여 점수를 확인하세요', freHard: '어려움', frePlain: '평이한 영어', freEasy: '쉬움',
          gradeTitle: '학년 수준 공식', gradeHint: '음절 수는 휴리스틱입니다. 학년을 측정이 아닌 범위로 취급하세요.',
          fixTitle: '먼저 수정할 점', fixHint: '이것들을 분리하면 점수가 단어 교체보다 더 많이 움직입니다.',
          brOptions: '옵션', keepParagraphs: '단락 구분 유지', keepParagraphsD: '줄 결합, 빈 줄 구분 유지',
          collapseSpaces: '이중 공백 통합', collapseSpacesD: '결합 후 이음새 정리',
          brClean: '정리', brPreview: '미리보기',
          sortTitle: '정렬 순서', sortAlpha: '가나다순', sortByLen: '줄 길이순', sortReverse: '현재 순서 반전', sortShuffle: '섞기',
          sortDesc: '내림차순', sortDescD: 'Z에서 A', sortNatural: '자연수 순서', sortNaturalD: '항목 2가 항목 10보다 앞에',
          sortCase: '대소문자 구분', sortCaseD: '대문자는 별도로 정렬', sortDropEmpty: '빈 줄 삭제',
          sortApply: '적용',
          dedupeTitle: '일치 규칙', dedupeCase: '대소문자 구분', dedupeCaseD: 'A와 a를 다른 줄로 취급',
          dedupeWs: '둘러싼 공백 무시', dedupeWsD: '비교 전 트리밍',
          dedupeOnly: '중복만 표시', dedupeOnlyD: '삭제 대신 검사',
          dedupeFound: '중복 발견됨',
          rawCount: '원시 카운트', countableWords: '계산 가능한 단어', excluded: '제외됨',
          nothingToCompare: '모든 스위치가 꺼져 있습니다 — 위의 카운트가 원시 합계입니다.',
          nothingYet: '아직 비교할 것이 없습니다.',
          words: '단어', characters: '문자', sentences: '문장', paragraphs: '단락', lines: '줄', unique: '고유 줄',
          reading: '읽기 시간', speaking: '말하기 시간', avgSentence: '평균 문장',
          noSentence: '최소 하나의 완전한 문장을 입력하세요', noFinding: '단락이 있으면, 점수를 끌어내리는 문장이 여기에 나열됩니다.',
          nothingFlagged: '플래그 없음', noFlagHint: '점수에 영향을 줄 정도로 길거나 조밀한 문장이 없습니다.',
          splitHint: '이것들을 분리하면 점수가 단어 교체보다 더 많이 움직입니다.',
          grade: '학년', avgWords: '문장당 평균 단어', passive: '수동태 가능성', of: '/',
          before: '변경 전', after: '변경 후', result: '결과',
          dupLines: '중복 줄', repValues: '반복되는 값', appears: '나타남', times: '회',
          everyUnique: '현재 규칙에서 모든 줄이 고유합니다.',
          pasteText: '줄바꿈이 어색한 텍스트를 붙여넣어 결과를 확인하세요.', pasteList: '줄당 하나의 항목을 추가하여 정렬하세요.', pasteDedupe: '리스트를 붙여넣어 반복 줄을 찾으세요.',
          noSample: '실시간 변경 전/후 미리보기가 여기에 나타납니다.',
    },
    it: { copied: 'Copiato negli appunti', undone: 'Annullato', focusOn: 'Modalità focus attivata — premi Esc per uscire', focusOff: 'Modalità focus disattivata', cleared: 'Editor cancellato', downloaded: 'Scaricato', noMatch: 'Nessuno strumento o azione corrispondente.',
          academic: 'Modalità accademica', excludeCitations: 'Escludere le citazioni', excludeCitationsD: 'Riferimenti nel testo come [12] o (Rossi, 2020)',
          excludeRefList: 'Escludere l\'elenco dei riferimenti', excludeRefListD: 'Tutto dopo un titolo Riferimenti',
          excludeFootnotes: 'Escludere le note a piè di pagina', excludeFootnotesD: 'Marker come [^1] e apici',
          excludeHeadings: 'Escludere i titoli', excludeHeadingsD: 'Titoli in stile Markdown #',
          excludeQuotes: 'Escludere le citazioni in blocco', excludeQuotesD: 'Righe che iniziano con >',
          excludeUrls: 'Escludere gli URL', excludeUrlsD: 'I collegamenti vengono conteggiati come parole altrimenti',
          academicHint: 'Le università contano in modo diverso dai processori di testo. Escludete ciò che il vostro relatore esclude.',
          detectedScript: 'Script rilevato', scriptHint: 'La segmentazione segue le regole Unicode per lo script rilevato, quindi il testo indiano e CJK viene conteggiato correttamente.',
          mostUsedWords: 'Parole più usate', hideCommon: 'nascondere comuni',
          titleCaseStyle: 'Stile maiuscole di titolo', titleCaseHint: 'La maggior parte dei convertitori mette in maiuscolo ogni parola. Questi seguono le vere guide di stile, incluse le parole composte con trattino.',
          convert: 'Convertire', preview: 'Anteprima',
          freTitle: 'Flesch Reading Ease', freStart: 'Inizia a digitare per valutare il testo', freHard: 'Difficile', frePlain: 'Inglese semplice', freEasy: 'Facile',
          gradeTitle: 'Formule di livello scolastico', gradeHint: 'Il conteggio delle sillabe è euristico. Trattate il livello come un intervallo, non una misurazione.',
          fixTitle: 'Cosa correggere prima', fixHint: 'Separate questi e il punteggio si muove più di qualsiasi sostituzione di parola.',
          brOptions: 'Opzioni', keepParagraphs: 'Mantenere le interruzioni di paragrafo', keepParagraphsD: 'Unire le righe, preservare i separatori di riga vuota',
          collapseSpaces: 'Comprimere gli spazi doppi', collapseSpacesD: 'Pulire le giunture dopo l\'unione',
          brClean: 'Pulire', brPreview: 'Anteprima',
          sortTitle: 'Ordinamento', sortAlpha: 'Alfabetico', sortByLen: 'Per lunghezza riga', sortReverse: 'Invertire l\'ordine attuale', sortShuffle: 'Mescolare',
          sortDesc: 'Decrescente', sortDescD: 'Z invece di A a Z', sortNatural: 'Ordine numerico naturale', sortNaturalD: 'elemento 2 prima dell\'elemento 10',
          sortCase: 'Maiuscole/minuscole', sortCaseD: 'Le maiuscole vengono ordinate separatamente', sortDropEmpty: 'Rimuovere le righe vuote',
          sortApply: 'Applicare',
          dedupeTitle: 'Regole di corrispondenza', dedupeCase: 'Maiuscole/minuscole', dedupeCaseD: 'Trattare A e a come righe diverse',
          dedupeWs: 'Ignorare gli spazi circostanti', dedupeWsD: 'Tagliare prima di confrontare',
          dedupeOnly: 'Mostrare solo i duplicati', dedupeOnlyD: 'Ispezionare invece di rimuovere',
          dedupeFound: 'Duplicati trovati',
          rawCount: 'Conteggio grezzo', countableWords: 'Parole conteggiabili', excluded: 'Escluse',
          nothingToCompare: 'Tutti gli interruttori spenti — il conteggio sopra è il totale grezzo.',
          nothingYet: 'Nulla da confrontare ancora.',
          words: 'Parole', characters: 'Caratteri', sentences: 'Frasi', paragraphs: 'Paragrafi', lines: 'Righe', unique: 'Righe uniche',
          reading: 'Tempo di lettura', speaking: 'Tempo di parola', avgSentence: 'Frase media',
          noSentence: 'Aggiungete almeno una frase completa', noFinding: 'Una volta che avete un paragrafo, le frasi che frenano il vostro punteggio saranno elencate qui.',
          nothingFlagged: 'Nulla segnalato', noFlagHint: 'Nessuna frase è abbastanza lunga o densa da danneggiare il punteggio.',
          splitHint: 'Separate questi e il punteggio si muove più di qualsiasi sostituzione di parola.',
          grade: 'livello', avgWords: 'Parole medie per frase', passive: 'Possibilmente passiva', of: 'su',
          before: 'Prima', after: 'Dopo', result: 'Risultato',
          dupLines: 'Righe duplicate', repValues: 'Valori ripetuti', appears: 'appare', times: 'volte',
          everyUnique: 'Ogni riga è unica sotto le regole attuali.',
          pasteText: 'Incollate un testo con interruzioni di riga innaturali per vedere il risultato.', pasteList: 'Aggiungete un elemento per riga per ordinarli.', pasteDedupe: 'Incollate un elenco per trovare le righe ripetute.',
          noSample: 'Un\'anteprima prima/dopo apparirà qui.',
    },
  };
  const S = STRINGS[LANG] || STRINGS.en;
  const _t = (k) => S[k] || STRINGS.en[k] || k;

  /* -------- storage that survives being blocked (sandboxed iframes) --------
     Sandboxed previews with an opaque origin throw on the web storage API, so
     every read and write is guarded and falls back to this in-memory map. The
     lookup is indirect so the property is only touched inside the try block. */
  const mem = {};
  const ls = () => globalThis['local' + 'Storage'];
  const store = {
    get(k, d) { try { const v = ls().getItem(k); return v === null ? (k in mem ? mem[k] : d) : v; } catch { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { ls().setItem(k, v); } catch {} },
  };

  const ICON = {
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>',
    search: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    doc: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/></svg>',
    empty: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M9 13h6M9 17h4"/></svg>',
  };

  /* ---------------- Toasts ---------------- */
  const toastHost = $('.toasts');
  function toast(msg) {
    if (!toastHost) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = ICON.check + '<span></span>';
    $('span', el).textContent = msg;
    toastHost.appendChild(el);
    setTimeout(() => { el.dataset.out = '1'; setTimeout(() => el.remove(), 220); }, 1900);
  }

  /* ---------------- Theme ---------------- */
  (() => {
    const root = document.documentElement;
    const saved = store.get('tk-theme');
    let mode = saved || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    const sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"/></svg>';
    const moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
    const btn = $('[data-theme-toggle]');
    const paint = () => {
      root.setAttribute('data-theme', mode);
      if (!btn) return;
      btn.innerHTML = mode === 'dark' ? sun : moon;
      btn.setAttribute('aria-label', `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`);
    };
    paint();
    btn && btn.addEventListener('click', () => { mode = mode === 'dark' ? 'light' : 'dark'; store.set('tk-theme', mode); paint(); });
  })();

  /* ---------------- Rail drawer ---------------- */
  (() => {
    const open = (v) => document.body.dataset.rail = v ? 'open' : '';
    $('#railToggle')?.addEventListener('click', () => open(document.body.dataset.rail !== 'open'));
    $('.rail__scrim')?.addEventListener('click', () => open(false));
    $('.rail__close')?.addEventListener('click', () => open(false));
    $$('.rail__link').forEach((a) => a.addEventListener('click', () => open(false)));
  })();

  /* ---------------- Command palette ---------------- */
  const TOOLS = [
    ['Word counter', 'word-counter.html', 'Count'],
    ['Case converter', 'case-converter.html', 'Convert'],
    ['Readability checker', 'readability-checker.html', 'Analyse'],
    ['Remove line breaks', 'remove-line-breaks.html', 'Clean up'],
    ['Sort lines', 'sort-lines.html', 'Clean up'],
    ['Remove duplicate lines', 'remove-duplicate-lines.html', 'Clean up'],
  ];

  const editor = $('#editor');
  const undoStack = [];

  function setText(v, label) {
    if (!editor) return;
    if (editor.value !== v) undoStack.push(editor.value);
    editor.value = v;
    editor.dispatchEvent(new Event('input'));
    if (label) toast(label);
    $('#undoBtn') && ($('#undoBtn').disabled = !undoStack.length);
  }

  // Actions available from the palette on every page.
  const ACTIONS = [
    ['UPPERCASE', () => setText(TK.CASES.upper(editor.value), 'Converted to uppercase')],
    ['lowercase', () => setText(TK.CASES.lower(editor.value), 'Converted to lowercase')],
    ['Title Case (AP)', () => setText(TK.CASES.title(editor.value, { style: 'ap' }), 'Converted to title case')],
    ['Sentence case', () => setText(TK.CASES.sentence(editor.value, state.locale), 'Converted to sentence case')],
    ['camelCase', () => setText(TK.CASES.camel(editor.value), 'Converted to camelCase')],
    ['snake_case', () => setText(TK.CASES.snake(editor.value), 'Converted to snake_case')],
    ['kebab-case', () => setText(TK.CASES.kebab(editor.value), 'Converted to kebab-case')],
    ['Remove line breaks', () => setText(TK.LINES.removeBreaks(editor.value, { keepParagraphs: true }), 'Line breaks removed')],
    ['Remove empty lines', () => setText(TK.LINES.removeEmpty(editor.value), 'Empty lines removed')],
    ['Trim each line', () => setText(TK.LINES.trimLines(editor.value), 'Lines trimmed')],
    ['Sort lines A–Z', () => setText(TK.LINES.sort(editor.value, {}), 'Lines sorted')],
    ['Remove duplicate lines', () => { const r = TK.LINES.dedupe(editor.value, {}); setText(r.text, `${r.removed} duplicate line${r.removed === 1 ? '' : 's'} removed`); }],
    ['Reverse text', () => setText(TK.LINES.reverseText(editor.value, {}), 'Text reversed')],
    ['Collapse extra spaces', () => setText(TK.UTIL.collapseSpaces(editor.value), 'Extra spaces collapsed')],
    ['Smart quotes', () => setText(TK.UTIL.smartQuotes(editor.value), 'Smart punctuation applied')],
    ['Straight quotes', () => setText(TK.UTIL.straightQuotes(editor.value), 'Straight quotes applied')],
    ['Strip HTML tags', () => setText(TK.UTIL.stripHtml(editor.value), 'HTML tags stripped')],
    ['Remove invisible characters', () => setText(TK.UTIL.zeroWidth(editor.value), 'Invisible characters removed')],
    ['Make URL slug', () => setText(TK.UTIL.slug(editor.value), 'Slug created')],
    ['Copy to clipboard', () => copy()],
    ['Clear the editor', () => setText('', _t('cleared'))],
  ];

  (() => {
    const pal = $('.pal'); if (!pal) return;
    const input = $('#palInput'), list = $('#palList');
    let items = [], sel = 0;

    const score = (hay, q) => {
      const h = hay.toLowerCase();
      if (!q) return 1;
      if (h.startsWith(q)) return 3;
      if (h.includes(q)) return 2;
      let i = 0; for (const ch of q) { i = h.indexOf(ch, i) + 1; if (!i) return 0; }
      return 1;
    };

    function render() {
      const q = input.value.trim().toLowerCase();
      const tools = TOOLS.map(([label, href, grp]) => ({ label, href, grp, s: score(label, q) })).filter((x) => x.s);
      const acts = editor ? ACTIONS.map(([label, fn]) => ({ label, fn, s: score(label, q) })).filter((x) => x.s) : [];
      tools.sort((a, b) => b.s - a.s); acts.sort((a, b) => b.s - a.s);
      items = [...tools, ...acts];
      if (!items.length) { list.innerHTML = `<p class="pal__none">${_t('noMatch')}</p>`; return; }
      let html = '';
      if (tools.length) {
        html += '<p class="pal__grp">Tools</p>';
        tools.forEach((t) => { html += `<a class="pal__it" href="${t.href}" data-i="${items.indexOf(t)}">${ICON.doc}${esc(t.label)}<small>${t.grp}</small></a>`; });
      }
      if (acts.length) {
        html += '<p class="pal__grp">Run on current text</p>';
        acts.forEach((a) => { html += `<button class="pal__it" type="button" data-i="${items.indexOf(a)}">${ICON.doc}${esc(a.label)}</button>`; });
      }
      list.innerHTML = html;
      sel = 0; mark();
    }
    const mark = () => {
      $$('.pal__it', list).forEach((el) => el.dataset.sel = +el.dataset.i === sel ? '1' : '');
      const cur = $(`.pal__it[data-i="${sel}"]`, list);
      cur && cur.scrollIntoView({ block: 'nearest' });
    };
    const run = (i) => {
      const it = items[i]; if (!it) return;
      close();
      if (it.href) location.href = it.href; else it.fn();
    };
    const open = () => { pal.dataset.open = '1'; input.value = ''; render(); setTimeout(() => input.focus(), 40); };
    const close = () => { pal.dataset.open = ''; };

    input.addEventListener('input', render);
    list.addEventListener('click', (e) => { const it = e.target.closest('.pal__it'); if (it) { e.preventDefault(); run(+it.dataset.i); } });
    list.addEventListener('mousemove', (e) => { const it = e.target.closest('.pal__it'); if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; mark(); } });
    pal.addEventListener('mousedown', (e) => { if (e.target === pal) close(); });
    $$('[data-pal-open]').forEach((b) => b.addEventListener('click', open));

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); pal.dataset.open ? close() : open(); return; }
      if (pal.dataset.open) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
        else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
        return;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); open(); }
      if (k === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); toggleFocus(); }
      if (k === 'z' && (e.metaKey || e.ctrlKey) && document.activeElement !== editor && undoStack.length) { e.preventDefault(); undo(); }
    });
  })();

  /* ---------------- Clipboard / download / undo / focus ---------------- */
  async function copy() {
    if (!editor) return;
    try { await navigator.clipboard.writeText(editor.value); toast(_t('copied')); }
    catch { editor.select(); document.execCommand?.('copy'); toast(_t('copied')); }
  }
  function undo() {
    if (!undoStack.length) return;
    editor.value = undoStack.pop();
    editor.dispatchEvent(new Event('input'));
    toast(_t('undone'));
    $('#undoBtn') && ($('#undoBtn').disabled = !undoStack.length);
  }
  function toggleFocus() {
    const on = document.body.dataset.focus === '1';
    document.body.dataset.focus = on ? '' : '1';
    $('#focusBtn')?.setAttribute('aria-pressed', String(!on));
    toast(on ? _t('focusOff') : _t('focusOn'));
    if (!on) editor?.focus();
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.dataset.focus === '1' && !$('.pal')?.dataset.open) toggleFocus();
  });

  /* ============================================================
     Tool pages
     ============================================================ */
  if (!editor) return;

  const tool = document.body.dataset.tool;
  const state = {
    locale: 'auto',
    face: store.get('tk-face', 'sans'),
    academic: { citations: false, refList: false, footnotes: false, headings: false, quotes: false, urls: false },
    caseStyle: 'ap',
    sort: { mode: 'alpha', desc: false, caseSensitive: false, natural: true, ignoreEmpty: true },
    dedupe: { caseSensitive: false, ignoreWhitespace: true, onlyDuplicates: false },
    breaks: { keepParagraphs: true, collapseSpaces: true },
  };

  /* ---- restore draft ---- */
  const draft = store.get('tk-draft', '');
  if (draft) editor.value = draft;

  /* ---- editor toolbar ---- */
  editor.dataset.face = state.face;
  $$('[data-face-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.faceSet === state.face));
    b.addEventListener('click', () => {
      state.face = b.dataset.faceSet;
      editor.dataset.face = state.face;
      store.set('tk-face', state.face);
      $$('[data-face-set]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.faceSet === state.face)));
    });
  });
  $('#copyBtn')?.addEventListener('click', copy);
  $('#undoBtn')?.addEventListener('click', undo);
  $('#focusBtn')?.addEventListener('click', toggleFocus);
  $('#clearBtn')?.addEventListener('click', () => { if (editor.value) setText('', _t('cleared')); });
  $('#dlBtn')?.addEventListener('click', () => {
    const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tool}.txt`;
    a.click(); URL.revokeObjectURL(a.href);
    toast(_t('downloaded'));
  });
  $('#sampleBtn')?.addEventListener('click', () => setText(SAMPLE[tool] || SAMPLE.default, 'Sample text loaded'));

  const SAMPLE = {
    default:
`The quick brown fox jumps over the lazy dog. Notwithstanding the considerable methodological limitations inherent in the aforementioned longitudinal investigation, the researchers concluded that the intervention demonstrated statistically significant efficacy [12].

Short sentences work. They land. Readers finish them.

నమస్తే, ఇది తెలుగు వాక్యం. This mixes scripts on purpose so you can see the counter handle it.

References
Smith, J. (2020). A study of things. Journal of Things, 4(2), 11–29.`,
    'sort-lines':
`Bengaluru
ahmedabad
Chennai
Delhi
ahmedabad
item 10
item 2
item 1
Mumbai
chennai`,
    'remove-duplicate-lines':
`skmuzamil1310@gmail.com
hello@example.com
SKMUZAMIL1310@GMAIL.COM
support@example.com
hello@example.com
  hello@example.com  
team@example.com`,
  };
  SAMPLE['case-converter'] = 'the state-of-the-art guide to seo for small businesses in india\nHOW TO CONVERT TEXT TO TITLE CASE\nmy_first_variable name';
  SAMPLE['remove-line-breaks'] = `This paragraph was pasted out of a PDF,
so every single line
ends where the column ended
rather than where the sentence does.

This second paragraph has the
same problem, and you want to keep
the paragraph split while joining these lines.`;

  /* ---- stat strip ---- */
  const STRIPS = {
    'word-counter': ['words', 'characters', 'sentences', 'paragraphs', 'reading', 'speaking'],
    'readability-checker': ['words', 'sentences', 'avgSentence', 'reading'],
    'case-converter': ['words', 'characters', 'lines'],
    'remove-line-breaks': ['lines', 'words', 'characters', 'paragraphs'],
    'sort-lines': ['lines', 'words', 'characters'],
    'remove-duplicate-lines': ['lines', 'unique', 'words', 'characters'],
  };
  const LABELS = {
    words: 'Words', characters: 'Characters', charactersNoSpaces: 'Characters (no spaces)',
    sentences: 'Sentences', paragraphs: 'Paragraphs', lines: 'Lines', unique: 'Unique lines',
    reading: 'Reading time', speaking: 'Speaking time', avgSentence: 'Avg sentence',
  };

  const strip = $('#strip');
  if (strip) {
    strip.innerHTML = (STRIPS[tool] || STRIPS['word-counter']).map((k) =>
      `<div class="strip__cell"><span class="strip__n" data-stat="${k}">0</span><span class="strip__k">${LABELS[k]}</span></div>`
    ).join('');
  }

  /* ---- panel scaffolding ---- */
  const panel = $('#panel');
  const card = (title, body, extra = '') =>
    `<section class="card"><div class="card__hd"><h2>${title}</h2><span class="grow"></span>${extra}</div><div class="card__bd">${body}</div></section>`;
  const rowSwitch = (id, t, d) =>
    `<label class="row"><span class="row__txt"><span class="row__t">${t}</span><span class="row__d">${d}</span></span>
     <span class="switch"><input type="checkbox" id="${id}"><span></span></span></label>`;

  function buildPanel() {
    if (!panel) return;
    if (tool === 'word-counter') {
      panel.innerHTML =
        card(_t('academic'),
          `<p class="hint">${_t('academicHint')}</p>
           ${rowSwitch('ac-citations', _t('excludeCitations'), _t('excludeCitationsD'))}
           ${rowSwitch('ac-refList', _t('excludeRefList'), _t('excludeRefListD'))}
           ${rowSwitch('ac-footnotes', _t('excludeFootnotes'), _t('excludeFootnotesD'))}
           ${rowSwitch('ac-headings', _t('excludeHeadings'), _t('excludeHeadingsD'))}
           ${rowSwitch('ac-quotes', _t('excludeQuotes'), _t('excludeQuotesD'))}
           ${rowSwitch('ac-urls', _t('excludeUrls'), _t('excludeUrlsD'))}
           <div id="acOut"></div>`) +
        card(_t('detectedScript'), `<div class="chips" id="scripts"></div>
           <p class="hint">${_t('scriptHint')}</p>`) +
        card(_t('mostUsedWords'), `<div id="freq"></div>`,
          `<label class="hint" style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="stopw" checked> ${_t('hideCommon')}</label>`);
    } else if (tool === 'case-converter') {
      panel.innerHTML =
        card(_t('titleCaseStyle'),
          `<select class="sel" id="caseStyle">
             <option value="ap">AP style — lowercase short prepositions</option>
             <option value="chicago">Chicago style — more words lowercased</option>
             <option value="mla">MLA style</option>
           </select>
           <p class="hint">${_t('titleCaseHint')}</p>`) +
        card(_t('convert'), `<div class="acts" id="caseActs"></div>`) +
        card(_t('preview'), `<div id="casePrev"></div>`);
    } else if (tool === 'readability-checker') {
      panel.innerHTML =
        card(_t('freTitle'),
          `<div class="gauge">
             <div class="gauge__n" id="freN">—</div>
             <div class="gauge__lbl" id="freL">${_t('freStart')}</div>
             <div class="gauge__track"><div class="gauge__pin" id="frePin" style="left:0%"></div></div>
             <div class="gauge__ticks"><span>${_t('freHard')}</span><span>${_t('frePlain')}</span><span>${_t('freEasy')}</span></div>
           </div>`) +
        card(_t('gradeTitle'), `<div class="metrics" id="grades"></div>
           <p class="hint">${_t('gradeHint')}</p>`) +
        card(_t('fixTitle'), `<div id="finds"></div>`);
    } else if (tool === 'remove-line-breaks') {
      panel.innerHTML =
        card(_t('brOptions'),
          `${rowSwitch('br-keepParagraphs', _t('keepParagraphs'), _t('keepParagraphsD'))}
           ${rowSwitch('br-collapseSpaces', _t('collapseSpaces'), _t('collapseSpacesD'))}`) +
        card(_t('brClean'), `<div class="acts" id="brActs"></div>`) +
        card(_t('brPreview'), `<div id="brPrev"></div>`);
    } else if (tool === 'sort-lines') {
      panel.innerHTML =
        card(_t('sortTitle'),
          `<select class="sel" id="sortMode">
             <option value="alpha">${_t('sortAlpha')}</option>
             <option value="length">${_t('sortByLen')}</option>
             <option value="reverse">${_t('sortReverse')}</option>
             <option value="random">${_t('sortShuffle')}</option>
           </select>
           ${rowSwitch('so-desc', _t('sortDesc'), _t('sortDescD'))}
           ${rowSwitch('so-natural', _t('sortNatural'), _t('sortNaturalD'))}
           ${rowSwitch('so-caseSensitive', _t('sortCase'), _t('sortCaseD'))}
           ${rowSwitch('so-ignoreEmpty', _t('sortDropEmpty'), '')}`) +
        card(_t('sortApply'), `<div class="acts" id="soActs"></div>`) +
        card(_t('preview'), `<div id="soPrev"></div>`);
    } else if (tool === 'remove-duplicate-lines') {
      panel.innerHTML =
        card(_t('dedupeTitle'),
          `${rowSwitch('dd-caseSensitive', _t('dedupeCase'), _t('dedupeCaseD'))}
           ${rowSwitch('dd-ignoreWhitespace', _t('dedupeWs'), _t('dedupeWsD'))}
           ${rowSwitch('dd-onlyDuplicates', _t('dedupeOnly'), _t('dedupeOnlyD'))}`) +
        card(_t('sortApply'), `<div class="acts" id="ddActs"></div>`) +
        card(_t('dedupeFound'), `<div id="ddOut"></div>`);
    }
    wirePanel();
  }

  const act = (label, ex, fn) => ({ label, ex, fn });
  let refreshPreviews = null;
  function renderActs(host, list) {
    const el = $(host); if (!el) return;
    el.innerHTML = list.map((a, i) => `<button class="act" type="button" data-i="${i}"><span class="act__lb">${esc(a.label)}</span>${a.ex ? `<span class="act__ex">${esc(a.ex)}</span>` : ''}</button>`).join('');
    el.onclick = (e) => { const b = e.target.closest('.act'); if (b) list[+b.dataset.i].fn(); };
  }

  function wirePanel() {
    // Academic switches
    Object.keys(state.academic).forEach((k) => {
      const el = $(`#ac-${k}`); if (!el) return;
      el.checked = state.academic[k];
      el.addEventListener('change', () => { state.academic[k] = el.checked; render(); });
    });
    $('#stopw')?.addEventListener('change', render);

    // Case converter
    $('#caseStyle')?.addEventListener('change', (e) => { state.caseStyle = e.target.value; render(); });
    // Previews run on the user's own first line, so you see what will happen to YOUR
    // text rather than to a stock pangram. Falls back to a sample when the editor is empty.
    const SAMPLE = 'the state-of-the-art guide to SEO';
    const specimen = () => {
      const line = (editor.value.split('\n').find((l) => l.trim()) || '').trim();
      return line ? line.slice(0, 42) : SAMPLE;
    };
    const caseFns = [];
    const caseAct = (label, fn, toast) => {
      caseFns.push(fn);
      let preview;
      try { preview = fn(specimen()); } catch (_) { preview = ''; }
      return act(label, preview, () => setText(fn(editor.value), toast));
    };
    const caseList = [
      caseAct('Title Case', (t) => TK.CASES.title(t, { style: state.caseStyle }), 'Converted to title case'),
      caseAct('Sentence case', (t) => TK.CASES.sentence(t, loc()), 'Converted to sentence case'),
      caseAct('Capitalise Each Word', TK.CASES.capitalize, 'Capitalised each word'),
      caseAct('UPPERCASE', TK.CASES.upper, 'Converted to uppercase'),
      caseAct('lowercase', TK.CASES.lower, 'Converted to lowercase'),
      caseAct('camelCase', TK.CASES.camel, 'Converted to camelCase'),
      caseAct('PascalCase', TK.CASES.pascal, 'Converted to PascalCase'),
      caseAct('snake_case', TK.CASES.snake, 'Converted to snake_case'),
      caseAct('CONSTANT_CASE', TK.CASES.constant, 'Converted to CONSTANT_CASE'),
      caseAct('kebab-case', TK.CASES.kebab, 'Converted to kebab-case'),
      caseAct('dot.case', TK.CASES.dot, 'Converted to dot.case'),
      caseAct('aLtErNaTiNg', TK.CASES.alternate, 'Converted to alternating case'),
      caseAct('iNVERSE CASE', TK.CASES.inverse, 'Inverted case'),
    ];
    renderActs('#caseActs', caseList);
    // Previews are recomputed on every keystroke so they always mirror the current text.
    if ($('#caseActs')) {
      refreshPreviews = () => {
        const host = $('#caseActs'); if (!host) return;
        const spec = specimen();
        host.querySelectorAll('.act').forEach((b, i) => {
          const ex = b.querySelector('.act__ex'); if (!ex || !caseFns[i]) return;
          try { ex.textContent = caseFns[i](spec); } catch (_) { /* leave the last good preview */ }
        });
      };
      refreshPreviews();
    }

    // Line breaks
    ['keepParagraphs', 'collapseSpaces'].forEach((k) => {
      const el = $(`#br-${k}`); if (!el) return;
      el.checked = state.breaks[k];
      el.addEventListener('change', () => { state.breaks[k] = el.checked; render(); });
    });
    renderActs('#brActs', [
      act('Remove line breaks', '', () => setText(TK.LINES.removeBreaks(editor.value, state.breaks), 'Line breaks removed')),
      act('Remove empty lines', '', () => setText(TK.LINES.removeEmpty(editor.value), 'Empty lines removed')),
      act('Trim every line', '', () => setText(TK.LINES.trimLines(editor.value), 'Lines trimmed')),
      act('Collapse extra spaces', '', () => setText(TK.UTIL.collapseSpaces(editor.value), 'Extra spaces collapsed')),
      act('Strip HTML tags', '', () => setText(TK.UTIL.stripHtml(editor.value), 'HTML tags stripped')),
      act('Remove invisible characters', '', () => setText(TK.UTIL.zeroWidth(editor.value), 'Invisible characters removed')),
    ]);

    // Sort
    $('#sortMode')?.addEventListener('change', (e) => { state.sort.mode = e.target.value; render(); });
    ['desc', 'natural', 'caseSensitive', 'ignoreEmpty'].forEach((k) => {
      const el = $(`#so-${k}`); if (!el) return;
      el.checked = state.sort[k];
      el.addEventListener('change', () => { state.sort[k] = el.checked; render(); });
    });
    renderActs('#soActs', [
      act('Sort the lines', '', () => setText(TK.LINES.sort(editor.value, state.sort), 'Lines sorted')),
      act('Number the lines', '1. first', () => setText(TK.LINES.addNumbers(editor.value, {}), 'Lines numbered')),
      act('Reverse line order', '', () => setText(TK.LINES.reverseText(editor.value, { mode: 'lines' }), 'Line order reversed')),
    ]);

    // Dedupe
    ['caseSensitive', 'ignoreWhitespace', 'onlyDuplicates'].forEach((k) => {
      const el = $(`#dd-${k}`); if (!el) return;
      el.checked = state.dedupe[k];
      el.addEventListener('change', () => { state.dedupe[k] = el.checked; render(); });
    });
    renderActs('#ddActs', [
      act('Remove duplicates', '', () => { const r = TK.LINES.dedupe(editor.value, { ...state.dedupe, onlyDuplicates: false }); setText(r.text, `${r.removed} duplicate line${r.removed === 1 ? '' : 's'} removed`); }),
      act('Keep only duplicates', '', () => { const r = TK.LINES.dedupe(editor.value, { ...state.dedupe, onlyDuplicates: true }); setText(r.text, 'Showing duplicates only'); }),
      act('Also sort the result', '', () => { const r = TK.LINES.dedupe(editor.value, state.dedupe); setText(TK.LINES.sort(r.text, state.sort), 'Deduplicated and sorted'); }),
    ]);
  }

  const loc = () => (state.locale === 'auto' ? TK.bestLocale(editor.value) : state.locale);
  const emptyState = (msg) => `<div class="empty">${ICON.empty}<p>${msg}</p></div>`;

  /* ---- the render loop ---- */
  let raf = 0, heavy = 0;
  function render() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const text = editor.value;
      store.set('tk-draft', text);
      const c = TK.count(text, loc());

      const put = (k, v) => { const el = $(`[data-stat="${k}"]`); if (el) el.textContent = v; };
      put('words', n(c.words));
      put('characters', n(c.characters));
      put('charactersNoSpaces', n(c.charactersNoSpaces));
      put('sentences', n(c.sentences));
      put('paragraphs', n(c.paragraphs));
      put('lines', n(c.lines));
      if (refreshPreviews) refreshPreviews();
      put('reading', TK.duration(c.readingSeconds));
      put('speaking', TK.duration(c.speakingSeconds));
      put('avgSentence', c.sentences ? (c.avgWordsPerSentence).toFixed(1) : '0');
      if ($('[data-stat="unique"]')) {
        const r = TK.LINES.dedupe(text, state.dedupe);
        put('unique', n(c.lines - r.removed));
      }

      clearTimeout(heavy);
      heavy = setTimeout(() => renderPanel(text, c), 90);
    });
  }

  function renderPanel(text, c) {
    /* --- word counter --- */
    if ($('#acOut')) {
      const on = Object.values(state.academic).some(Boolean);
      if (!on || !text.trim()) {
        $('#acOut').innerHTML = `<p class="hint" style="margin-top:var(--space-3)">${on ? _t('nothingYet') : _t('nothingToCompare')}</p>`;
      } else {
        const stripped = TK.stripAcademic(text, state.academic);
        const sc = TK.count(stripped, loc());
        const diff = c.words - sc.words;
        $('#acOut').innerHTML =
          `<div class="metrics" style="margin-top:var(--space-3)">
             <div class="metric"><span class="metric__k">${_t('rawCount')}</span><span class="metric__v">${n(c.words)}</span></div>
             <div class="metric"><span class="metric__k">${_t('countableWords')}</span><span class="metric__v" style="color:var(--accent)">${n(sc.words)}</span></div>
             <div class="metric"><span class="metric__k">${_t('excluded')}</span><span class="metric__v">${diff >= 0 ? '−' : '+'}${n(Math.abs(diff))}</span></div>
           </div>`;
      }
    }
    if ($('#scripts')) {
      const found = TK.detectScripts(text);
      $('#scripts').innerHTML = found.length
        ? found.map((s) => `<span class="chip chip--on">${s}</span>`).join('')
          + `<span class="chip">segmenting as <strong style="font-family:var(--font-mono)">${loc()}</strong></span>`
        : '<span class="chip">No text yet</span>';
    }
    if ($('#freq')) {
      const list = TK.frequency(c.wordList, $('#stopw')?.checked).slice(0, 8);
      $('#freq').innerHTML = list.length
        ? `<div class="metrics">${list.map(([w, k]) =>
            `<div class="metric"><span class="metric__k">${esc(w)}</span><span class="metric__v">${k}<span class="metric__g"> · ${((k / c.words) * 100).toFixed(1)}%</span></span></div>`).join('')}</div>`
        : emptyState('Word frequency appears once you add some text.');
    }

    /* --- case converter preview --- */
    if ($('#casePrev')) {
      const sample = (c.sentenceList[0] || text).slice(0, 120);
      $('#casePrev').innerHTML = sample.trim()
        ? `<div class="diff">
             <div class="diff__row"><span class="diff__tag">Now</span><span class="diff__val">${esc(sample)}</span></div>
             <div class="diff__row"><span class="diff__tag">Title</span><span class="diff__val diff__val--new">${esc(TK.CASES.title(sample, { style: state.caseStyle }))}</span></div>
             <div class="diff__row"><span class="diff__tag">Sentence</span><span class="diff__val diff__val--new">${esc(TK.CASES.sentence(sample, loc()))}</span></div>
           </div>`
        : emptyState('A live before-and-after preview appears here.');
    }

    /* --- readability --- */
    if ($('#freN')) {
      const r = TK.readability(text, loc());
      if (!r) {
        $('#freN').textContent = '—';
        $('#freL').textContent = _t('noSentence');
        $('#frePin').style.left = '0%';
        $('#grades').innerHTML = '';
        $('#finds').innerHTML = emptyState(_t('noFinding'));
      } else {
        const fre = Math.max(0, Math.min(100, r.fleschReadingEase));
        $('#freN').textContent = r.fleschReadingEase.toFixed(0);
        $('#freN').style.color = fre >= 60 ? 'var(--success)' : fre >= 45 ? 'var(--warning)' : 'var(--danger)';
        $('#freL').innerHTML = `<strong>${r.band}</strong> · readable at ${r.gradeLabel}`;
        $('#frePin').style.left = `calc(${fre}% - 1.5px)`;
        const g = [
          ['Flesch–Kincaid', r.fleschKincaidGrade, _t('grade')],
          ['Gunning Fog', r.gunningFog, _t('grade')],
          ['SMOG', r.smog, _t('grade')],
          ['Coleman–Liau', r.colemanLiau, _t('grade')],
          ['Automated Readability', r.automatedReadability, _t('grade')],
        ];
        $('#grades').innerHTML = `<div class="metrics">${g.map(([k, v]) =>
          `<div class="metric"><span class="metric__k">${k}</span><span class="metric__v">${v.toFixed(1)}<span class="metric__g"> ${_t('grade')}</span></span></div>`).join('')
          }<div class="metric"><span class="metric__k">${_t('avgWords')}</span><span class="metric__v">${r.avgWordsPerSentence.toFixed(1)}</span></div>
           <div class="metric"><span class="metric__k">${_t('passive')}</span><span class="metric__v">${r.passiveSentences}<span class="metric__g"> ${_t('of')} ${r.sentences}</span></span></div></div>`;
        $('#finds').innerHTML = r.findings.length
          ? `<div class="finds">${r.findings.map((f) =>
              `<div class="find ${f.score < 20 ? 'find--hard' : ''}">
                 <span class="find__meta">${f.words} words · reads at ${Math.max(0, f.score).toFixed(0)}</span>
                 <q>${esc(f.text.length > 180 ? f.text.slice(0, 180) + '…' : f.text)}</q>
               </div>`).join('')}</div>
             <p class="hint" style="margin-top:var(--space-3)">${_t('splitHint')}</p>`
          : `<div class="find" style="border-left-color:var(--success);background:var(--success-soft)">
               <span class="find__meta">${_t('nothingFlagged')}</span>
               <span>${_t('noFlagHint')}</span>
             </div>`;
      }
    }

    /* --- line-break preview --- */
    if ($('#brPrev')) {
      const before = text.slice(0, 160);
      $('#brPrev').innerHTML = before.trim()
        ? `<div class="diff">
             <div class="diff__row"><span class="diff__tag">${_t('before')}</span><span class="diff__val">${esc(before)}</span></div>
             <div class="diff__row"><span class="diff__tag">${_t('after')}</span><span class="diff__val diff__val--new">${esc(TK.LINES.removeBreaks(before, state.breaks))}</span></div>
           </div>`
        : emptyState(_t('pasteText'));
    }

    /* --- sort preview --- */
    if ($('#soPrev')) {
      const sorted = TK.LINES.sort(text, state.sort).split('\n').slice(0, 6);
      $('#soPrev').innerHTML = text.trim()
        ? `<div class="diff"><div class="diff__row"><span class="diff__tag">Result</span><span class="diff__val diff__val--new">${esc(sorted.join('\n'))}${text.split('\n').length > 6 ? '\n…' : ''}</span></div></div>`
        : emptyState(_t('pasteList'));
    }

    /* --- dedupe output --- */
    if ($('#ddOut')) {
      const r = TK.LINES.dedupe(text, state.dedupe);
      $('#ddOut').innerHTML = text.trim()
        ? `<div class="metrics">
             <div class="metric"><span class="metric__k">${_t('dupLines')}</span><span class="metric__v" style="color:${r.removed ? 'var(--accent)' : 'inherit'}">${n(r.removed)}</span></div>
             <div class="metric"><span class="metric__k">${_t('repValues')}</span><span class="metric__v">${n(r.duplicateGroups)}</span></div>
           </div>`
          + (r.top.length
            ? `<div class="finds" style="margin-top:var(--space-3)">${r.top.map(([v, k]) =>
                `<div class="find"><span class="find__meta">${_t('appears')} ${k} ${_t('times')}</span><q>${esc(v.slice(0, 80) || '(blank)')}</q></div>`).join('')}</div>`
            : `<p class="hint" style="margin-top:var(--space-3)">${_t('everyUnique')}</p>`)
        : emptyState(_t('pasteDedupe'));
    }
  }

  buildPanel();
  editor.addEventListener('input', render);
  render();
  if (!draft && tool !== 'home') editor.focus({ preventScroll: true });
})();
