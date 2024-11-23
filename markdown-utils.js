function processMarkdownToHtml(mdString) {
  mdString = mdString.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  mdString = mdString.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  mdString = mdString.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  mdString = mdString.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  mdString = mdString.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  mdString = mdString.replace(/^###### (.*$)/gm, "<h6>$1</h6>");
  mdString = mdString.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  mdString = mdString.replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");

  mdString = mdString.replace(/\\(\[|\])/g, "{{ESCAPED_BRACKET_$1}}");

  // Then process the regular markdown links
  mdString = mdString.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g,
    '<a href="$2">$1</a>',
  );

  // Finally, restore the escaped brackets by removing the backslash
  mdString = mdString.replace(/{{ESCAPED_BRACKET_(\[|\])}}/g, "$1");

  var highestLevel = 0;
  mdString = mdString.replace(
    /^( *)- (.*$)/gm,
    function (match, indent, content) {
      const spaces = indent.length;
      const level = Math.floor(spaces / 2);
      if (level > highestLevel) highestLevel = level;
      return `<li class="indent-level-${level}" style="--list-level: ${level}">${content}</li>`;
    },
  );

  // mdString = mdString.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");
  // mdString = mdString.replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>");
  mdString = mdString.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");

  // Split into lines and wrap normal text in <p> tags
  const lines = mdString.split("\n");
  const wrappedLines = lines.map((line) => {
    if (line.trim() === "") return '<p class="empty-line">&#10240;&#x2800;</p>';
    if (line.match(/^<(h[1-6]|li|blockquote|ul|ol)/)) return line;
    const match = line.match(/^(\W*)/)[0].replace(/\t/g, "  ");
    const spaces = match.length;
    const level = Math.floor(spaces / 2);
    if (level > highestLevel) highestLevel = level;
    return `<p class="normal-text indent-level-${level}">${line}</p>`;
  });
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

async function renderMarkdownFile(inPath, outPath, title, subdirName, fs) {
  try {
    const mdContent = fs.readFileSync(inPath, "utf8");
    const mdTemplate = fs.readFileSync("./template.html", "utf8");
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
