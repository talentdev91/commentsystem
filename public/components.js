var isNode = typeof module !== 'undefined' && module.exports
, React = isNode ? require('react/addons') : window.React

if(isNode) {
    var moment = require('moment');
}

var Comments = React.createClass({displayName: "Comments",
    getInitialState: function () {
        return {
            commentData: {},
            loggedInStatus: (this.props.commentData.facebookID) ? this.props.commentData.facebookID : false,
            userData: {},
            disabledSubmitButton: true,
            comments: []
        }
    },

    loadServerData: function() {
        $.get('/discussions', function(result) {
            if (this.isMounted()) {
                this.setState({
                    commentData: result,
                    comments: result.discussion.comments
                })
            }
        }.bind(this))
    },

    loggedIn: function(userData) {
        this.setState({
            loggedInStatus: userData.id,
            userData: userData
        });
    },

    componentDidMount: function () {
        this.intervalID = setInterval(this.loadServerData, 5000)
    },

    componentWillMount: function() {
        this.setState({
            commentData: this.props.commentData,
            comments: this.props.commentData.discussion.comments
        });
    },

    addComment: function(commentData) {
        var comments = this.state.comments;

        var commentObject = {
            author_id: parseInt(this.state.loggedInStatus),
            author: this.state.userData.name,
            discussion: commentData,
            public: true,
            deleted: false,
            datetime: Date.now()
        };
        comments.push(commentObject);
        this.setState({
            comments: comments
        });

        $.post('/addComment/' + this.state.commentData.discussion.id, commentObject, function(result) {
            console.log(result);
            //TODO catch errors
        });
        
    },

    submitComment: function(event) {
        event.preventDefault();
        var textarea = React.findDOMNode(this.refs.textarea);
        if(textarea.value === '') return;
        this.addComment(textarea.value);
        textarea.value = '';
    },


    textareaChanged: function() {
        var textarea = React.findDOMNode(this.refs.textarea);
        if(textarea.value.length > 3) {
            this.setState({
                disabledSubmitButton: false
            });
        } else {
            this.setState({
                disabledSubmitButton: true
            });
        }
    },

    textarea: function() {
        var disabled = (this.state.disabledSubmitButton) ? "disabled" : "";
        return (
            React.createElement("div", {ref: "textareaHolder", className: "comment-box-holder main"}, 
                React.createElement("h3", null, "Share your thoughts"), 
                React.createElement("textarea", {
                    ref: "textarea", 
                    placeholder: "Enter your comment here...", 
                    className: "comment-box", 
                    onChange: this.textareaChanged}), 
                React.createElement("button", {onClick: this.submitComment, type: "button", className: "btn btn-default submit-button " + disabled}, 
                    "Submit"
                )
            )
        )
    },

    render: function() {
        var depth = 0;
        var discussion = this.state.commentData.discussion;
        var comments = this.state.comments.map(function(comment, index) {
            return React.createElement(Comment, {key: index, data: comment, depth: depth, loggedIn: this.state.loggedInStatus, userData: this.state.userData})
        }.bind(this));
        var textarea = (this.state.loggedInStatus) ? this.textarea() : (
            React.createElement("h3", {className: "comment-box-holder main"}, "Please login with Facebook to comment.")
        );
        var authorImage =  "http://graph.facebook.com/v2.3/" + discussion.author_id + "/picture"
        var time = moment(discussion.datetime).fromNow();
        return (
            React.createElement("div", {className: "container"}, 
                React.createElement(NavBar, {logInCallback: this.loggedIn, loggedInStatus: this.state.loggedInStatus}), 
                React.createElement("div", {className: "title-block"}, 
                    React.createElement("h1", null, discussion.title), 
                    React.createElement("span", {className: "text"}, discussion.discussion)
                ), 
                React.createElement("span", {className: "user-meta"}, 
                    React.createElement("img", {className: "picture", src: authorImage}), 
                    React.createElement("span", {className: "name"}, discussion.author, ","), 
                    React.createElement("span", {className: "time"}, time)
                ), 
                React.createElement("div", {className: "comments-holder"}, 
                    comments
                ), 
                textarea
            )
        )
    }

});

