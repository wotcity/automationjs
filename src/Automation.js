// AutomationJS
// ------------
// v0.1.0-alpha1
//
// Copyright (c) 2015 Jollen Chen, Mokoversity Inc.
// Distributed under MIT license
//
// http://automationjs.com

/**
 * Browserify
 */
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var Backbone = require('backbone');
var _ = require('underscore');

/**
 * Setup
 */
var convertHTML = require('html-to-vdom')({
    VNode: VNode,
    VText: VText
});

/*
 * Prototype
 */
Function.prototype.extend = function(parent) {
  _.extend(this.prototype, parent.prototype);
};

/*
 * Class
 */
var Automation = function() {

};

/**
 * EventAggregator can be used to decouple various parts
 * of an application through event-driven architecture.
 *
 * Borrowing this code from https://github.com/marionettejs/backbone.wreqr/blob/master/src/wreqr.eventaggregator.js
 */
Automation.EventAggregator = function () {

  var EA = function(){};

  // Copy the *extend* function used by Backbone's classes
  EA.extend = Backbone.Model.extend;

  // Copy the basic Backbone.Events on to the event aggregator
  _.extend(EA.prototype, Backbone.Events);

  return new EA();
};

/**
 * Container
 *
 * The container to store, retrieve child elements.
 * Borrowing this code from https://github.com/marionettejs/backbone.babysitter
 */
Automation.ChildElementContainer = function (context) {

  // Container Constructor
  // ---------------------

  var Container = function() {
    this._elements = {};
    this._models = {};
    this._vtrees = {};
    this._context = context;
  };

  // Container Methods
  // -----------------
  _.extend(Container.prototype, {
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
      if (_.isObject(this._elements[cid]))
        return this._elements[cid];

      return null;
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

    // Fetch data of every element
    fetch: function() {
      _.each(this._models, function(model) {
      	var cid = model.get('cid');

        model.fetch({
        	success: function(model, response, options) {
        		if (_.isFunction(model.parseJSON))
        			model.parseJSON(response);
        	}.bind(model)
        });
      }.bind(this));
    },

    // Call a method on every element in the container,
    // passing parameters to the call method one at a
    // time, like `function.call`.
    call: function(method){
      this.apply(method, _.tail(arguments));
    },

    // Apply a method on every element in the container,
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
	this._count = 0;
	this._handlers = [];

	// constructor
	this._container = new Automation.ChildElementContainer();
	this._eventAggragator = new Automation.EventAggregator();

	// core event handling
	this._eventAggragator.on('forceUpdateAll', function() {
		// update every model in the container
		this._container.fetch();
	}.bind(this));
};

// The boundary compositor of shadow DOM.
// It builds the new subtree and patch DOM.
Automation.prototype._composite = function(cid) {
	var tree = this._container.findVtreeByCid(cid)
	,	element = this._container.findElementByCid(cid)
	,	model = this._container.findModelByCid(cid);

	if (element === null)
		return;

	// create the new tree
	var innerHtml = this.templateFunc( model.attributes )
						.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'');
	var newTree = convertHTML(innerHtml);

	// composition
	var patches = diff(tree, newTree);
	element = patch(element, patches);

	// update vtree
	this._container.updateVtreeByCid(cid, newTree);
	this._container.updateElementByCid(cid, element);
};

Automation.prototype._add = function(options) {	
	var model = new this.model();

	// Data persistence
	for(var prop in options) {
	    if(options.hasOwnProperty(prop))
		    model.set(prop, options[prop]);
	}

	// child ID is automatically increased
	model.set('cid', this._count);

	// bind model change event to boundary compositor
    model.bind('change', function(model) {
    	var cid = model.get('cid');
    	this._composite(cid);
    }.bind(this), model);

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
	this._container.add({
		vtree: tree,
		element: element,
		model: model,
		cid: this._count
	});

	this._count++;

	return model;
};

Automation.prototype.trigger = function(event) {
	this._eventAggragator.trigger(event);
}

module.exports = Automation;