import React, { Component } from "react";

class GroupChatMessage extends Component{
    constructor(props){
        super(props);

        this.state = {
            author:'',
            message:'',
            timeStamp:'',
        }
    }

    render(){
        return(
            <div>
                <span>{this.state.message}</span>
            </div>
        )
    }
}

export default GroupChatMessage;