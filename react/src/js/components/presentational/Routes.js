import React, { Component, useState, useContext, useEffect,useMemo } from "react"
import { Switch, Route, Link  } from 'react-router-dom'
import {Helmet} from "react-helmet";
import { Page } from '../Page'
import { Tree } from "../presentational/Tree"
import Login from "./Login"
import Register from "./Register"
import BranchSettingsContainer from "../container/BranchSettingsContainer"
import MyBranchesContainer from "../container/MyBranchesContainer"
import { SettingsContainer } from "../container/SettingsContainer"
import {UserContext,RefreshContext} from "../container/ContextContainer"
import GroupChatContainer,{GroupChatMessagesContainer} from "../container/GroupChatContainer"
import {Post} from "./Post"
import BranchPosts, {DisplayPosts} from "./BranchPosts"
import {ParentBranch} from "./Branch"
import {BranchContainer} from "../container/BranchContainer"
import {BranchesPage,BranchesPageRoutes} from "./BranchesPage"
import {BranchNavigation} from "./BranchNavigation"
import {MyBranchesColumnContainer} from "./MyBranchesColumn"
import Card from "./Card"
import StatusUpdate from "./StatusUpdate"
import {ActionArrow} from "./Temporary"
import axios from 'axios'

function Routes (props) {
    
    const [refresh,setRefresh] = useState(null);
    let value = {refresh,setRefresh};

    return(
        <Switch>
            <Route exact path='/login' component={(props) => <Login {...props} />} />
            <Route exact path='/register' component={(props) => <Register {...props} />} />
            <UserContext.Consumer>
            {context =>(
                    <Page context={context}>
                    <RefreshContext.Provider value={value}>
                        <Switch>
                            <Route exact path='/' render={(props) => <FrontPage {...props} />}  />
                            <Route exact path='/settings' component={(props) => <SettingsContainer {...props}/> } />
                            <Route exact path='/mybranches' component={(props) => <MyBranchesContainer {...props}/> } />
                            <Route path='/settings/:branchUri?' component={(props) => <BranchSettingsContainer {...props} />} />
                            <Route path='/:uri?' component={BranchContainer}/>
                        </Switch>
                        </RefreshContext.Provider>
                    </Page>
            )}
            </UserContext.Consumer>
        </Switch>
    )
}

function FrontPageFeed(props){
    const context = useContext(UserContext);
    const uri = `/api/branches/${context.currentBranch.uri}/feed/`


    if(context.isAuth){
        return(
            <DisplayPosts uri={uri} match={props.match} activeBranch={context.currentBranch}
            postedId={context.currentBranch.id} showPostedTo/>
        )
    }else{
        return <p>not auth</p>
    }
}

class FrontPageContainer extends Component{
    state = {
        feed : []
    }

    static contextType = UserContext

    async getFeed(){
        var r = await axios.get(`/api/branches/${this.context.currentBranch.uri}/feed/`);
        r = await r.data.results;
        this.setState({feed:r});
    }

    componentDidMount(){
        this.getFeed();
    }

    render(){
        if(this.context.isAuth){
            return(
            
                <FrontPage feed={this.state.feed}/>
            )
        }
        else{
            return <p>not auth</p>
        }
    }
}

class FrontPage extends Component{
    render(){
        return(
            <>
                <FrontPageLeftBar2/>
                <FrontPageFeed/>
                <FrontPageRightBar/>
            </>
        )
    }
}

class FrontPageFeed2 extends Component{
    state = {
        feed:null
    }

    constructor(props){
        super(props);
        this.updateFeed = this.updateFeed.bind(this);
    }

    initialFeed(){
        return this.props.feed.map(p=>{
            return <Post post={p} key={p.id}/>
        })
    }

    updateFeed(posts){
        var self = this;
        let newFeed = posts.map(p=>{
            return <Post post={p} key={p.id}/>
        })
        
        this.setState({
            feed:newFeed.concat(self.state.feed)
        })
    }

    componentDidUpdate(prevProps,prevState){
        if(this.state.feed === prevState.feed){
            this.setState({feed:this.initialFeed()})
        }
    }

    render(){
        if(this.state.feed){
            return(
                <div style={{display:'flex',flexFlow:'column',flexBasis:'60%',padding:"0 10px"}}>
                    <StatusUpdate updateFeed={this.updateFeed}/>
                    {this.state.feed}
                </div>
            )
        }
        else{
            return (
                <div style={{display:'flex',flexFlow:'column',paddingLeft:10}}>
                    <StatusUpdate updateFeed={this.updateFeed}/>
                    <div style={{width:700}}>loading</div>
                </div>
            )
        }
    }
}

