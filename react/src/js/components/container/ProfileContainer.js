import React, { Component } from "react";
import ReactDOM from "react-dom";
import Profile from "../presentational/Profile";

class ProfileContainer extends Component{
    constructor(){
        super();

        this.state = {
            information:'',
        };
    }
    componentDidMount(){

        fetch('/api/users/', {credentials: 'same-origin'})
        .then(results => {
            return results.json();
        }).then(data => {
            let info = data.map((row) => {
                return(
                    <p key = {row.id}>{row.id}</p>
                )
            })
            this.setState({information:info});
        })
    }


    render(){
        return(
            <div>{this.state.information}</div>
        )
    }
}
export default ProfileContainer;

const wrapper = document.getElementById("content");
wrapper ? ReactDOM.render(<ProfileContainer />, wrapper) : false;