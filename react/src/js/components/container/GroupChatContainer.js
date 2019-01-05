import React, { Component } from "react";
import GroupChatMessage, { GroupChatMessageBox } from "../GroupChatMessage";
import {UserContext} from "./ContextContainer"
import axios from "axios";
const uuidv1 = require('uuid/v1');


export class GroupChatMessagesContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            ws: null,
            branch: this.props.branch,//this.props.group,
            roomName: this.props.roomName,//this.props.roomName,
            hasMore: false,
            next: null,
        }

        this.prepareState = this.prepareState.bind(this);
    }

    async getData(next) {
        var uri;
        if (next !== null) {
            uri = next;
        }
        else {
            uri = `/api/branches/${this.state.branch.uri}/chat/${this.state.roomName}/messages/`;
        }

        var response = await axios.get(uri);
        return response.data;
    }

    async prepareState() {
        var messages;
        messages = await this.getData(this.state.next);

        var next = messages.next
        var hasMore = true;
        if (next === null) {
            hasMore = false;
        }
        messages = messages.results;
        messages = messages.reverse()
        this.setState({
            messages: messages,
            next: next,
            hasMore: hasMore,
            ws: new WebSocket(`ws://${window.location.host}/ws/chat/${this.state.branch.uri}/`)
        })

    }

    componentDidMount() {
        var self = this;
        this.prepareState();

        window.onscroll = function () {
            if (window.pageYOffset === 0) { // use .scrollTop for other elements
                if (self.state.hasMore) {
                    self.prepareState();
                }
            }
        }
    }

    componentWillUnmount() {
        window.onscroll = null;
    }

    render() {
        if (this.state.messages && this.state.ws) {
            console.log(this.state.messages)
            return (
                <GroupChatContainer ws={this.state.ws} roomName={this.state.roomName} messages={this.state.messages} branch={this.state.branch.id} />
            )
        }
        return null;

    }

}


class GroupChatContainer extends Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);

        this.state = {
            branch: this.props.branch,
            roomName: this.props.roomName,
            currentMessage: '',
            files:'',
            messages: this.props.messages,
            ws: this.props.ws,
        }

        this.inputHandler = this.inputHandler.bind(this);
        this.submitHandler = this.submitHandler.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.drop = this.drop.bind(this);
        this.preventDefault = this.preventDefault.bind(this);
    }


    preventDefault(e) {
        e.preventDefault();
    }

    drop(event) {

        event.preventDefault();
        var data = event.dataTransfer.items;
        console.log(data);
        var files = [];
        for (var i = 0; i < data.length; i++) {
            files.push(data[i].getAsFile());
        }
        console.log(files)
        /*try {
            
        } catch (e) {
            return;
        }*/
    }

    inputHandler(e) {
        this.setState({ currentMessage: e.target.value });
    }

    submitHandler() {
        var message = this.state.currentMessage;
        if (this.state.currentMessage.replace(/\s/g, "").length > 0) {
            this.state.ws.send(JSON.stringify({
                'message': message,
                'room_name': this.state.roomName,
                'branch': this.state.branch,
                'from_branch': this.context.currentBranch.id
            }));
        }
    }

    handleKeyPress(event) {
        if (event.key == 'Enter' && !event.shiftKey) {
            event.preventDefault();
            var message = this.state.currentMessage.slice();
            var dummy = this.state.currentMessage.slice();
            if (dummy.replace(/\s/g, "").length > 0) {
                this.state.ws.send(JSON.stringify({
                    'message': message,
                    'room_name': this.state.roomName,
                    'branch': this.state.branch,
                    'from_branch': this.context.currentBranch.id
                }));
            }
            this.setState({ currentMessage: '' })
            this.el.scrollIntoView({ behavior: "instant" });
        }
    }

    onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    componentWillReceiveProps(nextProps) {
        var concatenatedMessages = nextProps.messages.concat(this.state.messages);
        var concatenatedUnique = concatenatedMessages.filter(this.onlyUnique)
        this.setState({ messages: concatenatedUnique });
    }

    componentDidMount() {
        var self = this;
        this.el.scrollIntoView({ behavior: "instant" });
        this.state.ws.onmessage = function (e) {
            var data = JSON.parse(e.data);
            var message = data['message'];
            var author_name = data['author_name'];
            var author_url = data['author_url'];
            var author = data['author'];
            var bundle = {
                message: message,
                author_name: author_name,
                author_url: author_url,
                author: author
            }
            var newMessages = self.state.messages.slice();
            newMessages.push(bundle);
            self.setState({ messages: newMessages })
            self.el.scrollIntoView({ behavior: "instant" });
        };
    }

    getMessageBoxes() {
        var chatBox = {
            author: null,
            author_name: null,
            author_url: null,
            created:null,
            messages: []
        };
        var messageBoxes = this.state.messages.map((m, i) => {
            var nextAuthor = null;
            chatBox.author = m.author;
            chatBox.author_name = m.author_name;
            chatBox.author_url = m.author_url;
            chatBox.created = m.created;
            chatBox.messages.push(m.message)

            if (i < this.state.messages.length - 1) {
                nextAuthor = this.state.messages[i + 1].author_url
            }

            if (m.author_url !== nextAuthor) {
                var copy = Object.assign({}, chatBox);
                chatBox.author_url = null;
                chatBox.messages = [];
                return copy;
            }
            return null;
        })
        var filtered = messageBoxes.filter(function (el) {
            return el != null;
        });
        messageBoxes = filtered.map(m => {
            return <GroupChatMessageBox messageBox={m} key={m.created}/>
        })
        return messageBoxes;
    }

    render() {
        var messageBoxes = this.getMessageBoxes();
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div id="chat-log" className="chat-log">
                    {messageBoxes}
                </div>

                <div style={{ position: 'fixed', bottom: 0, height: 100, width: '100%' }}>
                    <textarea onDrop={this.drop} onDragOver={this.preventDefault} onChange={this.inputHandler} onKeyPress={this.handleKeyPress} className="text-wrapper" rows="1" value={this.state.currentMessage} id="chat-message-input"></textarea>
                </div>
                <div ref={el => { this.el = el; }}></div>
            </div>
        )
    }
}

class CustomTextArea extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <textarea onDrop={this.drop} onDragOver={this.preventDefault} onChange={this.inputHandler} onKeyPress={this.handleKeyPress} className="text-wrapper" rows="1" value={this.props.value} id="chat-message-input"></textarea>
        )
    }
}

//<input onClick={this.submitHandler} id="chat-message-submit" type="button" value="Send" />
export default GroupChatContainer;