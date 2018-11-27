import React, { Component } from "react";
import GroupChatContainer,{GroupChatMessagesContainer} from "../container/GroupChatContainer"

class GroupHome extends Component{
    constructor(props){
        super(props);
        this.state = {
            group:this.props.group,
            params:this.props.params,
            roomName:'general'
        }
    }

    render(){
        return(
            <div>
                <div>
                    <div style={{width:"100%", height:300, backgroundColor:"black"}}>
                        <img style={{width:"100%",height:"100%",objectFit:"cover"}} src={this.props.group.group_banner}></img>
                    </div>
                </div>
                <GroupChatMessagesContainer group={this.state.group} roomName={this.state.roomName}/>
            </div>
            
        )
    }
}

export default GroupHome;