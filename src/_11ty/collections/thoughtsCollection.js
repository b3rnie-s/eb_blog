const fs = require('fs');

function processThoughts() {
    const thoughtsFile = fs.readFileSync('src/_includes/thoughts.md', 'utf8');
    
    return thoughtsFile
        .split('\n---\n')
        .map(block => {
            const [dateLine, ...contentLines] = block.trim().split('\n');
            return {
                date: new Date(dateLine.trim()),
                content: contentLines.join('\n').trim()
            };
        })
        .sort((a, b) => b.date - a.date);
}

module.exports = { processThoughts }; 