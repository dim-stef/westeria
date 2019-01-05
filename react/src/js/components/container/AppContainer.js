import React, { Component } from "react";
import { withRouter , Redirect } from 'react-router'
import { Switch, Route, Link  } from 'react-router-dom'
import Routes from "../presentational/Routes"
import {UserContext} from "./ContextContainer"
import axios from 'axios'


class App extends Component {
    static contextType = UserContext
    constructor(props){
        super(props)

        this.state = {
            isAuth:null,
            branches:null,
            currentBranch:null,
            startedLoading:false,
            updateUserData:this.getUserBranches
        }

        this.getUserData=this.getUserData.bind(this);
        this.getUserBranches=this.getUserBranches.bind(this);

        this.unlisten = this.props.history.listen((location, action) => {
            console.log("on route change");
            if(location.pathname === "/login"){
                this.setState({
                    isAuth:null,
                    branches:null,
                    currentBranch:null,
                    startedLoading:false,
                })
            }
        });
    }

    getUserBranches(){
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

    getUserData(){
        this.getUserBranches();
    }

    componentWillUnmount() {
        this.unlisten();
    }

    componentDidMount(){
        if(localStorage.getItem("token")){
            this.getUserData();
        }
    }

    componentDidUpdate(previousProps, previousState){
        if(this.state === previousState){
            this.getUserData();
        }
    }

    render() {
        if(!this.state.startedLoading && localStorage.getItem("token")){
            return null
        }

        let updateHandler = {updateUserData:this.getUserBranches}
        let value = {...this.state,...updateHandler}
        return (
            <UserContext.Provider value={value}>
                <Routes {...this.props}/>
            </UserContext.Provider>
        );
    }
}

export default withRouter(App);