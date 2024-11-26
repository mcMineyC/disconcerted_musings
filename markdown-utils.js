function processMarkdownToHtml(mdString) {
  // console.log("Rendering");
  // First, tabs -> spaces
  mdString = mdString.replace(/\t/g, "  ");

  // Headings
  mdString = mdString.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  mdString = mdString.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  mdString = mdString.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  mdString = mdString.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  mdString = mdString.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  mdString = mdString.replace(/^###### (.*$)/gm, "<h6>$1</h6>");

  //Bold, ignore escaped characters
  mdString = mdString.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");

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
  mdString = mdString.replace(/(<li[^>]*>.*?<\/li>(?:\n|$))+/g, "<ul>$&</ul>");

  // Blockquotes
  mdString = mdString.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");

  // Split into lines and wrap normal text in <p> tags
  mdString = mdString.replace(/\\(\S)/gm, "$1");
  const lines = mdString.split("\n");
  const wrappedLines = lines.map((line) => {
    // Empty lines are replaced with a zero-width space
    if (line.trim() === "") return '<p class="empty-line">&#10240;&#x2800;</p>';
    //Don't wrap if it's a heading, list item, blockquote
    if (line.match(/^<(h[1-6]|li|blockquote|ul|ol)/)) return line;
    const match = line.match(/^(\s*)/)[0].replace(/\t/g, "  ");
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
