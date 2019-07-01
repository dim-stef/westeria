import React, { Component } from "react";
import { Link } from "react-router-dom"
import axios from "axios";

export class GroupChatMessageBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            authorImageUrl: null,
        }
    }

    render() {
        var messages = this.props.messageBox.messages.map((m, i) => {
            var endOfBox = false;
            if (i === this.props.messageBox.messages.length - 1) {
                endOfBox = true;
            }
            return (
                <GroupChatMessage message={m} endOfBox={endOfBox} key={i}/>
            )
        })
        return (
            <div className="groupchat-container" >
                <UserInfo author={this.props.messageBox.author} author_url={this.props.messageBox.author_url} key={this.props.messageBox.author} />
                <div className="message-box" >
                    <div>
                        <span style={{ fontWeight: "bold", fontSize: "1em" }}>{this.props.messageBox.author_name}</span>
                    </div>
                    <div style={{ lineHeight: '1.5em',backgroundColor: 'rgb(234, 234, 234)',padding:6,borderRadius:12,display:'inline-block'}}> {/* borderLeft: '2px solid rgb(52, 53, 54)'*/}
                        {messages}
                    </div>
                </div>
            </div>
        )
    }
}

class UserInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            author: this.props.author,
            authorImageUrl: null,
        }
    }

    componentWillUnmount() {
        var items = JSON.parse(localStorage.getItem('profilePictures'))
        items[this.state.author] = this.state.authorImageUrl;
        //localStorage.setItem(this.state.author, this.state.authorImageUrl)
        localStorage.setItem('profilePictures', JSON.stringify(items));
    }

    componentWillMount() {
        var items = JSON.parse(localStorage.getItem('profilePictures'));
        var rehydrate = null;
        if(items){
            if(this.state.author in items){
                rehydrate = localStorage.getItem(items[this.state.author])
                console.log(rehydrate);
            }
        }
        this.setState({ authorImageUrl: rehydrate })
    }

    async getAvatar(author) {
        var response = await axios.get(`/api/public_profile/${author}/`)
        var data = response.data;
        this.setState({ authorImageUrl: data.branch_image })
    }

    componentDidMount() {
        if (!this.state.authorImageUrl) {
            if(this.state.author){
                this.getAvatar(this.state.author);
            }
            else{
                this.setState({authorImageUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTd1zjD3CiZyqGWE8QTKM5XV0MI4CB53oFA2SB0ZNbXil4G3O8i'})
            }
            
        }
    }

    render() {
        if (this.state.authorImageUrl) {
            return (
                <Link to={`/${this.props.author_url}`} className="profile-icon-container" 
                style={{ backgroundImage: `url(${this.state.authorImageUrl})`, 
                backgroundSize: 'cover', 
                backgroundRepeat:'no-repeat',
                backgroundPosition:'center' }}></Link>
            )
        }
        return (
            <div className="profile-icon-container"></div>
        )

    }
}

class GroupChatMessage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            author: this.props.author,
            authorUrl: this.props.author_url,
            timeStamp: this.props.timeStamp,
            lineHeight: 0,
        }
    }

    componentDidMount() {
        this.setState({ lineHeight: (this.message.clientHeight * 80) / 100 })
    }

    render() {
        /*if(this.props.endOfBox){ If different render needed at the last message
            
        }*/

        return (
            <div className="message-container">
                <div className="text-message">
                    {/*<div ref={el => { this.line = el; }} style={{ height:this.state.lineHeight, float:'left',width:1,backgroundColor:'black' }}></div>*/}
                    <div ref={el => { this.message = el; }} style={{}}>{this.props.message}</div>
                </div>
                {/*<div style={{width:'75%', backgroundColor:'#f0f0f0', height:1, alignSelf:'center'}}></div>*/}
            </div>
        )
    }
}

export default GroupChatMessage;
