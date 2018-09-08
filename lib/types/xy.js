"use strict";

const rows = 5;

function flatten(values, isStacked) {
  if (isStacked) {
    return values.map((subValues) => {
      return subValues.reduce((sum, value) => sum + value, 0);
    });
  }
  
  return Array.prototype.concat.apply([], values).filter((value) => !!value);
}

function round(num, digits) {
  let factor = Math.pow(10, digits);
  return Math.round(num * factor) / factor;
}

function getValues(chart, data) {
  let result = {
    chart: {
      height: chart.toHeight(1),
      xEnd: chart.toX(1),
      yEnd: chart.toY(1),
      yStart: chart.toY(0)
    }
  };
  
  // Calculate dimensions of y-axis
  let values = flatten(data.values, data.type == "bar-stacked");
  let minValue = 0;
  if (data.display.has("y-start-min")) {
    minValue = Math.min(...values);
  }
  let maxValue = Math.max(...values);
  let range = maxValue - minValue;
  
  // Calculate dimensions of x-axis
  let groupWidth = 1 / data.x.length;
  let valueWidthRatio = 0.8;
  if (data.type == "bar-stacked" && data.display.has("flow")) {
    valueWidthRatio = 0.4;
  }
  let valueWidth = groupWidth * valueWidthRatio;
  let valuePadding = (groupWidth - valueWidth) / 2;
  
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
        let subvalueWidth = valueWidth / (data.values[idxX].length);
        return data.values[idxX].map((value, idxV) => {
          return {
            color: data.colors[idxV] || "#AAA",
            height: chart.toHeight((value - minValue) / range),
            width: chart.toWidth(subvalueWidth),
            x: chart.toX(
              idxX * groupWidth
              + valuePadding
              + idxV * subvalueWidth
            ),
            y: chart.toY(1 - (value - minValue) / range)
          };
        });
      });
      break;
    case "bar-stacked":
      let flows = [];
      let prevResult = null;
      result.values = data.x.map((value, idxX) => {
        let prevValue = 0;
        
        let result = data.values[idxX].map((value, idxV) => {
          let result = {
            color: data.colors[idxV] || "#AAA",
            height: chart.toHeight(value / range),
            width: chart.toWidth(valueWidth),
            x: chart.toX(idxX * groupWidth + valuePadding),
            y: chart.toY(1 - (value + prevValue) / range)
          };
          
          if (data.display.has("flow") && idxX > 0) {
            let prev = prevResult[idxV];
            
            // Only include flows where value exists on both sides
            if (result.height > 0 && prev.height > 0) {
              flows.push({
                color: data.colors[idxV],
                coords: [
                  [prev.x + prev.width, prev.y],
                  [result.x, result.y],
                  [result.x, result.y + result.height],
                  [prev.x + prev.width, prev.y + prev.height]
                ]
              });
            }
          }
          
          prevValue += value;
          return result;
        });
        
        prevResult = result;
        return result;
      });
      result.flows = flows;
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
exports.getValues = getValues;
