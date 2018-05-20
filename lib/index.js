"use strict";

const fs = require("fs");
const handlebars = require("handlebars");
const path = require("path");
const util = require("util");

const converter = require("./converter");

const readFile = util.promisify(fs.readFile);
const symValue = Symbol("value");
const templatePath = path.resolve(__dirname, "../chart.svg");

handlebars.registerHelper({
  switch: function(controlValue, opt) {
    let data;
    if (opt.data) {
      data = handlebars.createFrame(opt.data);
      data[symValue] = controlValue;
    }
    return opt.fn(this, {data});
  },
  case: function(value, opt) {
    if (value == opt.data[symValue])
      return opt.fn(this);
  },
  "if-equals": function(a, b, opt) {
    return (a === b) ? opt.fn(this) : opt.inverse(this);
  }
});

let asyncTemplate = readFile(templatePath)
  .then((content) => {
    content = content.toString();
    return handlebars.compile(content);
  });

async function getSVG(data) {
  let template = await asyncTemplate;
  let templateValues = await converter.getTemplateValues(data);
  return template(null, {data: {page: templateValues}});
}
exports.getSVG = getSVG;
