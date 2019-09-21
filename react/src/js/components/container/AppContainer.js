import React, {Component} from "react";
import {withRouter} from 'react-router'
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
            updateUserData:this.getUserBranches,
            changeCurrentBranch:this.getNewCurrentBranch,
            getNewCurrentBranch:this.getNewCurrentBranch
        }

        this.getNewCurrentBranch = this.getNewCurrentBranch.bind(this);
        this.getUserData=this.getUserData.bind(this);
        this.getUserBranches=this.getUserBranches.bind(this);
        this.updateBranch=this.updateBranch.bind(this);

        this.unlisten = this.props.history.listen((location, action) => {
            /*if(location.pathname === "/login"){
                this.setState({
                    isAuth:null,
                    branches:null,
                    currentBranch:null,
                    startedLoading:false,
                })
            }*/
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

    updateBranch(oldBranch,newBranchData){
        let index = this.state.branches.findIndex(b => b.uri==oldBranch.uri);
        let newBranches = this.state.branches.slice();
        newBranches[index] = {
            ...newBranches[index],
            ...newBranchData
        }

        this.setState({
            branches:newBranches
        },()=>{
            this.getNewCurrentBranch(newBranchData)
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
        let updateBranchHandler = {updateBranch:this.updateBranch}
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