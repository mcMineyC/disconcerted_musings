function processMarkdownToHtml(mdString) {
  mdString = mdString.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  mdString = mdString.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  mdString = mdString.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  mdString = mdString.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  mdString = mdString.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  mdString = mdString.replace(/^###### (.*$)/gm, "<h6>$1</h6>");
  mdString = mdString.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  mdString = mdString.replace(/\*(.*?)\*/g, "<em>$1</em>");
  mdString = mdString.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  mdString = mdString.replace(/^\* (.*$)/gm, "<li>$1</li>");
  mdString = mdString.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  mdString = mdString.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");
  mdString = mdString.replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>");
  mdString = mdString.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");
  mdString = mdString.replace(/\n\n([^\n]+)\n\n/g, "<p>$1</p>");
  return mdString.trim();
}

function renderMarkdown(mdContent, title, mdTemplate) {
  const htmlContent = processMarkdownToHtml(mdContent);
  let prettyTitle = "The Disconcerted Musings of Somebody | " + title;
  if (title.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/)) {
    prettyTitle = "Somebody's Daily Note: " + title;
  }
  return mdTemplate
    .replace(/\{\{ title \}\}/g, title)
    .replace(/\{\{ title-pretty \}\}/g, prettyTitle)
    .replace(/\{\{ content \}\}/g, htmlContent);
}

async function renderMarkdownFile(inPath, outPath, title, fs) {
  try {
    const mdContent = fs.readFileSync(inPath, "utf8");
    const mdTemplate = fs.readFileSync("./template.html", "utf8");
    const renderedMd = renderMarkdown(mdContent, title, mdTemplate);
    fs.writeFileSync(outPath, renderedMd);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

export const markdownUtils = {
  render: renderMarkdownFile,
  process: processMarkdownToHtml,
  renderString: renderMarkdown,
};
