function processMarkdownToHtml(mdString) {
  // console.log("Rendering");
  // First, tabs -> spaces
  mdString = mdString.replace(/\t/g, "  ");

  // --- Obsidian-flavored Markdown Table Parsing ---
  // This will extract tables and replace them with HTML before further processing.
  // If a table is too wide (>6 columns), render as a card per row.
  const TABLE_CARD_COLUMN_THRESHOLD = 6;

  function parseMarkdownTable(tableText) {
    // Split into lines, trim empty
    /*
    // Wastes CPU cycles
    var data = tableText.match(/^\|(?![\S:-]+\|$).*?\|$/gm).map((row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0),
    );
    data = data
      .slice(1)
      .map((row) =>
        data[0].map((value, index) => ({
          [value.toLowerCase()]: row[index] || "",
        })),
      )
      .map((row) =>
        row.reduce((obj, curr) => {
          obj[Object.keys(curr)[0]] = Object.values(curr)[0];
          return obj;
        }, {}),
      );
      console.log(data);
    */
    const lines = tableText
      .trim()
      .split("\n")
      .filter((l) => l.trim().length > 0);
    if (lines.length < 2) return tableText; // Not a valid table

    // Parse header and separator
    const header = lines[0]
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    const separator = lines[1]
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    // Validate separator (should be dashes)
    if (!separator.every((cell) => /^:?-{3,}:?$/.test(cell))) return tableText;

    // Parse rows
    const rows = lines.slice(2).map((line) =>
      line
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    );

    // If any row has a different number of columns, skip parsing
    if (rows.some((row) => row.length !== header.length)) return tableText;

    // Render both table and card views, wrapped in a responsive container
    // Table view
    const tableHtml =
      '<table class="md-table"><thead><tr>' +
      header.map((h) => `<th>${h}</th>`).join("") +
      "</tr></thead><tbody>" +
      rows
        .map(
          (row) =>
            "<tr>" + row.map((cell) => `<td>${cell}</td>`).join("") + "</tr>",
        )
        .join("") +
      "</tbody></table>";

    // Card view
    const cardHtml =
      '<div class="md-table-cards">' +
      rows
        .map(
          (row) =>
            '<div class="md-table-card">' +
            header
              .map(
                (key, i) =>
                  `<div class="md-table-card-row"><span class="md-table-card-key">${key}</span>: <span class="md-table-card-value">${row[i] || ""}</span></div>`,
              )
              .join("") +
            "</div>",
        )
        .join("") +
      "</div>";

    // Responsive wrapper: both views, only one shown at a time by client JS
    return (
      '<div class="md-table-responsive">' +
      '<div class="md-table-view">' +
      tableHtml +
      "</div>" +
      '<div class="md-card-view" style="display:none">' +
      cardHtml +
      "</div>" +
      "</div>"
    );
  }

  // Replace all markdown tables with HTML
  mdString = mdString.replace(
    // Match tables: header, separator, and consecutive rows starting with |, stop at first blank or non-pipe line
    /((\|.*\|)+\s)+/gm,
    (match) => parseMarkdownTable(match),
  );

  // Headings
  mdString = mdString.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  mdString = mdString.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  mdString = mdString.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  mdString = mdString.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  mdString = mdString.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  mdString = mdString.replace(/^###### (.*$)/gm, "<h6>$1</h6>");

  //Bold, ignore escaped characters
  mdString = mdString.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");

  //Highlight
  mdString = mdString.replace(/==([\s\S]*?)==/g, "<mark>$1</mark>");

  //Italics, ignore escaped characters
  mdString = mdString.replace(/(?<!\\)\*([\s\S]*?)(?<!\\)\*/g, "<em>$1</em>");
  // mdString = mdString.replace(/\\\*/g, "*");

  // Then process the regular markdown links
  // Images, ignore escaped characters
  mdString = mdString.replace(
    /\!\[([^\]]+)\]\((.*?(?=\)\s|$))\)/g,
    '<img src="$2">',
  );

  // Links, ignore escaped characters
  mdString = mdString.replace(
    /(?<!\\)\[([^\]]+)(?<!\\)\]\(([^\)]+)(?<!\\)\)/g,
    '<a href="$2">$1</a>',
  );

  var highestLevel = 0;
  mdString = mdString.replace(/^(\s*)- (.*$)/gm, (match, indent, content) => {
    const spaces = indent.length;
    const level = Math.floor(spaces / 2);
    if (level > highestLevel) highestLevel = level;
    return `<li class="indent-level-${level}">${content}</li>`;
  });

  // Wrap all li elements in a ul tag
  mdString = mdString.replace(
    /(<li[^>]*>.*?<\/li>(?:\n|$))+/g,
    "<ul>\n$&</ul>\n",
  );

  // Blockquotes
  mdString = mdString.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");

  // Split into lines and wrap normal text in <p> tags
  mdString = mdString.replace(/\\(\S)/gm, "$1");
  const lines = mdString.split("\n");
  // List of block-level HTML tags to skip wrapping in <p>
  const blockTags = [
    "h[1-6]",
    "li",
    "blockquote",
    "ul",
    "ol",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "div",
    "img",
    "script",
    "style",
    "pre",
    "code",
    "figure",
    "figcaption",
    "section",
    "article",
    "aside",
    "footer",
    "header",
    "nav",
    "main",
    "form",
    "input",
    "button",
    "select",
    "option",
    "textarea",
    "label",
    "fieldset",
    "legend",
    "iframe",
    "canvas",
    "svg",
    "math",
    "video",
    "audio",
    "source",
    "object",
    "embed",
    "param",
    "picture",
    "map",
    "area",
    "hr",
    "br",
    "address",
    "details",
    "summary",
    "menu",
    "menuitem",
    "dialog",
    "output",
    "progress",
    "meter",
    "ruby",
    "rt",
    "rp",
    "bdi",
    "bdo",
    "wbr",
    "mark",
    "time",
    "data",
    "datalist",
    "samp",
    "kbd",
    "var",
    "sub",
    "sup",
    "small",
    "cite",
    "q",
    "abbr",
    "acronym",
    "dfn",
    "ins",
    "del",
    "s",
    "strike",
    "u",
    "b",
    "i",
    "em",
    "strong",
    "span",
    "a",
    "p",
    "center",
    "font",
    "base",
    "link",
    "meta",
    "title",
    "html",
    "body",
    "head",
    "colgroup",
    "col",
    "caption",
    "tfoot",
    "tbody",
    "thead",
    "script",
    "noscript",
    "template",
    "slot",
    "custom-element",
  ];
  const blockTagRegex = new RegExp(
    `^<(${blockTags.join("|")})[ >/]|^</(${blockTags.join("|")})[ >/]`,
    "i",
  );

  const wrappedLines = lines.map((line) => {
    // Empty lines are replaced with a zero-width space
    if (line.trim() === "") return '<p class="empty-line">&#10240;&#x2800;</p>';
    // Don't wrap if it's a block-level HTML tag
    if (blockTagRegex.test(line)) return line;
    const match = line.match(/^(\s*)/)[0];
    const spaces = match.length;
    // 1 indent = 2 spaces
    const level = Math.floor(spaces / 2);
    if (level > highestLevel) highestLevel = level;
    return `<p class="normal-text indent-level-${level}">${line}</p>`;
  });
  // Join the lines back together
  mdString = wrappedLines.join("\n");
  return {
    content: mdString.trim(),
    listStyling: generateIndentCSS(highestLevel),
  };
}