function FrontPageLeftBar(){
    return(
        <div style={{ flexBasis:'22%',height:300, backgroundColor:'white'}}>
            <div style={{padding:'10px 20px'}}>
                <h1>Popular now</h1>
            </div>
        </div>
    )
}

function FrontPageLeftBar2(){
    return(
        <div style={{ flexBasis:'22%', backgroundColor:'white',height:'max-content'}}>
            <div style={{padding:'10px 20px'}}>
                <h1>My branches</h1>
                <MyBranchesColumnContainer/>
            </div>
        </div>
    )
}

function FrontPageRightBar(){
    return(
        <div style={{flexBasis:'22%',height:300, backgroundColor:'white'}}>
            <div style={{padding:'10px 20px'}}>
                <h1>Recommendations</h1>
            </div>
            
        </div>
    )
}


function ProfileBox(props){
    const context = useContext(UserContext);

    return(
        <div style={{display:'flex'}}>
            <ProfilePicture image={context.currentBranch.branch_image}/>
            <ProfileName name={context.currentBranch.name} uri={context.currentBranch.uri}/>
        </div>
    )
}

function ProfilePicture({image}){
    return(
        <div style={{marginTop:10}}>
            <img src={image} className="profile-picture" style={{width:48,height:48}}></img>
        </div>
    )
}

function ProfileName({name,uri}){

    return(
        <div style={{fontSize:'1.5rem',margin:10}}>
            <span style={{display:'block',fontWeight:'bold'}}>{name}</span>
            <span style={{display:'block',fontSize:'1.4rem',color: '#757575'}}>@{uri}</span>
        </div>
    )
}

function TestBox(){
    return(
        <div style={{height:300,backgroundColor:'white'}}>
            <div style={{padding:'15px 10px'}}>
                <h1 style={{margin:0}}>Info</h1>
            </div>
        </div>
    )
}

export function BranchPage(props){
    return(
        <ParentBranchWrapper branch={props.branch}>
            <Helmet title={props.branch.uri}>
            </Helmet>

                <Switch>
                    <Route path={`/${props.match}/branches`} component={() => <BranchesPageRoutes {...props}/>}/>
                    <Route path={`/${props.match}/chat/:roomName?`} render={()=><GroupChatMessagesContainer {...props}/>}/>
                    <Route path={`/${props.match}/:id?`} render={(idMatch)=><BranchFrontPage {...props} idMatch={idMatch}/>}/>
                </Switch>
        </ParentBranchWrapper>
    )        
}

function BranchFrontPage(props){
    console.log("props",props) //props.idMatch.match.params.id
    var uri;
    var externalId = props.idMatch.match.params.id;
    
    if(externalId){
        uri = `/api/branches/${props.match}/posts/${externalId}/`;
    }else{
        uri = `/api/branches/${props.match}/posts/`;
    }

    return(
        <div>
            <div style={{marginTop:10}}>
                <div style={{display:'flex',width:'100%'}}>
                    <div style={{flexBasis:'22%'}}>
                        <TestBox/>
                    </div>
                    <DisplayPosts {...props} activeBranch={props.branch} 
                    postedId={props.branch.id}
                    uri={uri}
                    externalId={externalId}
                    />
                    <div style={{flexBasis:'22%'}}>
                        <TestBox/>
                    </div>
                </div>
            </div>
        </div>
    )
}

//component={() => <GroupChatMessagesContainer branch={props.branches.parent} {...props}/>}
function BranchPageContainer(props){
    const [branches,setBranches] = useState(null);
    let branchUri = props.match.params.uri ? props.match.params.uri : 'global';

    async function getBranches(branchUri,type){
        let uri;

        uri = `/api/branches/${branchUri}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        uri = `/api/branches/${branchUri}/${type}/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let _branches = data.results.map(c => c)
        let branches = {
            parent:parentData,
            branches:_branches
        }
        setBranches(branches);
    }

    useEffect(() => {
        
        getBranches(branchUri);

    })

    if(branches){
        return <BranchPage branches={branches} match={props.match.params.uri ? props.match.params.uri : 'global'}/>
    }else{
        return null
    }
}


function ParentBranchWrapper(props){

    console.log(props)
    return(
        <div className="flex-fill" style={{flexFlow:'row wrap'}}>
            <div style={{flexBasis:'100%'}}>
                <div>
                    <ParentBranch
                        styleName="parent"
                        style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%'}} 
                        branch={props.branch}
                        branchNavigation
                        editMode={false}
                    ></ParentBranch>
                </div>
                <Card branch={props.branch}/>
                <BranchNavigation branch={props.branch} refresh={props.refresh}/>
                {props.children}
            </div>
        </div>
    )
}

export default Routes;