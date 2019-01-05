import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet";
import MediaQuery from 'react-responsive';
import {Content} from './presentational/Content'
import {UserContext} from './container/ContextContainer'
import axios from 'axios'
import $ from "jquery";

//export const UserContext = React.createContext("ooo");

export class Page extends Component {

    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            isAuth:this.props.context.isAuth,
            branches:this.props.context.branches,
            currentBranch:this.props.context.currentBranch,
            updateUserData:null
        }

        this.updateUserData = this.updateUserData.bind(this)
    }

    updateUserData(){
        axios.get("/api/owned_branches/").then(r=>{
            this.setState({
                isAuth:localStorage.getItem("token"),
                branches:r.data,
                currentBranch:r.data.find(b => {
                    return b.default === true
                }),
                startedLoading:true,
            })
        }).catch(er =>{
            localStorage.removeItem("token");
            this.setState({
                isAuth:null,
                branches:null,
                currentBranch:null,
                startedLoading:true,
            })
        })
    }

    modalClick() {
        if ($("#group-container").length) {
            document.getElementById("modal-window").classList.toggle("modal-window");
            document.getElementById("group-container").classList.toggle("show");
        }
    }

    render() {
        console.log("context",this.context)
        let updateHandler = {updateUserData:this.updateUserData}
        let value = {...this.state,...updateHandler}
        return (
            <div className="root-wrapper">
                {localStorage.getItem('token') ? (
                    <div>
                        <div onClick={this.modalClick} id="modal-window" />
                            <div id="creategroup-container">
                        </div>
                    </div>
                ):(
                    null
                )}

                <UserContext.Provider value={value}>
                    <Content {...this.props}/>
                </UserContext.Provider>
                    

                <div className="success-message-container" style={{ display: 'none' }}>
                    <p id="success-message" />
                </div>
            </div>
        )
    }
}