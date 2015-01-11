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

/*
 * Class
 */
var ElementSpotNews = function(options) {
	// data
	this.el = options.el;
	this.model = options.model;
	this.collectionClass = options.collection;
	this.templateFunc = options.template;

	// properties
	this.tree = {};
	this.element = {};
	this.collection = new this.collectionClass();
	// number of elements
	this.count = 0;

	// constructor
    this.model.bind('change', this.composite, this);
};

ElementSpotNews.prototype.composite = function(id) {
	// Get new view and build the subtree
	var model = this.collection.at(id);
	var tree = model.get('vtree');
	var element = model.get('element');

	// model state change
	// create the new tree
	model.set('title', 'click');
	var innerHtml = this.templateFunc( model.attributes )
						.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'');
	var newTree = convertHTML(innerHtml);

	// composition
	var patches = diff(tree, newTree);
	element = patch(element, patches);

	// finalize
	model.set('vtree', newTree);
	model.set('element', element);
};

ElementSpotNews.prototype.addWidget = function(options) {
	var model = new this.model();

	// Data persistence
	model.set('title', options.title);
	model.set('href', options.href);
	model.set('img', options.img);
	
	model.set('spotId', this.count);

	// 1. Get view and build the subtree (virtual DOM)
	//    - remove invalid characters
	var innerHtml = this.templateFunc( model.attributes )
						.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'');	
	var tree = convertHTML(innerHtml);

	// 2. Create an element
	var element = createElement(tree);

	// 3: composition boundary
	this.el.append(element); 

	// setup
	model.set('vtree', tree);
	model.set('element', element);
	this.collection.add(model, {at: this.count});
	this.count++;
};

module.exports = ElementSpotNews;