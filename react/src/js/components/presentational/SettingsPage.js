import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from "react"
import {Link, Redirect, Route, Switch, withRouter} from "react-router-dom"
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import {useMediaQuery} from "react-responsive";
import {Field, Form} from 'react-final-form'
import {OnChange} from 'react-final-form-listeners'
import {Helmet} from 'react-helmet'
import {useMyBranches} from "../container/BranchContainer"
import {CachedBranchesContext, UserContext} from "../container/ContextContainer";
import {BranchSwitcher} from "./BranchSwitcher"
import RoutedHeadline from "./RoutedHeadline"
import {ArrowSvg} from "./Svgs"
import axios from 'axios'
import axiosRetry from 'axios-retry';
import Toggle from 'react-toggle'
import {CreateableTagSelector,BranchTypeSelector} from "./TagSelector";
import "react-toggle/style.css"
import history from "../../history"

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();
let border={
    borderBottom:'1px solid #e2eaf1'
}

const settingLabel = theme =>css({
    fontWeight:600,
    fontSize:'1.5em',
    padding:'20px 0 5px',
    color:theme.textLightColor
})

const info = theme =>css({
    fontSize:'1.3rem',
    color:theme.textLightColor,
    marginBottom:10,
    display:'block',
    maxWidth:'80%'
})

const settingInput = theme =>css({
    borderRadius:15,
    fontSize:'1.7em',
    padding:'5px 10px',
    color:theme.textColor,
    border:`1px solid ${theme.borderColor}`
})

const imageCss = theme =>css({
    '&:hover':{
        'img':{
            cursor:'pointer',
            boxShadow:'0px 0px 0px 3px #219ef3',
        }
    }
})

const branchTypeCss = theme =>css({
    width:'90%',
    display:'flex',
    flexFlow:'column',
    alignItems:'center',
    boxShadow:`
    0 0.1px 0.2px rgba(0, 0, 0, 0.017),
    0 0.1px 0.6px rgba(0, 0, 0, 0.024),
    0 0.3px 1.1px rgba(0, 0, 0, 0.03),
    0 0.4px 2px rgba(0, 0, 0, 0.036),
    0 0.8px 3.8px rgba(0, 0, 0, 0.043),
    0 2px 9px rgba(0, 0, 0, 0.06)`,
    backgroundColor:theme.backgroundLightColor,
    margin:10,
    padding:10,
    borderRadius:25
})

const branchTypeInfo = theme=>css({
    color:theme.textLightColor,
    fontSize:'2rem',
    '@media (max-device-width:767px)':{
        fontSize:'1.4rem'
    }
})

const selectButton = theme =>css({
    backgroundColor:theme.primaryColor,
    border:0,
    borderRadius:50,
    padding:'10px 15px',
    fontWeight:'bold',
    fontSize:'1.4rem',
    color:'white',
    margin:16
})

function validateImageSize(target,maxSize){
    var files = target.files;
    if(files[0].size>maxSize){
        return false;
    }
    return true;
}

export function SettingsPage(){
    const userContext = useContext(UserContext);
    const [height,setHeight] = useState(0);
    const ref = useRef(null);
    const theme = useTheme();

    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    useLayoutEffect(()=>{
        if(isMobile){
            let navBar = document.getElementById('mobile-nav-bar');
            setHeight(window.innerHeight - navBar.clientHeight);
        }else{
            if(ref){
                let clientRect = ref.current.getBoundingClientRect();
                setHeight(window.innerHeight -clientRect.top - 10);
            }
        }
    },[ref])

    return (
        userContext.isAuth?
            <>
            <Helmet>
                <title>Settings - Westeria</title>
                <meta name="description" content="Manage your account settings and details here." />
            </Helmet>
            <div className="main-column" 
            style={{flexBasis:'100%',WebkitFlexBasis:'100%',margin:0,border:`1px solid ${theme.borderColor}`}}>
                <div ref={ref} css={{height:height,overflow:'auto',display:'flex',flexFlow:'column'}}>
                    <SettingsRoutes/>
                </div>
            </div>
            
            </>:
        <Redirect to="/login"/>
    )
}

