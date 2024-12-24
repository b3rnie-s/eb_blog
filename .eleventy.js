const { marked } = require('marked');

module.exports = function(eleventyConfig) {
    // Configure marked options
    marked.setOptions({
        gfm: true,
        breaks: true,
    });

    // Add markdown paired shortcode
    eleventyConfig.addPairedShortcode("markdown", function(content) {
        return marked.parse(content);
    });

    // Set up markdown library for .md files
    eleventyConfig.setLibrary("md", {
        render: content => marked.parse(content)
    });

    // Copy static assets
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("CNAME");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_includes/layouts"
        }
    };
};