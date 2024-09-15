const fs = require("fs");
const path = require("path");

const gitignoreFiles = [
  ".gitignore", // Main .gitignore file
  "next-app-template/.gitignore", // Add paths to other .gitignore files here
];

const outputGitignore = ".gitignore";

// Function to read and merge .gitignore files
function mergeGitignoreFiles(gitignoreFiles) {
  const ignoreSet = new Set();

  gitignoreFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.startsWith("#"));
      lines.forEach((line) => ignoreSet.add(line.trim()));
    } else {
      console.error(`File not found: ${file}`);
    }
  });

  const mergedContent = Array.from(ignoreSet).sort().join("\n");
  fs.writeFileSync(outputGitignore, mergedContent, "utf-8");
  console.log(`Merged .gitignore file created at: ${outputGitignore}`);
}

// Merge the .gitignore files
mergeGitignoreFiles(gitignoreFiles);