function SettingsRoutes(){
    return(
        <>
        <Switch>
            <Route exact path='/settings' component={TopLevelSettings}/>
            <Route exact path='/settings/branches' component={BranchSettingsLayer}/>
            <Route exact path='/settings/branches/new' component={CreateNewBranchWrapper}/>
            <Route path='/settings/branches/:uri?' component={BranchSettingsWrapper}/>
            <Route exact path='/settings/privacy' component={PrivacySettingsWrapper}/>
        </Switch>
        </>
    )
}

function TopLevelSettings(){
    const branches = useMyBranches();
    const theme = useTheme()
    return(
        <>
            <RoutedHeadline to="/" headline="Settings"/>
            
            <SettingsTab to="/settings/branches" style={{borderBottom:`1px solid ${theme.borderColor}`}}>
                <p style={{fontWeight:'bold',fontSize:'2em'}}>Profiles</p>
            </SettingsTab>
            <SettingsTab to="/settings/privacy">
                <p style={{fontWeight:'bold',fontSize:'2em'}}>Privacy</p>
            </SettingsTab>
        </>
    )
}

function SettingsTab({to,style,children}){
    const theme = useTheme()

    return(
        <div style={style}>
            <Link to={to} className="flex-fill"
                style={{textDecoration:'none',color:theme.textHarshColor}}>
                <div className="settings-option flex-fill" style={{alignItems:'center',WebkitAlignItems:'center',padding:10}}>
                    {children}
                </div>
            </Link>
        </div>
    )
}


function BranchSettingsLayer(){
    const userContext = useContext(UserContext);
    const theme = useTheme()

    return(
        <>
        <Helmet>
            <title>Branch settings - Westeria</title>
            <meta name="description" content="Manage your branch settings here." />
        </Helmet>
        <RoutedHeadline to="/settings" headline="Branch settings"/>
        <SettingsTab to={`/settings/branches/${userContext.currentBranch.uri}`} style={{borderBottom:`1px solid ${theme.borderColor}`}}>
            <p style={{fontWeight:'bold',fontSize:'2em'}}>Update branch</p>
        </SettingsTab>
        <SettingsTab to="/settings/branches/new">
            <p style={{fontWeight:'bold',fontSize:'2em'}}>Create new branch</p>
        </SettingsTab>
        </>
    )
}

function CreateNewBranchWrapper(){
    const [branchType,setBranchType] = useState(null);

    return(
        <>
        <Helmet>
            <title>Create new Branch - Westeria</title>
            <meta name="description" content="Create a new branch." />
        </Helmet>

        <RoutedHeadline to="/settings/branches" headline="Create new branch"/>
        <Setting>
            {branchType? <CreateNewBranch branchType={branchType}/>:<BranchType branchType={branchType} 
            setBranchType={setBranchType}/>}
        </Setting>
        </>
    )
}

function BranchType({setBranchType}){

    function handleCommunityClick(){
        setBranchType('CM');
    }

    function handleUserClick(){
        setBranchType('US');
    }

    return(
        <div css={{height:'100%',display:'flex',flexFlow:'column',justifyContent:'space-evenly',alignItems:'center',
        width:'100%'}}>
            <div css={branchTypeCss}>
                <h1 css={{fontSize:'2.3rem'}}>Community</h1>
                <ul css={theme=>({alignSelf:'flex-start',flex:1})}>
                    <li css={branchTypeInfo}>Anyone can post on communities and share their thoughts</li>
                    <li css={branchTypeInfo}>Grow your community and its visibility by connecting with other communities</li>
                    <li css={branchTypeInfo}>Let your audience interact easily with each other using the followers only conversation</li>
                </ul>
                <button css={selectButton} onClick={handleCommunityClick}>I want this!</button>
            </div>
            <div css={branchTypeCss}>
                <h1 css={{fontSize:'2.3rem'}}>Personal profile</h1>
                <ul css={theme=>({alignSelf:'flex-start',flex:1})}>
                    <li css={branchTypeInfo}>Split your feed in multiple profiles</li>
                    <li css={branchTypeInfo}>Create an alternate profile to hide secrets from your friends 😏</li>
                </ul>
                <button css={selectButton} onClick={handleUserClick}>I want this!</button>
            </div>
        </div>
    )
}

