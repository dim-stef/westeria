import React, { Component,useState,useEffect } from "react";
import { withRouter , Redirect } from 'react-router'
import { Switch, Route, Link  } from 'react-router-dom'
import {DesktopPage} from '../presentational/Routes'
import Routes from "../presentational/Routes"
import {UserContext} from "./ContextContainer"
import MediaQuery from 'react-responsive';
import Responsive from 'react-responsive';
import axios from 'axios'

const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
const Tablet = props => <Responsive {...props} minWidth={768} maxWidth={991} />;
const Mobile = props => <Responsive {...props} maxWidth={767} />;
const Default = props => <Responsive {...props} minWidth={768} />;


class App2 extends Component {
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

    async getUserBranches(){
        try{
            var r = await axios.get("/api/owned_branches/");
            var currBranch = await axios.get("/api/user/default_branch/");
            var reacts = await axios.get(`/api/branches/${currBranch.data.uri}/reactions/`);
            currBranch.data.reacts = reacts.data;
            
            this.setState({
                isAuth:localStorage.getItem("token"),
                branches:r.data,
                currentBranch:currBranch.data,
                startedLoading:true,
            })
        }catch(error){
            localStorage.removeItem("token");
            this.setState({
                isAuth:null,
                branches:null,
                currentBranch:null,
                startedLoading:true,
            })
        }
    }

    async getUserData(){
        await this.getUserBranches();
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
        console.log(this.state)
        if(this.state !== previousState){
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
                <Routes/>
            {/*<MediaQuery minDeviceWidth={1224}>
                    <Routes/>
                {/*<MediaQuery minDeviceWidth={1824}>
                    <Routes/>
                </MediaQuery>
                <MediaQuery maxWidth={1224}>
                    <div>You are sized like a tablet or mobile phone though</div>
                </MediaQuery>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={1224}>
            <div>You are a tablet or mobile phone</div>
            </MediaQuery>
            <MediaQuery orientation="portrait">
            <div>You are portrait</div>
            </MediaQuery>
            <MediaQuery orientation="landscape">
            
            </MediaQuery>
            <MediaQuery minResolution="2dppx">
            <div>You are retina</div>
            </MediaQuery>*/}
            </UserContext.Provider>
        );
    }
}

class App extends Component {
    static contextType = UserContext
    constructor(props){
        super(props)

        this.state = {
            isAuth:null,
            branches:null,
            currentBranch:null,
            startedLoading:false,
            updateUserData:this.getUserBranches,
            changeCurrentBranch:this.getNewCurrentBranch,
            getNewCurrentBranch:this.getNewCurrentBranch
        }

        this.getNewCurrentBranch = this.getNewCurrentBranch.bind(this);
        this.getUserData=this.getUserData.bind(this);
        this.getUserBranches=this.getUserBranches.bind(this);

        this.unlisten = this.props.history.listen((location, action) => {
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

    resetState(){
        localStorage.removeItem("token");
        this.setState({
            isAuth:null,
            branches:null,
            currentBranch:null,
            startedLoading:false,
        })
    }

    async getUserBranches(){
        var r = await axios.get("/api/owned_branches/").catch(er=>this.resetState());
        var currBranch = await axios.get("/api/user/default_branch/").catch(er=>this.resetState());
        var reacts = await axios.get(`/api/branches/${currBranch.data.uri}/reactions/`).catch(er=>this.resetState());
        currBranch.data.reacts = reacts.data;
        
        this.setState({
            isAuth:localStorage.getItem("token"),
            branches:r.data,
            currentBranch:currBranch.data,
            startedLoading:true,
        })
    }
    

    async getUserData(){
        await this.getUserBranches();
    }

    async getNewCurrentBranch(newBranch){

        var reacts = await axios.get(`/api/branches/${newBranch.uri}/reactions/`).catch(er=>this.resetState());
        newBranch.reacts = reacts.data;

        this.setState({
            currentBranch:newBranch,
        })
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
        if(localStorage.getItem("token") && !this.state.isAuth){
            this.getUserData();
        }

        //if is auth and state different
        //to switch accounts
    }

    render() {
        if(!this.state.startedLoading && localStorage.getItem("token")){
            return null
        }

        let updateHandler = {updateUserData:this.getUserBranches}
        let changeBranchHandler = {changeCurrentBranch:this.getNewCurrentBranch}
        let value = {...this.state,...updateHandler, ...changeBranchHandler}
        return (
            <UserContext.Provider value={value}>
                <Routes/>
            {/*<MediaQuery minDeviceWidth={1224}>
                    <Routes/>
                {/*<MediaQuery minDeviceWidth={1824}>
                    <Routes/>
                </MediaQuery>
                <MediaQuery maxWidth={1224}>
                    <div>You are sized like a tablet or mobile phone though</div>
                </MediaQuery>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={1224}>
            <div>You are a tablet or mobile phone</div>
            </MediaQuery>
            <MediaQuery orientation="portrait">
            <div>You are portrait</div>
            </MediaQuery>
            <MediaQuery orientation="landscape">
            
            </MediaQuery>
            <MediaQuery minResolution="2dppx">
            <div>You are retina</div>
            </MediaQuery>*/}
            </UserContext.Provider>
        );
    }
}



export default withRouter(App);