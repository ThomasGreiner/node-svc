"use strict";

const fs = require("fs");
const path = require("path");

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
const rows = 5;
const legendLineLength = 18;
const legendLineHeight = 12;
const legendGap = 15;

function round(num, digits) {
  let factor = Math.pow(10, digits);
  return Math.round(num * factor) / factor;
}

function getMinMax(values, yStartMin) {
  values = Array.prototype.concat.apply([], values).filter((value) => !!value);
  let minValue = (yStartMin) ? Math.min.apply(Math, values) : 0;
  let maxValue = Math.max.apply(Math, values);
  return [minValue, maxValue];
}

function getPieValues(wrapper, chart, colors, values) {
  const diameter = chart.height / 2;
  const circumference = Math.PI * diameter;
  const total = values.reduce((prev, cur) => prev + cur, 0);
  let cur = total;
  return {
    chart: {
      circumference,
      diameter,
      radius: diameter / 2,
      x: wrapper.width / 2,
      y: wrapper.height / 2
    },
    values: values.map((value, idx) => {
      let pieValue = cur / total * circumference;
      cur -= value;
      return {
        color: colors[idx] || "#AAA",
        value: pieValue
      };
    })
  };
}

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
    let pieValues = getPieValues(wrapper, chart, data.colors, data.values);
    result.chart = pieValues.chart;
    result.values = pieValues.values;
    return result;
  }
  
  result.drawVerticalLines = data.display.has("vertical-lines");
  result.chart = {
    height: chart.toHeight(1),
    xEnd: chart.toX(1),
    yEnd: chart.toY(1),
    yStart: chart.toY(0)
  };
  
  let minmaxValue = getMinMax(data.values, data.display.has("y-start-min"));
  let minValue = minmaxValue[0];
  let maxValue = minmaxValue[1];
  let range = maxValue - minValue;
  let groupWidth = 1 / data.x.length;
  
  result.xAxis = data.x.map((value, idx) => {
    return {
      label: value,
      x: chart.toX(idx / data.x.length),
      xText: chart.toX(idx * groupWidth + groupWidth / 2),
      yHeight: chart.toHeight(1),
      yStart: chart.toY(0),
      yEnd: chart.toY(1)
    };
  });
  
  result.yAxis = [];
  for (let i = 0; i < rows + 1; i++) {
    result.yAxis.push({
      // TODO: allow for more flexible precision
      label: round(minValue + i / rows * range, 1),
      width: chart.toWidth(1),
      x: chart.toX(0),
      y: chart.toY((rows - i) / rows)
    });
  }
  
  switch (data.type) {
    case "bar-grouped":
      result.values = data.x.map((value, idxX) => {
        let barWidth = groupWidth / (data.values[idxX].length + 2);
        return data.values[idxX].map((value, idxV) => {
          return {
            color: data.colors[idxV] || "#AAA",
            height: chart.toHeight((value - minValue) / range),
            width: chart.toWidth(barWidth),
            x: chart.toX(idxX * groupWidth + (idxV + 1) * barWidth),
            y: chart.toY(1 - (value - minValue) / range)
          };
        });
      });
      break;
    case "line":
      result.values = data.y.map((value, idxY) => {
        return {
          color: data.colors[idxY] || "#AAA",
          values: data.values.map((value, idxX) => {
            if (value[idxY] === null)
              return null;
            
            return {
              x: chart.toX(idxX / data.x.length + groupWidth / 2),
              y: chart.toY(1 - (value[idxY] - minValue) / range)
            };
          })
        };
      });
      break;
  }
  return result;
}
exports.getTemplateValues = getTemplateValues;
