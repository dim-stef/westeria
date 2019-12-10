import React, {Component} from "react";
import {withRouter} from 'react-router-dom'
import Routes from '../presentational/Routes'
import {UserContext} from "./ContextContainer"
import axios from 'axios'

axios.defaults.withCredentials = true;

class App extends Component {
    static contextType = UserContext
    constructor(props){
        super(props)
        this.state = {
            isAuth:null,
            branches:null,
            currentBranch:null,
            startedLoading:false,
            justRegistered:false,
            updateUserData:this.getUserBranches,
            changeCurrentBranch:this.getNewCurrentBranch,
            getNewCurrentBranch:this.getNewCurrentBranch
        }

        this.getNewCurrentBranch = this.getNewCurrentBranch.bind(this);
        this.getUserData=this.getUserData.bind(this);
        this.getUserBranches=this.getUserBranches.bind(this);
        this.updateBranches=this.updateBranches.bind(this);
        this.unlisten = this.props.history.listen((location, action) => {
        });

    }

    resetState(){
        localStorage.removeItem("token");
        this.setState({
            isAuth:null,
            user:null,
            branches:null,
            currentBranch:null,
            startedLoading:false,
        })
    }

    async getUserBranches(){
        var r = await axios.get("/api/owned_branches/").catch(er=>this.resetState());
        var user = await axios.get("/api/user/").catch(er=>this.resetState());
        var currBranch = await axios.get("/api/user/default_branch/").catch(er=>this.resetState());
        var reacts = await axios.get(`/api/branches/${currBranch.data.uri}/reactions/`).catch(er=>this.resetState());
        currBranch.data.reacts = reacts.data;
        let userData = user.data[0] || user.data
        localStorage.setItem('has_seen_tour',userData.profile.has_seen_tour)

        this.setState({
            isAuth:localStorage.getItem("token"),
            user:userData,
            branches:r.data,
            currentBranch:currBranch.data,
            startedLoading:true,
            seenTour:userData.profile.has_seen_tour
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

    updateBranches(branches,newBranchData = null){

        this.setState({
            branches:branches
        },()=>{
            if(newBranchData){
                this.getNewCurrentBranch(newBranchData)
            }
        })
    }

    componentWillUnmount() {
        this.unlisten();
    }

    componentDidMount(){
        if(localStorage.getItem("token")){
            this.getUserData();
        }else{
            if(!localStorage.getItem('has_seen_tour')){
                localStorage.setItem('has_seen_tour',false)
            }
        }
    }

    componentDidUpdate(previousProps, previousState){
        //if is auth and state different
        //to switch accounts

        if(localStorage.getItem("token") && !this.state.isAuth){
            this.getUserData();
        }
    }

    render() {
        if(!this.state.startedLoading && localStorage.getItem("token")){
            return null
        }

        let updateHandler = {updateUserData:this.getUserBranches}
        let changeBranchHandler = {changeCurrentBranch:this.getNewCurrentBranch}
        let updateBranchHandler = {updateBranches:this.updateBranches}
        let value = {...this.state,...updateHandler, ...changeBranchHandler,
            ...updateBranchHandler}
        return (
            <UserContext.Provider value={value}>
                <Routes/>
            </UserContext.Provider>
        );
    }
}



export default withRouter(App);