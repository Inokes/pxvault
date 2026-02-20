
const fs = require("fs");
const path = require("path");

class MarkdownIndexer {
  constructor(directory) {
    this.directory = directory;
  }

  generateIndex() {
    const files = fs.readdirSync(this.directory)
      .filter(file => file.endsWith(".md"));

    const index = files.map(file => ({
      title: this.extractTitle(file),
      file: file
    }));

    const outputPath = path.join(this.directory, "index.json");
    fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  }

  extractTitle(fileName) {
    return fileName
      .replace(".md", "")
      .replace(/-/g, " ");
  }
}

const mdPath = path.join(__dirname, "md");
const indexer = new MarkdownIndexer(mdPath);
indexer.generateIndex();
