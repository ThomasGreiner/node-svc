"use strict";

const fs = require("fs");
const path = require("path");

const typePie = require("./types/pie");
const typeXY = require("./types/xy");

class ChartArea {
  constructor(width, height) {
    this.parent = null;
    this._children = [];
    this._height = height;
    this._remaining = 0;
    this._width = width;
  }
  
  calcTop(child) {
    let top = 0;
    if (!this._isVertical)
      return this.top;
    
    for (let sibling of this._children) {
      if (sibling == child)
        break;
      
      top += sibling.height;
    }
    return top;
  }
  get top() {
    return (this.parent) ? this.parent.calcTop(this) : 0;
  }
  
  calcLeft(child) {
    let left = 0;
    if (this._isVertical)
      return this.left;
    
    for (let sibling of this._children) {
      if (sibling == child)
        break;
      
      left += sibling.width;
    }
    return left;
  }
  get left() {
    return (this.parent) ? this.parent.calcLeft(this) : 0;
  }
  
  calcWidth(child) {
    return (this._isVertical) ? this.width || 0 : this._remaining;
  }
  get width() {
    return this._width || this.parent.calcWidth(this);
  }
  
  calcHeight(child) {
    return (this._isVertical) ? this._remaining : this.height || 0;
  }
  get height() {
    return this._height || this.parent.calcHeight(this);
  }
  
  setLayout(layout, isVertical) {
    let prop = (isVertical) ? "height" : "width";
    this._remaining = this[prop];
    
    this._isVertical = isVertical;
    this._children = layout.map((node) => {
      let child = node;
      if (child instanceof ChartArea) {
        child.parent = this;
        this._remaining -= child[`_${prop}`] || 0;
      } else {
        child = new ChartArea(null, null);
        child.parent = this;
        child.setLayout(node, !isVertical);
      }
      return child;
    });
  }
  
  toHeight(ratio) {
    return ratio * this.height;
  }
  
  toWidth(ratio) {
    return ratio * this.width;
  }
  
  toX(ratio) {
    return this.left + this.toWidth(ratio);
  }
  
  toY(ratio) {
    return this.top + this.toHeight(ratio);
  }
}

const colors = ["red", "green", "blue", "yellow"];
const legendLineLength = 18;
const legendLineHeight = 12;
const legendGap = 15;

function getTemplateValues(data) {
  data.colors = data.colors || colors;
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
  return result;
}
exports.getTemplateValues = getTemplateValues;
