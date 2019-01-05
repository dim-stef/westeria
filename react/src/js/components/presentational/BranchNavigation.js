import React, { Component } from "react";
import { Link } from 'react-router-dom'

export class BranchNavigation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="group-navigation-container flex-fill">
                <FeedButton branch={this.props.branch}/>
                <ChatButton branch={this.props.branch}/>
                <BranchesButton branch={this.props.branch}/>
            </div>
        )
    }

}

const FeedButton = ({branch}) => {
    return(
        <Link to={`/${branch.uri}/feed`} className="group-navigation-button">
            <i className="material-icons navigation-icon">list</i>
            <div className="navigation-button-text">Feed</div>
        </Link>
    )
}

const ChatButton = ({branch}) => {
    return(
        <Link to={`/${branch.uri}/chat`}  className="group-navigation-button">
            <i className="material-icons navigation-icon">chat_bubble_outline</i>
            <div className="navigation-button-text">Chat</div>
        </Link>
    )
}

const BranchesButton = ({branch}) => {
    return(
        <Link to={`/${branch.uri}/branches`}  className="group-navigation-button">
            <i className="material-icons navigation-icon">more</i>
            <div className="navigation-button-text">{branch.children.length} Branches</div>
        </Link>
    )
}