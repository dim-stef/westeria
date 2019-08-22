import React, { Component } from "react";
import GroupHome from "../presentational/GroupHome"
import axios from "axios";

class GroupHomeContainer extends Component{
    constructor(props){
        super(props);
        this.state = {
            branch:null,
            uri:this.props.match.params.uri
        }
    }

    async getGroup(){
        var uri = `/api/branches/${this.state.uri}/`;
        var response = await axios.get(uri, {withCredentials:true})
        var data = response.data;
        this.setState({branch:data});
    }

    componentDidMount(){
        this.getGroup();
    }

    render(){
        if(this.state.branch){
            return(
                <GroupHome branch={this.state.branch} params={this.props.match.params}/>
            )
        }
        return (null);
    }
}

export default GroupHomeContainer;