function BranchSettingsWrapper({match,history}){
    const userContext = useContext(UserContext);
    const myBranches = useMyBranches();
    let initBranch = myBranches.find(b=>{
        return match.params.uri == b.uri
    });
    
    const [branch,setBranch] = useState(initBranch);

    useEffect(()=>{
        if(branch){
            //history.push(`/settings/branches/${branch.uri}`);
            window.history.pushState({setting: 1}, "", `/settings/branches/${branch.uri}`);
        }
    },[branch])

    useEffect(()=>{
        if(myBranches.length>0 && !branch){
            let findBranch = myBranches.find(b=>{
                return match.params.uri == b.uri
            });
            setBranch(findBranch);
        }
    },[myBranches])

    return(
        branch?
            <>
            <Helmet>
                <title>Update @{branch.uri} - Westeria</title>
                <meta name="description" content="Update branch." />
            </Helmet>
            <RoutedHeadline to="/settings/branches" headline={`${branch.uri} settings`}/>
            <div css={{display:'flex',justifyContent:'center'}}>
                <BranchSwitcher defaultBranch={branch} setBranch={setBranch} showOnTop/>
            </div>
            <Setting>
                <UpdateBranch branch={branch}/>
            </Setting>
            </>
        :userContext.branches.some(b=>b.uri==match.params.uri)?null:
        <>
        <Helmet>
            <title>Branch not found - Westeria</title>
            <meta name="description" content="Branch not found." />
        </Helmet>
        <RoutedHeadline to="/settings/branches" headline="Branch settings"/>
        <p>Nothing seems to be here</p>
        </>
    )
}

withRouter(BranchSettingsWrapper);

function PrivacySettingsWrapper({match}){
    const userContext = useContext(UserContext);

    return(
        <>
        <Helmet>
            <title>Privacy - Westeria</title>
            <meta name="description" content="Manage your privacy settings here." />
        </Helmet>
        <RoutedHeadline headline="Privacy settings"/>
        <Setting>
            <PrivacySettings/>
        </Setting>
        </>
    )
}

function Setting({children}){
    return(
        <div className="settings-option flex-fill" css={{alignItems:'center',flex:1}}>
            {children}
        </div>
    )
}


