"use strict";

const rows = 5;

function getMinMax(values, yStartMin) {
  values = Array.prototype.concat.apply([], values).filter((value) => !!value);
  let minValue = (yStartMin) ? Math.min.apply(Math, values) : 0;
  let maxValue = Math.max.apply(Math, values);
  return [minValue, maxValue];
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
  
  let yStartMin = (
    data.type != "bar-stacked"
    && data.display.has("y-start-min")
  );
  let [minValue, maxValue] = getMinMax(data.values, yStartMin);
  let range = maxValue - minValue;
  let groupWidth = 1 / data.x.length;
  let valueWidth = groupWidth * 0.8;
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
      result.values = data.x.map((value, idxX) => {
        let prevValue = 0;
        return data.values[idxX].map((value, idxV) => {
          let result = {
            color: data.colors[idxV] || "#AAA",
            height: chart.toHeight((value) / range),
            width: chart.toWidth(valueWidth),
            x: chart.toX(idxX * groupWidth + valuePadding),
            y: chart.toY(1 - (value + prevValue) / range)
          };
          prevValue += value;
          return result;
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
exports.getValues = getValues;