var NavBar = React.createClass({displayName: "NavBar",
    getInitialState: function() {
        return {
            loggedInStatus: "unknown"
        }
    },
    componentWillMount: function() {
        if(!isNode) {
            window.fbAsyncInit = function() {
                FB.init({
                    appId: '706389642821732',
                    cookie: true, 
                    xfbml: true,
                    version: 'v2.2'
                });
                FB.getLoginStatus(this.facebookLoginCallback);
            }.bind(this);
        }
    },
    facebookLoginCallback: function(response) {

        if (response.status === 'connected') {
            
            FB.api('/' + response.authResponse.userID, function(user) {
                this.props.logInCallback(user);
                this.setState({
                    userName: user.name,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    loggedInStatus: user.id,
                    userPicture: "http://graph.facebook.com/v2.3/" + user.id + "/picture"
                });
                var userInfo = React.findDOMNode(this.refs.userInfo);
                $(userInfo).velocity("fadeIn");
            }.bind(this));

        } else {
            this.setState({
                loggedInStatus: false
            });
        }

    },
    logInToFacebook: function() {
        FB.login(this.facebookLoginCallback);
    },
    render: function() {
        var facebookButton = (
            React.createElement("a", {className: "facebook-login", href: "#", onClick: this.logInToFacebook}, 
                React.createElement("img", {src: "img/facebook-login.png"})
            )
        );

        var socialAccount = (
            React.createElement("div", {ref: "userInfo", className: "user-info"}, 
                React.createElement("img", {className: "picture", src: this.state.userPicture}), 
                React.createElement("span", {className: "name"}, 
                    React.createElement("span", {className: "first-name"}, this.state.firstName), " ", React.createElement("span", {className: "last-name"}, this.state.lastName)
                )
            )
        );

        var socialSpace =   (this.state.loggedInStatus === "unknown") ? "" :
                            (this.state.loggedInStatus !== false) ? socialAccount : facebookButton;

        return (
            React.createElement("nav", {className: "navbar navbar-default navbar-collapse main-nav"}, 
                React.createElement("div", {className: "container-fluid"}, 
                    React.createElement("div", {className: "navbar-header"}, 
                      React.createElement("a", {className: "navbar-brand", href: "#"}, 
                        "Startup Grind"
                      )
                    )
                  ), 
                socialSpace
            )
        )
    }
});

