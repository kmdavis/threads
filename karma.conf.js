module.exports = (config) => {
    config.set({
        basePath: process.cwd(),
        browserify: {
            debug: true,
            transform: [["babelify", {
                presets: ["es2015"],
            }]],
        },
        browsers: [
            "Chrome",
        ],
        files: [
            "test_runner.js",
            { pattern: "tests/**/*.js", included: true },
        ],
        frameworks: [
            "browserify",
            "mocha",
        ],
        preprocessors: {
            "test_runner.js": ["browserify"],
            "tests/**/*.js": ["browserify"],
        },
        reporters: [
            "mocha",
        ],
        singleRun: false,
    });
};
