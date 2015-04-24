var isNode = typeof module !== 'undefined' && module.exports
, React = isNode ? require('react/addons') : window.React

var Comments = React.createClass({
    getInitialState: function () {
        return {
            commentData: {},
            loggedInStatus: (this.props.commentData.facebookID) ? this.props.commentData.facebookID : false,
            userData: {}
        }
    },

    loadServerData: function() {
        $.get('/discussions', function(result) {
            if (this.isMounted()) {
                this.setState({commentData: result})
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
        this.intervalID = setTimeout(this.loadServerData, 3000)
    },

    render: function() {
        var depth = 0;
        var discussion = this.state.commentData.discussion ? this.state.commentData.discussion : this.props.commentData.discussion;
        var comments = discussion.comments.map(function(comment, index) {
            return <Comment key={index} data={comment} depth={depth} loggedIn={this.state.loggedInStatus} userData={this.state.userData} />
        }.bind(this));

        return (
            <div className="container">
                <NavBar logInCallback={this.loggedIn} loggedInStatus={this.state.loggedInStatus} />
                <h1>{discussion.title}</h1>
                <span>{discussion.discussion}</span>
                <div className="comments-holder">
                    {comments}
                </div>
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
                <span className="name">{this.state.userName}</span>
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
            deleted: this.props.data.deleted
        }
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
        console.log(this.props.userData);
        comments.push({
            author_id: parseInt(this.props.loggedIn),
            author: this.props.userData.name,
            discussion: commentData,
            public: true,
            deleted: false
        });
        this.setState({
            comments: comments
        });
    },
    submitComment: function(event) {
        event.preventDefault();
        var texarea = React.findDOMNode(this.refs.textarea);
        var textareaHolder = React.findDOMNode(this.refs.textareaHolder);
        this.addComment(texarea.value);
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
        }
    },
    componentDidUpdate: function() {
        var textareaHolder = React.findDOMNode(this.refs.textareaHolder);
        if(textareaHolder && this.textAreaOpen === false) {
            $(textareaHolder).velocity("slideDown");
            this.textAreaOpen = true;
        };
    },
    textarea: function() {
        return (
            <div ref="textareaHolder" className="comment-box-holder">
                <textarea ref="textarea" placeholder="Enter your comment here..." className="comment-box"></textarea>
                <button onClick={this.submitComment} type="button" className="btn btn-default submit-button">
                    Submit
                </button>
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
        var authorProfilePicture = "http://graph.facebook.com/v2.3/" + this.props.data.author_id + "/picture";
        return (
            <div>
                <div className="profile-picture">
                    <img src={authorProfilePicture} />
                </div>
                <div className="comment-text">
                    <span className="meta-data">
                        <span className="author">{this.props.data.author}</span>
                        <span className="time">1 hour ago</span>
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
            return <Comment key={index} data={comment} depth={depth} loggedIn={this.props.loggedIn} userData={this.props.userData} />
        }.bind(this)) : "";
        var classString = "single-comment depth" + depth;

        var discussion = (  this.state.deleted === false && 
                            this.props.data.public === true  ) ? this.discussion() :
                         (  this.state.deleted === true && 
                            this.props.data.public === true  ) ? this.deletedDiscussion() : "";

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