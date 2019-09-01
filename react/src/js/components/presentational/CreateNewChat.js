import React, {useContext,useState,useRef,useEffect,useLayoutEffect} from "react"
import { Form, Field } from 'react-final-form'
import {CachedBranchesContext,UserContext} from '../container/ContextContainer';
import {SmallBranch} from './Branch';
import {Profile} from './SettingsPage'
import {Save} from './Forms'
import RoutedHeadline from './RoutedHeadline'
import axios from 'axios';


function useMutualFollows(){
    const userContext = useContext(UserContext);
    const [branches,setBranches] = useState([]);

    async function getMutualFollows(){
        let response = await axios.get(`/api/v1/branches/${userContext.currentBranch.uri}/mutual_follows/`);
        setBranches(response.data);
    }

    useEffect(()=>{
        getMutualFollows();
    },[])

    return branches;
}


export function CreateNewChat(){
    const mutualFollows = useMutualFollows();
    const [invited,setInvited] = useState([]);
    const userContext = useContext(UserContext);
    const wrapperRef = useRef(null);
    const profileRef = useRef(null);

    function handleInvite(e,branch){
        e.preventDefault();
        setInvited([...invited,branch.id]);
    }

    function cancelInvite(e,branch){
        e.preventDefault();
        let filtered = invited.filter(b=>b!=branch.id)
        setInvited(filtered);
    }

    async function onSubmit(values){
         
        let form = document.getElementById("createConversationForm");
        var formData = new FormData(form);
        formData.set('name',formData.get('name').replace(/(\r\n|\n|\r)/gm, ""))
        let unique_members = [...new Set(invited)];

        for(var id of unique_members){
            formData.append('members',id);
        }
        let errors = {};
        let url = `/api/v1/branches/${userContext.currentBranch.uri}/create_conversation/`;

        try{
            let response = await axios.post(
                url,
                formData,
                {
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
        <div className="big-main-column">
            <RoutedHeadline to="/messages" headline="Create conversation"/>
            <Form onSubmit={onSubmit} 
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
                        <label style={{height:'100%'}} className="setting-label">Profile Image</label>
                        <div className="flex-fill avatar-banner-wrapper" ref={wrapperRef}>
                            <Profile showError wrapperRef={wrapperRef} profileRef={profileRef} name="image" createNew/>
                        </div>
                    </div>
                    
                    {mutualFollows.map(f=>{
                        let isInvited = invited.some(b=>b==f.id)
                        return <div key={f.id}>
                            <SmallBranch branch={f} hoverable={false}>
                                {!isInvited?
                                <button className="accept-btn" onClick={(e)=>handleInvite(e,f)}>Invite</button>:
                                <button className="decline-btn" onClick={(e)=>cancelInvite(e,f)}>Cancel invite</button>}
                            </SmallBranch>
                        </div>
                    })}
                    <Save submitting={submitting} pristine={pristine} invalid={invalid}
                    submitSucceeded={submitSucceeded} className="form-save-button" value="Create conversation"/>
                    {submitSucceeded?<p className="form-succeed-message">Successfully created conversation</p>:null}
                    {submitFailed && errors.length==0?<p className="form-error-message">An error occured!</p>:null}
                </form>
            }}></Form>
        </div>
    )
}