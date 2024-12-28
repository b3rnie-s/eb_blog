const { marked } = require('marked');
const { processThoughts } = require('./src/_11ty/collections/thoughtsCollection');

module.exports = function(eleventyConfig) {
    // Custom renderer for links
    const renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
        // If href is an object, use its href property
        const url = typeof href === 'object' ? href.href : href;
        const linkText = typeof href === 'object' ? href.text : text;
        
        // Handle empty links
        if (!url || url === '') {
            return `<span class="inspiration-title">${linkText}</span>`;
        }
        // Use normal link rendering for all other cases
        return `<a href="${url}">${linkText}</a>`;
    };

    marked.setOptions({
        renderer,
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

    eleventyConfig.addCollection("thoughts", processThoughts);

    // Copy static assets
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("CNAME");
    eleventyConfig.addPassthroughCopy("src/assets/fonts");
    eleventyConfig.addPassthroughCopy("src/_includes/js");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_includes/layouts"
        }
    };
};