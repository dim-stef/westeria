import React, {useContext,useState,useRef,useEffect,useLayoutEffect} from "react"
import {Route,Link,Switch,Redirect,withRouter} from "react-router-dom"
import { Form, Field } from 'react-final-form'
import { OnChange } from 'react-final-form-listeners'
import {Helmet} from 'react-helmet'
import {useMyBranches} from "../container/BranchContainer"
import { UserContext,CachedBranchesContext } from "../container/ContextContainer";
import {useMutualFollows} from "../container/MutualFollows"
import {SmallBranch} from "./Branch"
import {BranchSwitcher} from "./BranchSwitcher"
import {Profile} from './SettingsPage'
import {Save} from './Forms'
import RoutedHeadline from "./RoutedHeadline"
import axios from 'axios'

import axiosRetry from 'axios-retry';

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });


export function ChatRoomSettings({match}){
    const userContext = useContext(UserContext);
    const [room,setRoom] = useState(null);

    async function getRoom(){
        try{
            let url = `/api/v1/branches/${userContext.currentBranch.uri}/chat_rooms/${match.params.roomName}/`
            let response = await axios.get(url);
            setRoom(response.data)
        }catch(e){

        }
    }

    useEffect(()=>{
        getRoom();
    },[])

    return (
        userContext.isAuth?
            room?
            <>
                <Helmet>
                    <title>{room.name} Settings - Subranch</title>
                    <meta name="description" content="Change this rooms settings here." />
                </Helmet>
                <div className="main-column" style={{flexBasis:'100%',WebkitFlexBasis:'100%',margin:0}}>
                    <div>
                        <ChatRoomSettingsRoutes room={room}/>
                    </div>
                </div>
                
            </>:null
        :<Redirect to="/login"/>
    )
}

function ChatRoomSettingsRoutes({room}){
    const userContext = useContext(UserContext);
    const isOwnerOfRoom = userContext.branches.some(b=>b.uri==room.owner);

    return(
        <>
        <Switch>
            <Route path='/messages/:roomId/settings' component={()=>isOwnerOfRoom?<BasicSettings room={room}/>:<Redirect to="/messages"/>}/>
            <Route exact path='/messages/:roomId/invite' component={()=><Invites room={room}/>}/>
        </Switch>
        </>
    )
}

function BasicSettings({room}){
    const userContext = useContext(UserContext);
    const wrapperRef = useRef(null);
    const profileRef = useRef(null);
    
    async function onSubmit(values){
            
        let form = document.getElementById("createConversationForm");
        var formData = new FormData(form);
        formData.set('name',formData.get('name').replace(/(\r\n|\n|\r)/gm, ""))


        let errors = {};
        let url = `/api/v1/branches/${userContext.currentBranch.uri}/chat_rooms/update/${room.id}/`;

        try{
            let response = await axios.patch(
                url,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
        }catch(e){
                
        }
        
        return errors;
    }

    return(
        <>
            <RoutedHeadline headline="Conversation settings"/>
            <Form onSubmit={onSubmit}
            initialValues={{name:room.name}}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return <form id="createConversationForm" style={{padding:10}} onSubmit={handleSubmit}>
                    <Field name="name"
                    placeholder="name">
                        {({ input, meta }) => (
                            <div style={{margin:'10px 0'}}>
                                <label className="setting-label">Name</label>
                                <input {...input} className="setting-input"
                                required/>
                                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                            </div>
                        )}
                    </Field>
                    <div style={{margin:'10px 0'}}>
                        <label style={{height:'100%'}} className="setting-label">Image</label>
                        <div className="flex-fill avatar-banner-wrapper" ref={wrapperRef}>
                            <Profile showError src={room.image} wrapperRef={wrapperRef} profileRef={profileRef} name="image" createNew/>
                        </div>
                    </div>
                    
                    <Save submitting={submitting} pristine={pristine} invalid={invalid}
                    submitSucceeded={submitSucceeded} className="form-save-button" value="Save Changes"/>
                    {submitSucceeded?<p className="form-succeed-message">Successfully saved conversation changes</p>:null}
                    {submitFailed && errors.length==0?<p className="form-error-message">An error occured!</p>:null}
                </form>
            }}></Form>
        </>
    )
    
}

function Invites({room}){
    const mutualFollows = useMutualFollows();

    let filtered = mutualFollows.filter(b=>{
        // return non member mutual followers
        return !room.members.some(m=>m==b.uri);
    })

    return <div>
    <RoutedHeadline headline="Invite to conversation"/>
    {filtered.length==0?<p className="info-message">You don't have anyone else to invite.</p>:null}
    {filtered.map(f=>{
        return <div key={f.id} style={{padding:10}}>
            <InviteBranch branch={f} room={room}/>
        </div>
    })}</div>
}


function InviteBranch({branch,room}){
    const userContext = useContext(UserContext);
    const [isInvited,setInvited] = useState(false);

    async function handleInvite(e,branch){
        let config = {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
        }

        let data = {
            request_to:branch.id,
            branch_chat:room.id
        }

        let url = `/api/branches/${userContext.currentBranch.uri}/chat_rooms/${room.id}/invite/`;

        try{
            let response = await axios.post(url,data,config);
            setInvited(true);
        }catch(e){

        }
        
    }

    return  <SmallBranch branch={branch} hoverable={false}>
        {!isInvited?
        <button className="accept-btn" onClick={(e)=>handleInvite(e,branch)}>Invite</button>:
        <button className="decline-btn">Invitation sent</button>}
    </SmallBranch>
}