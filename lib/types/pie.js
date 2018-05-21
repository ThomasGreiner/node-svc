"use strict";

function getValues(wrapper, chart, colors, values) {
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
exports.getValues = getValues;
