"use strict";

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
exports.ChartArea = ChartArea;
