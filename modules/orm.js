var sqlite3 = require('sqlite3').verbose();
var database = 'data/db.sqlite';

module.exports.init = function() {
	var db = new sqlite3.Database(database);

	db.run("CREATE TABLE IF NOT EXISTS discussions (\
				id INTEGER PRIMARY KEY AUTOINCREMENT,\
				parent INTEGER REFERENCES discussions,\
				title VARCHAR(256),\
				discussion TEXT,\
				author VARCHAR(256),\
				author_id INTEGER,\
				datetime TEXT)");

	console.log("Database Initialized");
	
	db.close();
}

module.exports.getDiscussion = function (discussionID, callback) {
	var db = new sqlite3.Database(database);

	db.serialize(function() {

		var stmt = db.prepare("WITH RECURSIVE \
				children(id,level) AS ( \
				    VALUES((?),0) \
				    UNION ALL \
				    SELECT discussions.id, children.level+1 \
				    	FROM discussions JOIN children ON discussions.parent=children.id \
				    ORDER BY 2 DESC \
				) \
				SELECT * FROM discussions AS a JOIN (SELECT * FROM children) AS b on a.id = b.id;");

		stmt.all(discussionID,
			function(err, rows) {

			var map = {}, row, parent, roots = {};
			for(var i = 0, l = rows.length; i < l; i++) {
				row = rows[i];
				row.comments = []
				map[row.id] = i;
				if(row.parent) {
					parent = rows[map[row.parent]];
					if(!'comments' in parent) parent.comments = [];
					delete row.level;
					delete row.parent;
					delete row.title;
					row.public = row.public === 1;
					row.deleted = row.deleted === 1;
					if(row.deleted) {
						delete row.author;
						delete row.author_id;
						delete row.discussion;
					}
					parent.comments.push(row);
				} else {
					delete row.parent;
					delete row.deleted;
					delete row.level;
					delete row.public;
					roots.discussion = row;
				}
			}

			callback(roots);
		});

		 stmt.finalize();

	});

	db.close();
}


module.exports.deleteComment = function (commentID, callback) {
	var db = new sqlite3.Database(database);
	
	db.serialize(function() {

		var stmt = db.prepare("SELECT * FROM discussions WHERE parent = (?)");

		stmt.all(commentID, function(err, rows) {
			if(rows.length > 0) {
				var stmt2 = db.prepare("UPDATE discussions SET deleted = 1 WHERE id = (?)");
				stmt2.run(commentID, function() {
					db.close();
				});
			} else {
				var stmt2 = db.prepare("DELETE FROM discussions WHERE id = (?) AND parent != 0");
				stmt2.run(commentID, function() {
					db.close();
				});
			}
			stmt2.finalize();
			callback({success:true});

			//TODO validate success
		}.bind(this));
		stmt.finalize();
	});
}

module.exports.addComment = function (parentID, commentObject, callback) {
	var db = new sqlite3.Database(database);
	
	db.serialize(function() {

		db.run("INSERT INTO discussions (parent, discussion, author, author_id, datetime, public) \
						VALUES ($parent, $discussion, $author, $author_id, datetime(), $public)", {
			$parent: parentID, 
			$discussion: commentObject.discussion, 
			$author: commentObject.author, 
			$author_id: commentObject.author_id, 
			$public: (commentObject.public === 'true') ? 1 : 0
		}, function() {
			callback({success:true});
			//TODO validate success
		});

	});

	db.close();

}