export function UpdateBranch({branch,postRegister=false,children,postRegisterAction=()=>{},submittionFunc}){
    const userContext = useContext(UserContext);
    const cachedBranches = useContext(CachedBranchesContext);
    const [tags,setTags] = useState(branch.tags.map(tag=>{return {label:tag,value:tag}}));
    const initTags = useRef(tags);

    let initialValues={
        name:branch.name,
        uri:branch.uri,
        description:branch.description,
        default:branch.default,
        tags:initTags.current
    }

    useEffect(()=>{
        // update tags on branch change
        setTags(branch.tags.map(tag=>{return {label:tag,value:tag}}));
    },[branch])

    function updateContext(contextBranches,data){

        var index = contextBranches.findIndex(b => b.uri==branch.uri);
        contextBranches[index] = {
            ...contextBranches[index],
            ...data
        }

        userContext.updateBranches(contextBranches,data)
    }

    function resetDefaultBranch(branch){
        if(branch.default){
            userContext.branches.filter(b=>b.uri != branch.uri).forEach(b=>{
                b.default = false
            })
            cachedBranches.owned = userContext.branches
        }
    }

    async function onSubmit(values){

        let errors = {};
        let form = document.getElementById("branchForm");
        let description = document.getElementById('description');
        description.value = description.value.replace(/(\r\n|\n|\r)/gm, "")
        var formData = new FormData(form)
        let newTags = tags.map(t=>t.label).join(", ");
        formData.append('tags',newTags)
        let url = `/api/branches/update/${branch.uri}/`;
         
        try{
            let response = await axios.patch(
                url,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
            
            let updatedBranchResponse = await axios.get(`/api/branches/${response.data.uri}/`);

            // only one branch can be default so disable all others if default has changed
            resetDefaultBranch(updatedBranchResponse.data);

            // update userContext
            updateContext(userContext.branches,updatedBranchResponse.data);

            // update cached branches
            updateContext(cachedBranches.owned,updatedBranchResponse.data);
        }catch(e){

        }
        return errors;
    }

    return(
        postRegister?<PostRegisterForm onSubmit={onSubmit} initialValues={initialValues}
        branch={branch} submittionFunc={submittionFunc} postRegisterAction={postRegisterAction}></PostRegisterForm>:
        <BranchForm onSubmit={onSubmit} initialValues={initialValues} validate={()=>{}}
            branch={branch} tags={tags} setTags={setTags}
        />
    )
}

function CreateNewBranch({branchType}){
    const userContext = useContext(UserContext);
    const cachedBranches = useContext(CachedBranchesContext);
    const [tags,setTags] = useState([]);

    let initialValues={
        name:'',
        uri:'',
        description:'',
        default:false,
        tags:[],
        branch_type:branchType
    }

    async function onSubmit(values){
         
        let form = document.getElementById("branchForm");
        let description = document.getElementById('description');
        description.value = description.value.replace(/(\r\n|\n|\r)/gm, "")
        var formData = new FormData(form);
        let newTags = tags.map(t=>t.label).join(", ");
        formData.append('tags',newTags)
        formData.append('branch_type',branchType)
        let errors = {};
        let url = `/api/branches/new/`;

        try{
            let response = await axios.post(
                url,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
            let updatedResponse = await axios.get(`/api/branches/${response.data.uri}/`)
            if(updatedResponse.status == 200){
                userContext.branches.push(updatedResponse.data);
                cachedBranches.owned.push(updatedResponse.data);
                userContext.changeCurrentBranch(updatedResponse.data);
                history.push(`/${updatedResponse.data.uri}`)
            }
        }catch(e){
            errors = e.response.data
        }
        
        return errors;
    }

    return(
        <BranchForm onSubmit={onSubmit} initialValues={initialValues} validate={()=>{}}
            createNew tags={tags} setTags={setTags} branchType={branchType}
        />
    )
}

export function PostRegisterForm({onSubmit,initialValues,branch,submittionFunc,postRegisterAction}){
    const theme = useTheme();

    return(
        <Form onSubmit={onSubmit} initialValues={initialValues}
            render={({handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors })=>{

                submittionFunc.current = handleSubmit;

                return(
                    <form id="branchForm" style={{width:'100%'}} onSubmit={handleSubmit}>
                        <h1 style={{margin:'20px 0'}}>Customize your profile before you go in</h1>

                        <div style={{margin:'5px 0'}}>
                            <GenericProfile branch={branch}/>
                        </div>

                        <div style={{margin:'5px 0'}}>
                            <UriField branch={branch}/>                       
                        </div>

                        <div style={{margin:'5px 0'}}>
                            <DescriptionField initialValues={initialValues}/>  
                        </div>
                        <div css={{display:'flex',justifyContent:'flex-end'}}>
                            <div role="button" onClick={postRegisterAction}>                   
                                <ArrowSvg css={{height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:'#2397f3',
                                fill:'white',transform:'rotate(180deg)'}}/>
                            </div>
                        </div>
                    </form>
                )
            }}
        />
    )
}

function BranchForm({onSubmit,initialValues,validate,createNew=false,branch,tags=null,setTags=null,branchType}){
    const theme = useTheme();
    const profileRef = useRef(null);
    const wrapperRef = useRef(null);

    let isDefaultSwitchDisabled = false;
    if(!createNew && branch.default){
        isDefaultSwitchDisabled = true;
    }

    function handleChange(values){
        setTags(values);
    }

    return(
        <Form onSubmit={onSubmit}
            initialValues={initialValues}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="branchForm" style={{padding:10}} onSubmit={handleSubmit}>
                        {createNew?<h1 css={{borderBottom:`3px solid ${theme.primaryColor}`}}>
                        {branchType=='CM'?'New community':'NeW personal profile'}</h1>:null}
                        <div style={{margin:'5px 0'}}>
                            <label style={{height:'100%'}} css={theme=>settingLabel(theme)}>Profile Image</label>
                            <div className="flex-fill avatar-banner-wrapper" ref={wrapperRef}>
                                <Profile src={branch?branch.branch_image:null} branch={branch} wrapperRef={wrapperRef} 
                                profileRef={profileRef} createNew={createNew}/>
                            </div>
                            {errors.branch_image && <span className="setting-error">{errors.branch_image}</span>}
                            {errors.branch_banner && <span className="setting-error">{errors.branch_banner}</span>}
                        </div>
                        <div>
                            <Field name="name" placeholder="Name" validate={(value)=>value?undefined:'Required'}
                                render={({ input, meta }) => (
                                <div>
                                    <label css={theme=>settingLabel(theme)}>Name</label>
                                    <input {...input} css={theme=>settingInput(theme)} type="text" placeholder="Name" maxLength="30" />
                                    {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                                    {/*{meta.validating && <p>loading</p>}*/}
                                    <span className="setting-info">Maximum of 30 characters</span>
                                </div>
                                )}
                            />
                        </div>

                        <div style={{margin:'5px 0'}}>
                            <UriField branch={branch}/>                       
                        </div>

                        <div style={{margin:'5px 0'}}>
                            <DescriptionField initialValues={initialValues}/>  
                        </div>
                        
                        <div style={{margin:'5px 0'}}>
                            <Field name="default" type="checkbox">
                                {({ input, meta }) => (
                                    <div>
                                        <label css={theme=>settingLabel(theme)}>Default</label>
                                        <span css={info}>Enable this if you want to log in as this branch 
                                        each time you load westeria</span>
                                        <Toggle checked={input.value} {...input} disabled={isDefaultSwitchDisabled} 
                                        icons={false} className="toggle-switch"/>
                                    </div>
                                )}
                            </Field>
                        </div>
                        {createNew?null:
                        branchType=='CM'?
                            <div style={{margin:'5px 0'}}>
                                <Field
                                name="tags">
                                {({ input, ...rest  }) => {
                                    return <div>
                                        <label css={theme=>settingLabel(theme)}>Tags</label>
                                        <span css={info}>Tags are used to identify your community.
                                        Your community members will be able to create content with these selected tags</span>
                                        <CreateableTagSelector tags={tags} setTags={setTags} onChange={handleChange} 
                                        {...input} {...rest}/>
                                    </div>
                                }}
                                </Field>
                            </div>:null
                        }
                        
                        {submitSucceeded?<p className="form-succeed-message">{createNew?
                        'Successfully created branch':'Successfully saved changes'}</p>:null}
                        {submitFailed?<p className="form-error-message">An error occured</p>:null}
                        <Save submitting={submitting} submitSucceeded={submitSucceeded} pristine={pristine} invalid={invalid}/>
                    </form>
                )}
            }>
        </Form>
    )
}

