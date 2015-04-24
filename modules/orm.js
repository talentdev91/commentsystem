var sqlite3 = require('sqlite3').verbose();

module.exports.init = function() {
	var db = new sqlite3.Database('data/db.sqlite');

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
	var db = new sqlite3.Database('data/db.sqlite');

	db.all("WITH RECURSIVE \
			children(id,level) AS ( \
			    VALUES(" + discussionID + ",0) \
			    UNION ALL \
			    SELECT discussions.id, children.level+1 \
			    	FROM discussions JOIN children ON discussions.parent=children.id \
			    ORDER BY 2 DESC \
			) \
			SELECT * FROM discussions AS a JOIN (SELECT * FROM children) AS b on a.id = b.id;",
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

	db.close();
}