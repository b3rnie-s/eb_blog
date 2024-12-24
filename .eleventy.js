module.exports = function(eleventyConfig) {
    // Copy the css directory to _site/css
    eleventyConfig.addPassthroughCopy("src/css");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_includes/layouts"
        }
    };
};