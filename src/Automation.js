/**
 * Browserify
 */
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var _ = require('underscore');

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
var Automation = function() {

};

/**
 * Container
 *
 * The container to store, retrieve child elements.
 * Borrowing this code from https://github.com/marionettejs/backbone.babysitter
 */
Automation.ChildElementContainerFactory = function () {

  // Container Constructor
  // ---------------------

  var Container = function(elem){
    this._elements = {};
    this._models = {};
    this._vtrees = {};
  };

  // Container Methods
  // -----------------

  Container.prototype = Object.create({
    // Add an element to this container. Stores the element
    // by `cid` and makes it searchable by the model
    // cid (and model itself). 
    add: function(options){
      var element = options.element
        , model = options.model
        , vtree = options.vtree
        , cid = options.cid;

      // store the element and index by cid
      this._elements[cid] = element;

      // store the model and index by cid
      this._models[cid] = model;

      // store the virtual dom (vtree) and index by cid
      this._vtrees[cid] = vtree;

      this._updateLength();
      return this;
    },

    // retrieve a element by its `cid` directly
    findElementByCid: function(cid){
      return this._elements[cid];
    },

    findVtreeByCid: function(cid) {
      return this._vtrees[cid];
    },

    findModelByCid: function(cid) {
      return this._models[cid];
    },

    updateVtreeByCid: function(cid, vtree) {
      this._vtrees[cid] = vtree;
    },

    updateElementByCid: function(cid, element) {
      this._elements[cid] = element;
    },

    // Remove a view by cid
    remove: function(cid){
      // remove the element from the container
      delete this._elements[cid];

      delete this._models[cid];

      delete this._vtrees[cid];

      // update the length
      this._updateLength();
      return this;
    },

    // Call a method on every view in the container,
    // passing parameters to the call method one at a
    // time, like `function.call`.
    call: function(method){
      this.apply(method, _.tail(arguments));
    },

    // Apply a method on every view in the container,
    // passing parameters to the call method one at a
    // time, like `function.apply`.
    apply: function(method, args){
      _.each(this._elements, function(elem){
        if (_.isFunction(elem[method])){
          elem[method].apply(elem, args || []);
        }
      });
    },

    // Update the `.length` attribute on this container
    _updateLength: function(){
      this.length = _.size(this._elements);
    }
  });

  // Borrowing this code from Backbone.Collection:
  // http://backbonejs.org/docs/backbone.html#section-106
  //
  // Mix in methods from Underscore, for iteration, and other
  // collection related features.
  var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter',
    'select', 'reject', 'every', 'all', 'some', 'any', 'include',
    'contains', 'invoke', 'toArray', 'first', 'initial', 'rest',
    'last', 'without', 'isEmpty', 'pluck'];

  _.each(methods, function(method) {
    Container.prototype[method] = function() {
      var elements = _.values(this._elements);
      var args = [elements].concat(_.toArray(arguments));
      return _[method].apply(_, args);
    };
  });

  // return the public API
  return new Container();
}

// constructor
Automation.prototype.super = function(options) {
	// data binding
	this.el = options.el;
	this.model = options.model;
	this.templateFunc = options.template;

	// private properties
	this.count = 0;

	// constructor
	this.container = new Automation.ChildElementContainerFactory();
    this.model.bind('change', this.composite, this);
};

Automation.prototype.composite = function(cid) {
	// Get new view and build the subtree
	var tree = this.container.findVtreeByCid(cid);
	var element = this.container.findElementByCid(cid);
	var model = this.container.findModelByCid(cid);

	// TODO: sync with model state


	// create the new tree
	var innerHtml = this.templateFunc( model.attributes )
						.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'');
	var newTree = convertHTML(innerHtml);

	// composition
	var patches = diff(tree, newTree);
	element = patch(element, patches);

	// update vtree
	this.container.updateVtreeByCid(cid, newTree);
	this.container.updateElementByCid(cid, element);
};

Automation.prototype.add = function(options) {	
	var model = new this.model();

	// Data persistence
	for(var prop in options) {
	    if(options.hasOwnProperty(prop))
		    model.set(prop, options[prop]);
	}

	// child ID which is automatically increased
	model.set('cid', this.count);

	// 1. Get view and build the subtree (virtual DOM)
	//    - remove invalid characters
	var innerHtml = this.templateFunc( model.attributes )
						.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'');	
	var tree = convertHTML(innerHtml);

	// 2. Create the list item (sub element)
	var element = createElement(tree);

	// 3: composition boundary
	this.el.append(element); 

	// store this element
	this.container.add({
		vtree: tree,
		element: element,
		model: model,
		cid: this.count
	});

	this.count++;

	return this;
};

module.exports = Automation;