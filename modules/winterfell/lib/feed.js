
// schema library
var mongoose = require('mongoose');


////////////////////////////////
//   Feed Schema
////////////////////////////////

// feed schema
var FeedSchema = new Schema({
	owner: String, // the owner's _id
	created: { type : Date, default: Date.now },
	updated: { type : Date, default: Date.now },
	content: String, // the content object's _id
	tags: [String], // tags to group similar feeds
	acl: [String] // list of people having access to this
	children: [String] // linked-list of child feeds
});

FeedSchema.methods.save = function(user, content, tagList, fn) {
	this.created = Date.now;
	this.owner = user._id;
	this.content = content;
	this.children = [];

	that = this;
	if (tagList.length > 1) {
		tagList.forEach(function(t) {
			that.tags.push(t);
		});
	}

	// 'updated' gets autoupdated here
	this.save(function(err, t) {
		if (!err || t) fn(null, t);
		else fn('Could not save', null);
	});
};

FeedSchema.methods.modifyContent = function(content, fn) {
	// modify content
	this.content = content;
	this.updated = Date.now;
	this.save(function(err, f) {
		if (err || !f) fn('Could not modify content', null);
		else fn(null, f);
	});
};

FeedSchema.methods.addTag = function(tag, fn) {
	// append to the access control list
	if (this.tags.push(tag)) {
		this.updated = Date.now;
		this.save(function(err, u) {
			if (err) fn(err, null);
			else fn(null, u);
		});
	} else fn('Could not grant tag', null);
};

FeedSchema.methods.removeTag = function(tag, fn) {
	// append to the access control list
	if (this.tags.remove(tag)) {
		this.updated = Date.now;
		this.save(function(err, u) {
			if (err) fn(err, null);
			else fn(null, u);
		});
	} else fn('Could not remove tag', null);
};

FeedSchema.methods.grantAccess = function(user, fn) {
	// append to the access control list
	if (this.acl.push(user)) {
		this.updated = Date.now;
		this.save(function(err, u) {
			if (err) fn(err, null);
			else fn(null, u);
		});
	} else fn('Could not grant permission', null);
};

FeedSchema.methods.revokeAccess = function(user, fn) {
	// append to the access control list
	if (this.acl.remove(user)) {
		this.updated = Date.now;
		this.save(function(err, u) {
			if (err) fn(err, null);
			else fn(null, u);
		});
	} else fn('Could not remove permission', null);
};

FeedSchema.methods.delete = function(fn) {
	this.remove(fn);
};

FeedSchema.methods.addChild = function(child, fn) {
	this.children.push(child);
	this.modified = Date.now;
	this.save(function(err, f) {
		if (!err || f) fn(null, f);
		else fn('Could not add child feed', null);
	});
};

var Feed = mongoose.model("FeedSchema", FeedSchema);


////////////////////////////////
//   Child Feed Schema
////////////////////////////////

// child feed schema
var ChildFeedSchema = new Schema({
	owner: String, // the owner's _id
	created: { type : Date, default: Date.now },
	updated: { type : Date, default: Date.now },
	content: String, // the content object's _id
	next: String // linked-list of other child feeds
});

ChildFeedSchema.methods.save = function(user, content) {
	this.created = Date.now;
	this.owner = user._id;
	this.content = content;
	this.next = null;
	this.save(function(err, cf) {

	});
};

ChildFeedSchema.methods.modifyContent = function(content, fn) {
	this.content = content;
	this.modified = Date.now;
	this.save(function(err, f) {
		if (err || !f) fn('Could not modify content', null);
		else fn(null, f);
	});
};

ChildFeedSchema.methods.delete = function(fn) {
	this.remove(fn);
};

var ChildFeed = mongoose.model("ChildFeedSchema", ChildFeedSchema);


////////////////////////////////
//   Feed Stack Schema
////////////////////////////////

// the stack of feeds constructed for each user
// one stack per user 
var FeedStackSchema = new Schema({
	owner: String, // the _id of the user
	recentStack: [FeedSchema] // the more recent and probably cached part of stack
	archiveStack: String // the archived part of the stack
});

FeedStackSchema.methods.Push = function(feed) {
	this.recentStack.push(feed);
	this.CompactAndSave(); // save after compacting / archiving
};

var Feed = mongoose.model("FeedStackSchema", FeedStackSchema);

