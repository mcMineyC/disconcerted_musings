function processMarkdownToHtml(mdString) {
  mdString = mdString.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  mdString = mdString.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  mdString = mdString.replace(/^### (.*$)/gm, "<h3>$1</h3>");
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

async function renderMarkdownFile(inPath, outPath, fs) {
  try {
    const mdContent = fs.readFileSync(inPath, "utf8");
    console.log(mdContent);
    const htmlContent = processMarkdownToHtml(mdContent);
    fs.writeFileSync(outPath, htmlContent);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}
export const markdownUtils = {
  render: renderMarkdownFile,
  process: processMarkdownToHtml,
};
