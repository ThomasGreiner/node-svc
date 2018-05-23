"use strict";

const BLUE = [200, 50, 50];
const GREEN = [100, 50, 50];
const RED = [15, 80, 50];
const YELLOW = [50, 100, 50];

class Color {
  static get BLUE() {
    return new Color(BLUE);
  }
  
  static get GREEN() {
    return new Color(GREEN);
  }
  
  static get RED() {
    return new Color(RED);
  }
  
  static get YELLOW() {
    return new Color(YELLOW);
  }
  
  constructor([h, s, l]) {
    this.hue = h;
    this.saturation = s;
    this.lightness = l;
  }
  
  get hue() {
    return this._h;
  }
  set hue(h) {
    this._h = Math.max(0, Math.min(360, h));
    return this._h;
  }
  
  get saturation() {
    return this._s;
  }
  set saturation(s) {
    this._s = Math.max(0, Math.min(100, s));
    return this._s;
  }
  
  get lightness() {
    return this._l;
  }
  set lightness(l) {
    this._l = Math.max(0, Math.min(100, l));
    return this._l;
  }
  
  toString() {
    return `hsl(${this._h}, ${this._s}%, ${this._l}%)`;
  }
}

module.exports = Color;
