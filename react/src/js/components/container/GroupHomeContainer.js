import React, { Component } from "react";
import GroupHome from "../presentational/GroupHome"
import axios from "axios";

class GroupHomeContainer extends Component{
    constructor(props){
        super(props);
        this.state = {
            group:null,
            uri:this.props.match.params.uri
        }
    }

    async getGroup(){
        var uri = `/api/groups/${this.state.uri}/`;
        var response = await axios.get(uri, {withCredentials:true})
        var data = response.data;
        console.log(data);
        this.setState({group:data});
    }

    componentDidMount(){
        this.getGroup();
    }

    render(){
        if(this.state.group){
            return(
                <GroupHome group={this.state.group} params={this.props.match.params}/>
            )
        }
        return (null);
    }
}

export default GroupHomeContainer;