export function DescriptionField({initialValues}){
    const [remainingCharacters,setRemainingCharecters] = 
    useState(initialValues.description?140 - initialValues.description.length:140)

    function validateRemainingCharacters(){
        let textarea = document.getElementById('description')
        if(textarea.value>140){
            return `Too many characters (${textarea.value}). Maximum length is 140 characters`;
        }
        setRemainingCharecters(140 - textarea.value.length)
    }
    return(
        <Field name="description"
        validate={validateRemainingCharacters}>
            {({ input, meta }) => (
            <div>
                <label css={theme=>settingLabel(theme)}>Description</label>
                <textarea {...input} css={theme=>settingInput(theme)}
                style={{resize:'none',maxHeight:400,minHeight:100,width:'90%'}} 
                placeholder="Type something that describes your branch" id="description" maxLength="140" />
                <span className="setting-info">{remainingCharacters} characters left.</span>
                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
            </div>
            )}
        </Field>   
    )
}

export function UriField({branch=null}){
    const simpleMemoize = fn => {
        let lastArg;
        let lastResult;
        return arg => {
          if (arg !== lastArg) {
            lastArg = arg;
            lastResult = fn(arg);
          }
          return lastResult;
        };
      };
      
      const usernameAvailable = async (value,allValues,meta) => {
        
        // Don't run validation if the field is not active
        // prevents request spam
        if (!meta.active){
            return undefined
        }

        if (!value) {
            return "Required";
        }

        let sanitizeRe = /^[a-zA-Z0-9_.]*$/;
        if(!value.match(sanitizeRe)){
            return "The username you entered contains invalid characters";
        }

        let r;
        try{
            r = await axios.get(`/api/branches/${value}/`);
            if(branch && branch.uri == value){
                return undefined;
            }
            return "Username not available"
        }catch(err){
             
        }

        return undefined;
      };

    function cancelSearch(val,prevVal){
        if(val!=prevVal){
            source.cancel('Operation canceled by the user.');
            CancelToken = axios.CancelToken;
            source = CancelToken.source();
        }
    }

    return(
        <>
        <Field name="uri"
        validate={usernameAvailable}>
            {({ input, meta }) => (
            <div>
                <label css={theme=>settingLabel(theme)}>Username</label>
                <input {...input} css={theme=>settingInput(theme)} type="text" placeholder="Username" maxLength="60" />
                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                {/*{meta.validating && <p>loading</p>}*/}
                <span className="setting-info">Maximum of 60 characters</span>
            </div>
            )}
        </Field>
        <Error name="uri"/>
        <OnChange name="uri">
            {(value, previous) => {
                cancelSearch(value,previous);
            }}
        </OnChange>
        </>
    )
}


