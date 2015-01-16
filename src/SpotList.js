// AutomationJS
// ------------
// v0.1.0-alpha1
//
// Copyright (c) 2015 Jollen Chen, Mokoversity Inc.
// Distributed under MIT license
//
// http://automationjs.com

/*
 * <SpotList></SpotList>
 *
 * ### Description
 *
 *  An element that display a list of headings (key points). This 
 *  element behaves like <ul>.
 *
 * ### Inheritance Hierarchy
 *
 *  Atomation
 *    Spot
 *
 */

/**
 * Imports
 */
var Automation = require('./Automation');


/**
 * class SpotList
 */
var SpotList = function(options) {
	this.super(options);
};

/*
 * public class SpotList extends Automation {}
 */
SpotList.extend(Automation);
SpotList.prototype.constructor = SpotList;

SpotList.prototype.add = function(options) {
	// super
	var model = this._add(options);
};

SpotList.prototype.composite = function(cid) {
	// super
	this._composite(cid);
};

module.exports = SpotList;