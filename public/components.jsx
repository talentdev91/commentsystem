var isNode = typeof module !== 'undefined' && module.exports
  , React = isNode ? require('react/addons') : window.React

var HelloMessage = React.createClass({
  getInitialState: function () {
    return {}
  },

  loadServerData: function() {
    $.get('/name', function(result) {
      if (this.isMounted()) {
        this.setState({name: result})
      }
    }.bind(this))
  },

  componentDidMount: function () {
    this.intervalID = setInterval(this.loadServerData, 3000)
  },

  componentWillUnmount: function() {
    clearInterval(this.intervalID)
  },

  handleClick: function () {
    alert('You clicked!')
  },

  render: function() {
    var name = this.state.name ? this.state.name : this.props.name
    return <div onClick={this.handleClick}>Hello {name}</div>
  }
})

if (isNode) {
 	exports.HelloMessage = HelloMessage
} else {
 	React.render(<HelloMessage name="John" />, document.getElementById('react-root'))
}