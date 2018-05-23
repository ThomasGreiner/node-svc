"use strict";

const fs = require("fs");
const path = require("path");

const typePie = require("./types/pie");
const typeXY = require("./types/xy");
const {ChartArea} = require("./area");
const Color = require("./color");

const defaultColors = [Color.RED, Color.GREEN, Color.BLUE, Color.YELLOW];
const legendLineLength = 18;
const legendLineHeight = 12;
const legendGap = 15;

function getTemplateValues(data) {
  data.colors = data.colors || defaultColors;
  data.display = new Set(data.display || []);
  
  const wrapper = new ChartArea(1000, 500);
  const chart = new ChartArea(null, null);
  const legend = new ChartArea(160, null);
  const xAxis = new ChartArea(null, 80);
  const yAxis = new ChartArea(80, null);
  wrapper.setLayout([
    new ChartArea(null, 40),
    [yAxis, chart, legend],
    xAxis
  ], true);
  
  let result = {
    height: wrapper.height,
    type: data.type,
    values: [],
    width: wrapper.width
  };
  
  let legendY = legend.toY(0);
  result.legend = data.y.map((value, idx) => {
    let lines = [""];
    let line = 0;
    let words = value.split(/\s+/);
    for (let word of words) {
      if (lines[line].length + word.length + 1 <= legendLineLength) {
        lines[line] += ` ${word}`;
      } else {
        if (word.length > legendLineLength) {
          word = `${word.substr(0, legendLineLength - 1)}…`;
        }
        if (lines[line].length > 0) {
          line++;
        }
        lines[line] = word;
      }
    }
    let result = {
      color: data.colors[idx] || "#AAA",
      lines: lines.map((line, idx) => {
        return {
          label: line,
          x: legend.toX(0) + legendLineLength,
          y: legendY + idx * legendLineHeight
        };
      }),
      x: legend.toX(0) + legendLineLength,
      y: legendY
    };
    legendY += lines.length * legendLineHeight + legendGap;
    return result;
  });
  
  if (data.type == "pie") {
    let pieValues = typePie.getValues(wrapper, chart, data.colors, data.values);
    result.chart = pieValues.chart;
    result.values = pieValues.values;
    return result;
  }
  
  let xyValues = typeXY.getValues(chart, data);
  result.drawVerticalLines = data.display.has("vertical-lines");
  result.chart = xyValues.chart;
  result.xAxis = xyValues.xAxis;
  result.yAxis = xyValues.yAxis;
  result.values = xyValues.values;
  if (xyValues.flows) {
    result.flows = xyValues.flows;
  }
  return result;
}
exports.getTemplateValues = getTemplateValues;