function PrivacySettings(){

    async function onSubmit(values){
        let errors = {}
        let url = '/rest-auth/password/change/'
        let data = {
           ...values 
        }

        try{
            const response = await axios.post(
                url,
                data,
                {
                    withCredentials: true,
                    headers:{
                        'Content-Type':'application/json',
                        'X-CSRFToken':getCookie('csrftoken')
                    }
                }
            )
        }catch(error){
            if(error.response.data.old_password){
                errors.old_password = error.response.data.old_password[0]
            }
            if(error.response.data.new_password2){
                errors.new_password2 = error.response.data.new_password2[0]
            }
        }
        
        return errors
    }

    function validate(values){
        const errors = {};
        if (values.new_password1 != values.new_password2 && values.new_password1!='' && values.new_password2!='') {
            errors.new_password2 = "The passwords don't match";
        }
        return errors;
    }

    return(
        <Form onSubmit={onSubmit} validate={validate} 
        render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
            return (
                <form id="privacyForm" style={{padding:10}} onSubmit={handleSubmit}>
                    <Password name="old_password" placeholder="" label="Old password"/>
                    <Error name="old_password" />
                    <Password name="new_password1" placeholder="" label="New password"/>
                    <Password name="new_password2" placeholder="" label="Confirm new password"/>
                    {submitSucceeded?<p className="form-succeed-message">Successfully changed password!</p>:null}
                    {submitFailed && errors.length==0?<p className="form-error-message">An error occured!</p>:null}
                    <Save submitting={submitting} submitSucceeded={submitSucceeded} pristine={pristine} invalid={invalid}/>
                </form>
            )
        }}>
        </Form>
    )
}

