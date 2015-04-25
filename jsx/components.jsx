var isNode = typeof module !== 'undefined' && module.exports
, React = isNode ? require('react/addons') : window.React

if(isNode) {
    var moment = require('moment');
}

var Comments = React.createClass({
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
            <div ref="textareaHolder" className="comment-box-holder main">
                <h3>Share your thoughts</h3>
                <textarea 
                    ref="textarea" 
                    placeholder="Enter your comment here..." 
                    className="comment-box"
                    onChange={this.textareaChanged}></textarea>
                <button onClick={this.submitComment} type="button" className={"btn btn-default submit-button " + disabled}>
                    Submit
                </button>
            </div>
        )
    },

    render: function() {
        var depth = 0;
        var discussion = this.state.commentData.discussion;
        var comments = this.state.comments.map(function(comment, index) {
            return <Comment key={index} data={comment} depth={depth} loggedIn={this.state.loggedInStatus} userData={this.state.userData} />
        }.bind(this));
        var textarea = (this.state.loggedInStatus) ? this.textarea() : (
            <h3 className="comment-box-holder main">Please login with Facebook to comment.</h3>
        );
        var authorImage =  "http://graph.facebook.com/v2.3/" + discussion.author_id + "/picture"
        var time = moment(discussion.datetime).fromNow();
        return (
            <div className="container">
                <NavBar logInCallback={this.loggedIn} loggedInStatus={this.state.loggedInStatus} />
                <div className="title-block">
                    <h1>{discussion.title}</h1>
                    <span className="text">{discussion.discussion}</span>
                </div>
                <span className="user-meta">
                    <img className="picture" src={authorImage} />
                    <span className="name">{discussion.author},</span>
                    <span className="time">{time}</span>
                </span>
                <div className="comments-holder">
                    {comments}
                </div>
                {textarea}
            </div>
        )
    }

});

var NavBar = React.createClass({
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
            <a className="facebook-login" href="#" onClick={this.logInToFacebook}>
                <img src="img/facebook-login.png" />
            </a>
        );

        var socialAccount = (
            <div ref="userInfo" className="user-info">
                <img className="picture" src={this.state.userPicture} />
                <span className="name">
                    <span className="first-name">{this.state.firstName}</span> <span className="last-name">{this.state.lastName}</span>
                </span>
            </div>
        );

        var socialSpace =   (this.state.loggedInStatus === "unknown") ? "" :
                            (this.state.loggedInStatus !== false) ? socialAccount : facebookButton;

        return (
            <nav className="navbar navbar-default navbar-collapse main-nav">
                <div className="container-fluid">
                    <div className="navbar-header">
                      <a className="navbar-brand" href="#">
                        Startup Grind
                      </a>
                    </div>
                  </div>
                {socialSpace}
            </nav>
        )
    }
});

var Comment = React.createClass({
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
            <div ref="textareaHolder" className="comment-box-holder">
                <textarea 
                    ref="textarea" 
                    placeholder="Enter your comment here..." 
                    className="comment-box"
                    onChange={this.textareaChanged}></textarea>
                <button onClick={this.submitComment} type="button" className={"btn btn-default submit-button " + disabled}>
                    Submit
                </button>
                <label className="private-checkbox">
                    <input
                      type="checkbox"
                      checked={!this.state.commentIsPublic}
                      onChange={this.togglePrivateComment}
                    />
                    Private Comment
                </label>
            </div>
        )
    },
    discussion: function() {
        var textarea = (this.state.openTextArea === true) ? this.textarea() : "";
        var deleteControl = (parseInt(this.props.loggedIn) !== parseInt(this.props.data.author_id)) ? "" : (
            <a className="delete" href="#" onClick={this.deleteComment}>delete</a>
        );
        var loggedInControls = (!this.props.loggedIn) ? "" : (
            <span>
                <a className="comment" href="#" onClick={this.replyToggle}>reply</a>
                {deleteControl}
            </span>
        );
        var time = moment(this.props.data.datetime).fromNow();
        var authorProfilePicture = "http://graph.facebook.com/v2.3/" + this.props.data.author_id + "/picture";
        return (
            <div>
                <div className="profile-picture">
                    <img src={authorProfilePicture} />
                </div>
                <div className="comment-text">
                    <span className="meta-data">
                        <span className="author">{this.props.data.author}</span>
                        <span className="time">{time}</span>
                        {loggedInControls}
                    </span>
                    <div className="innerHTML" dangerouslySetInnerHTML={{__html: this.props.data.discussion}} />
                    {textarea}
                </div>
            </div>
        )
    },
    deletedDiscussion: function() {
        return (
            <span className="deleted-comment">This comment has been deleted</span>
        )
    },
    render: function() {
        var depth = this.props.depth + 1;
        var comments = this.state.comments ? this.state.comments.map(function(comment, index) {
            if(!comment.public 
                && this.props.data.author_id !== parseInt(this.props.loggedIn)
                && comment.author_id !== parseInt(this.props.loggedIn)) return '';
            return <Comment key={index} data={comment} depth={depth} loggedIn={this.props.loggedIn} userData={this.props.userData} />
        }.bind(this)) : "";
        var classString = "single-comment depth" + depth;

        var discussion = (  this.state.deleted === true  ) 
                            ? this.deletedDiscussion() 
                            : this.discussion();

        return (
            <div className={classString}>
                {discussion} <br />
                {comments}
            </div>
        )
    }
});

if (isNode) {
    exports.Comments = Comments
} else {
    React.render(<Comments commentData={staticContent} />, document.getElementById('react-root'))
}