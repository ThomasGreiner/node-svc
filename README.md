# Scalable Vector Charts

Creates SVG files from chart data.

## Requirements

- [Node.js](https://nodejs.org/en/)
- npm (included with Node.js)

## Installation

```sh
npm install --save <path-to-module>
```

## Usage

```js
const svc = require("svc");

let svg = svc.getSVG({...});
console.log(svg);
```

## Chart Data Format

- **string** type - _Chart type_
  - `bar-grouped`
  - `bar-stacked`
  - `line`
  - `pie`
- **string[]** [colors] - _Colors for y-axis (e.g. `#F00`)_
- **string[]** [display] - _Display options_
  - `flow` - _Show flow lines between values (only compatible with charts of type `bar-stacked`)_
  - `vertical-lines` - _Show vertical grid lines_
  - `y-start-min` - _Start y-axis at minimum value rather than `0` (incompatible with charts of type `bar-stacked`)_
- **number[]|string[]** x - _Labels for x-axis_
- **number[]|string[]** y - _Labels for y-axis_
- **number[][]** values - _Chart values_