function Password({name,placeholder,label}){
    return(
        <div>
            <Field name={name} type="password"
            placeholder={placeholder}>
                {({ input, meta }) => (
                    <div>
                        <label css={theme=>settingLabel(theme)}>{label}</label>
                        <input {...input} css={theme=>settingInput(theme)}
                        placeholder={placeholder} required/>
                        {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                    </div>
                )}
            </Field>

        </div>
    )
}

function Save({submitting,pristine,invalid,submitSucceeded}){
    return(
        <button className="form-save-button" type="submit" disabled={submitting || invalid}>
            Save
        </button>
    )
}

const Error = ({ name }) => (
    <Field
      name={name}
      subscription={{ touched: true, submitError: true }}
      render={({ meta: { touched, submitError } }) =>
        touched && submitError ? (
            <p className="form-error-message">{submitError}</p>
        ) : null
      }
    />
  );



export function GenericProfile({branch=null,createNew,className=""}){
    const wrapperRef=useRef(null);
    const profileRef=useRef(null);

    return(
        <>
        <label style={{height:'100%'}} css={theme=>settingLabel(theme)}>Profile Image</label>
        <div className={`flex-fill avatar-banner-wrapper ${className}`} ref={wrapperRef}>
            <Profile src={branch?branch.branch_image:null} branch={branch} wrapperRef={wrapperRef} 
            profileRef={profileRef} createNew={createNew}/>
        </div>
        </>
    )
}

export function Profile({src=null,wrapperRef,profileRef,createNew,name="branch_image",showError=false}){
    const theme = useTheme();
    function onInput(){

        // 2mb
        let max = 2097152;
        let input = document.getElementById('branch-image')
        if(input.files.length > 0){
            let isValidSize = validateImageSize(input,max)
            if(!isValidSize){
                return 'The profile image you entered exceeds the maximum size of 2mb.'
            }
        }
    }

    return(
        <Field name={name}
        validate={onInput}>
            {({ input, meta }) => (
            <div css={imageCss}>
                <label style={{height:'100%',padding:0,boxSizing:'border-box'}} css={theme=>settingLabel(theme)} 
                htmlFor="branch-image">
                    <ImageInput key="profile" src={src?src:null} wrapperRef={wrapperRef} nodeRef={profileRef} 
                    getWidth={width=>width} className="round-picture" 
                    css={theme=>({height:'100%',objectFit:'cover',border:`1px solid ${theme.borderColor}`})} alt="Profile"
                    extraStyle={{border:`1px solid ${theme.borderColor}`}}
                    />
                </label>
                <input {...input} ref={profileRef} accept="image/*" id="branch-image" className="inputfile" type="file" />
                {showError?
                    meta.error && meta.touched && <span className="setting-error">{meta.error}</span>:null}
                {/*{meta.validating && <p>loading</p>}*/}
            </div>
            )}
        </Field>
    )
}

function Banner({branch,wrapperRef,bannerRef,createNew}){
    const theme = useTheme();
    function onInput(){

        // 5mb
        let max = 5242880;
        let input = document.getElementById('branch_banner')
        if(input.files.length > 0){
            let isValidSize = validateImageSize(input,max)
            if(!isValidSize){
                return 'The banner image you entered exceeds the maximum size of 5mb.'
            }
        }
    }

    let defaultBannerUrl = '/images/group_images/banner/default';
    let r = new RegExp(defaultBannerUrl);
    let isDefault = r.test(branch?branch.branch_banner:true)

    return(
        <Field name="branch_banner"
        validate={onInput}>
            {({ input, meta }) => (
            <div>
                <label style={{height:'100%',padding:0}} css={theme=>settingLabel(theme)} htmlFor="branch_banner">
                    <ImageInput key="banner" src={createNew || isDefault?null:branch.branch_banner} wrapperRef={wrapperRef} nodeRef={bannerRef} 
                    getWidth={width=>width * 3} className="branch-banner-setting" 
                    extraStyle={{border:`1px solid ${theme.borderColor}`,borderRadius:15}} alt="Banner"/>
                </label>
                <input {...input} ref={bannerRef} accept="image/*" id="branch_banner" className="inputfile" type="file" />
                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                {/*{meta.validating && <p>loading</p>}*/}
            </div>
            )}
        </Field>
    )
}

function ImageInput({src,nodeRef,wrapperRef,getWidth,className,alt,extraStyle={}}){
    const [source,setSource] = useState(src);
    const [width,setWidth] = useState(0);
    const [lineHeight,setLineHeight] = useState(0);

    if(nodeRef.current){
        let file = nodeRef.current.files[0];
        var reader = new FileReader();
        if(file){
            reader.readAsDataURL(file);
        }
        reader.addEventListener("load", function () {
            setSource(reader.result);
        }, false);
    }

    useLayoutEffect(()=>{
        if(wrapperRef.current){
            setWidth(getWidth(wrapperRef.current.clientHeight));
            setLineHeight(wrapperRef.current.clientHeight);
        }
    },[wrapperRef.current])

    useEffect(()=>{
        if(src!=source){
            setSource(src);
        }
    },[src])

    return(
        source?
        <img alt={alt} src={source || null} className={`${className}`}
        style={{width:width,lineHeight:`${lineHeight}px`,textAlign:'center',display:'block',...extraStyle}}/>:
        <div className={`${className}`}
        style={{width:width,lineHeight:`${lineHeight}px`,textAlign:'center',display:'block',
        border:'1px solid #d8d5d5',...extraStyle}}>{alt}</div>
    )
}