function generateIndentCSS(levels) {
  let css = "";
  for (let i = 0; i <= levels; i++) {
    css += `.indent-level-${i} { margin-left: calc(var(--indent) * ${i}); }\n`;
  }
  return css;
}

function renderMarkdown(mdContent, title, backLocation, mdTemplate) {
  const htmlObject = processMarkdownToHtml(mdContent);
  let prettyTitle = "The Disconcerted Musings of Somebody | " + title;
  if (title.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/)) {
    prettyTitle = "Somebody's Daily Note: " + title;
  }
  return mdTemplate
    .replace(/\{\{ title \}\}/g, title)
    .replace(/\{\{ title-pretty \}\}/g, prettyTitle)
    .replace(/\{\{ content \}\}/g, htmlObject.content)
    .replace(/\{\{ back-location \}\}/g, backLocation)
    .replace(/\{\{ list-level-css \}\}/g, htmlObject.listStyling);
}

async function renderMarkdownFile(
  inPath,
  outPath,
  title,
  subdirName,
  mdTemplate,
  fs,
) {
  try {
    const mdContent = fs.readFileSync(inPath, "utf8");
    const renderedMd = renderMarkdown(
      mdContent,
      title,
      "/" + subdirName,
      mdTemplate,
    );
    fs.writeFileSync(outPath, renderedMd);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

module.exports = {
  render: renderMarkdownFile,
  process: processMarkdownToHtml,
  renderString: renderMarkdown,
};

/*
 * CSS to add for table/card rendering (add to your stylesheet):
 *
 * .md-table { border-collapse: collapse; width: 100%; margin: 1em 0; }
 * .md-table th, .md-table td { border: 1px solid #ccc; padding: 0.5em; }
 * .md-table-cards { display: flex; flex-wrap: wrap; gap: 1em; }
 * .md-table-card { border: 1px solid #ccc; border-radius: 6px; padding: 1em; min-width: 220px; background: #fafbfc; }
 * .md-table-card-row { margin-bottom: 0.3em; }
 * .md-table-card-key { font-weight: bold; }
 * .md-table-card-value { }
 *
 * Add this JS to your HTML template (once per page):
 * <script>
 * function updateTableCardView() {
 *   document.querySelectorAll('.md-table-responsive').forEach(container => {
 *     const tableView = container.querySelector('.md-table-view');
 *     const cardView = container.querySelector('.md-card-view');
 *     if (!tableView || !cardView) return;
 *     // Show card view if window is narrow or table is wider than viewport
 *     if (window.innerWidth < 700 || (tableView.scrollWidth > window.innerWidth - 40)) {
 *       tableView.style.display = 'none';
 *       cardView.style.display = '';
 *     } else {
 *       tableView.style.display = '';
 *       cardView.style.display = 'none';
 *     }
 *   });
 * }
 * window.addEventListener('resize', updateTableCardView);
 * window.addEventListener('DOMContentLoaded', updateTableCardView);
 * </script>
 */
