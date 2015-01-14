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
 * Browserify
 */
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');

/**
 * Setup
 */
var convertHTML = require('html-to-vdom')({
    VNode: VNode,
    VText: VText
});

/**
 * Imports
 */
var Automation = require('./Automation');

/*
 * Class
 */
var SpotList = function(options) {
	console.log('constructor: ' + options);
	//Automation.call(options);
};

//SpotList.prototype = new Automation();
//SpotList.prototype.constructor = SpotList;

module.exports = SpotList;