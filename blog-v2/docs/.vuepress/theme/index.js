// .vuepress/theme/index.js

const { path } = require('@vuepress/utils')

module.exports = {
    name: "vuepress-theme-local",
    extends: "@vuepress/theme-default",
    layouts: path.resolve(__dirname, './layouts'),
};