var Comment = React.createClass({displayName: "Comment",
    getInitialState: function() {
        return {
            openTextArea: false,
            comments: this.props.data.comments,
            deleted: this.props.data.deleted,
            commentIsPublic: true,
            disabledSubmitButton: true
        }
    },
    togglePrivateComment: function() {
        this.setState({commentIsPublic: !this.state.commentIsPublic});
    },
    textAreaOpen: false,
    replyToggle: function(event) {
        event.preventDefault();
        if(this.state.openTextArea === false) {
            this.textAreaOpen = false;
            this.setState({
                openTextArea: true
            });
        } else {
            this.textAreaOpen = true;
            this.setState({
                openTextArea: false
            });
        }
    },
    addComment: function(commentData) {
        var comments = this.state.comments;
        var commentObject = {
            author_id: parseInt(this.props.loggedIn),
            author: this.props.userData.name,
            discussion: commentData,
            public: this.state.commentIsPublic,
            datetime: Date.now(),
            deleted: false
        };        
        comments.push(commentObject);
        this.setState({
            comments: comments
        });
        
        $.post('/addComment/' + this.props.data.id, commentObject, function(result) {
            console.log(result);
            //TODO catch errors
        });
    },
    submitComment: function(event) {
        event.preventDefault();
        var textarea = React.findDOMNode(this.refs.textarea);
        if(textarea.value === '') return;
        
        var textareaHolder = React.findDOMNode(this.refs.textareaHolder);
        this.addComment(textarea.value);

        $(textareaHolder).velocity("slideUp", function() {
            this.setState({
                openTextArea: false
            });
            this.textAreaOpen = false;
        }.bind(this));
    },
    deleteComment: function(event) {
        event.preventDefault();
        if (confirm('Are you sure you want to delete this comment?')) {
            this.setState({
                deleted: true
            });
            $.get('/deleteComment/' + this.props.data.id, function(result) {
                console.log(result);
                //TODO catch errors
            });
        }
    },
    componentDidUpdate: function() {
        var textareaHolder = React.findDOMNode(this.refs.textareaHolder);
        if(textareaHolder && this.textAreaOpen === false) {
            $(textareaHolder).velocity("slideDown");
            this.textAreaOpen = true;
        };
    },
    textareaChanged: function() {
        var textarea = React.findDOMNode(this.refs.textarea);
        if(textarea.value.length > 3) {
            this.setState({
                disabledSubmitButton: false
            });
        } else {
            this.setState({
                disabledSubmitButton: true
            });
        }
    },
    textarea: function() {
        var disabled = (this.state.disabledSubmitButton) ? "disabled" : "";
        return (
            React.createElement("div", {ref: "textareaHolder", className: "comment-box-holder"}, 
                React.createElement("textarea", {
                    ref: "textarea", 
                    placeholder: "Enter your comment here...", 
                    className: "comment-box", 
                    onChange: this.textareaChanged}), 
                React.createElement("button", {onClick: this.submitComment, type: "button", className: "btn btn-default submit-button " + disabled}, 
                    "Submit"
                ), 
                React.createElement("label", {className: "private-checkbox"}, 
                    React.createElement("input", {
                      type: "checkbox", 
                      checked: !this.state.commentIsPublic, 
                      onChange: this.togglePrivateComment}
                    ), 
                    "Private Comment"
                )
            )
        )
    },
    discussion: function() {
        var textarea = (this.state.openTextArea === true) ? this.textarea() : "";
        var deleteControl = (parseInt(this.props.loggedIn) !== parseInt(this.props.data.author_id)) ? "" : (
            React.createElement("a", {className: "delete", href: "#", onClick: this.deleteComment}, "delete")
        );
        var loggedInControls = (!this.props.loggedIn) ? "" : (
            React.createElement("span", null, 
                React.createElement("a", {className: "comment", href: "#", onClick: this.replyToggle}, "reply"), 
                deleteControl
            )
        );
        var time = moment(this.props.data.datetime).fromNow();
        var authorProfilePicture = "http://graph.facebook.com/v2.3/" + this.props.data.author_id + "/picture";
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "profile-picture"}, 
                    React.createElement("img", {src: authorProfilePicture})
                ), 
                React.createElement("div", {className: "comment-text"}, 
                    React.createElement("span", {className: "meta-data"}, 
                        React.createElement("span", {className: "author"}, this.props.data.author), 
                        React.createElement("span", {className: "time"}, time), 
                        loggedInControls
                    ), 
                    React.createElement("div", {className: "innerHTML", dangerouslySetInnerHTML: {__html: this.props.data.discussion}}), 
                    textarea
                )
            )
        )
    },
    deletedDiscussion: function() {
        return (
            React.createElement("span", {className: "deleted-comment"}, "This comment has been deleted")
        )
    },
    render: function() {
        var depth = this.props.depth + 1;
        var comments = this.state.comments ? this.state.comments.map(function(comment, index) {
            if(!comment.public 
                && this.props.data.author_id !== parseInt(this.props.loggedIn)
                && comment.author_id !== parseInt(this.props.loggedIn)) return '';
            return React.createElement(Comment, {key: index, data: comment, depth: depth, loggedIn: this.props.loggedIn, userData: this.props.userData})
        }.bind(this)) : "";
        var classString = "single-comment depth" + depth;

        var discussion = (  this.state.deleted === true  ) 
                            ? this.deletedDiscussion() 
                            : this.discussion();

        return (
            React.createElement("div", {className: classString}, 
                discussion, " ", React.createElement("br", null), 
                comments
            )
        )
    }
});

if (isNode) {
    exports.Comments = Comments
} else {
    React.render(React.createElement(Comments, {commentData: staticContent}), document.getElementById('react-root'))
}