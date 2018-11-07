import React, { Component } from "react";
import axios from "axios";

class GroupChatContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            roomName: this.props.params.uri,
            currentMessage: '',
            messages: [],
            ws: new WebSocket(`ws://${window.location.host}/ws/chat/${this.props.params.uri}/`),
        }

        this.inputHandler = this.inputHandler.bind(this);
        this.submitHandler = this.submitHandler.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    inputHandler(e) {
        this.setState({ currentMessage: e.target.value });
    }

    submitHandler() {
        var message = this.state.currentMessage;
        if (this.state.currentMessage.replace(/\s/g, "").length > 0) {
            this.state.ws.send(JSON.stringify({
                'message': message
            }));
        }
    }

    handleKeyPress(event) {
        if(event.key == 'Enter' && !event.shiftKey){
            event.preventDefault();
            var message = this.state.currentMessage.slice();
            var dummy = this.state.currentMessage.slice();
            if (dummy.replace(/\s/g, "").length > 0) {
                this.state.ws.send(JSON.stringify({
                    'message': message
                }));
            }
            this.setState({ currentMessage: '' })
        }
    }

    componentDidUpdate() {
        this.el.scrollIntoView({ behavior: "instant" });
    }

    componentDidMount() {
        var self = this;
        /*this.state.ws.onopen = function(){
            alert("open");
        }*/

        this.state.ws.onmessage = function (e) {
            var data = JSON.parse(e.data);
            var message = data['message'];
            console.log(message);
            var name = data['name'];
            console.log(e.data);
            var bundle = {
                message: message,
                name: name
            }
            var newMessages = self.state.messages.slice();
            newMessages.push(bundle);
            self.setState({ messages: newMessages })
        };
    }

    render() {
        var messages = this.state.messages.map((m) => {
            return <p>{m.name}: {m.message}</p>
        })
        return (
            <div>
                <div id="chat-log" style={{ fontSize: '1.7em',whiteSpace: 'pre-line' }}>{messages}</div><br />
                <textarea onChange={this.inputHandler} onKeyPress={this.handleKeyPress} style={{resize:'none', width:300, height:80}} rows="1" value={this.state.currentMessage} id="chat-message-input"></textarea>
                <br/>
                <input onClick={this.submitHandler} id="chat-message-submit" type="button" value="Send" />
                <div ref={el => { this.el = el; }}></div>
            </div>
        )
    }
}


class GroupChatMessagesContainer extends Component {
    constructor(props){
        super(props);
        this.state = {
            messages:[],
            roomName:'',
            socket:null
        }
    }

    async getMessages(){
        var uri = `/api/groups/${this.state.roomName}/messages/`
        var response = await axios.get(uri, {withCredentials:true});
        
    }

    componentDidMount(){
        

    }

}

export default GroupChatContainer;