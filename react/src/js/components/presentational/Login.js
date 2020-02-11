import React, {Component,useEffect,useState,useLayoutEffect,useContext} from "react";
import {Link, Redirect} from 'react-router-dom'
import {Helmet} from "react-helmet"
import {Field, Form} from 'react-final-form'
import {css} from "@emotion/core"
import {AuthenticationInput,AuthenicationSave,AuthenticationWrapper} from "./Forms"
import MoonLoader from 'react-spinners/MoonLoader';
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'

var csrftoken = getCookie('csrftoken');

export class Login extends Component{
    static contextType = UserContext
    constructor(props){
        super(props);
        this.state = {
            email:'',
            password:'',
            success:false,
            errorMessages:null,
            loaded:false,
            sumbitted:false,
        }

        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleEmailChange(e){
        this.setState({email:e.target.value})
    }

    handlePasswordChange(e){
        this.setState({password:e.target.value})
    }

    handleSubmit(e){
        var self = this;
        self.setState({submitted:true})

        axios({
            method: 'post',
            url: '/rest-auth/login/',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + localStorage.getItem("token"),
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                username:'',
                email:self.state.email,
                password:self.state.password
            },
            })
            .then(function (response) {
                localStorage.setItem("token",response.data.token);
                self.setState({success:true})
                 
            })
            .catch(function (error) {
                if (error.response) {
                    self.setState({errorMessages:error.response.data.non_field_errors,submitted:false})
                   
                }
        })
        e.preventDefault()
    }


    componentDidMount(){
        document.body.classList.add('body-auth');
    }

    componentWillUnmount(){
        document.body.classList.remove('body-auth');
    }


    render(){
        if(this.state.success || this.context.isAuth){
            return(
                <Redirect to="/"/>
            )
        }

        var errorMessages = [];

        if(this.state.errorMessages){
            errorMessages = this.state.errorMessages.map(er=>{
                return <div className="auth-error">{er}</div>
            })
        }
        
        return(
            <>
            <Helmet>
                <title>Login - Westeria</title>
                <meta name="description" content="Login to Westeria" />
                <link rel="canonical" href="https://subranch.com/login"/>
            </Helmet>
            <div className="main-layout">
                <div className="form-layout" style={{margin: '6em auto', backgroundColor: '#ffffff', textAlign: 'center'}}>
                <div className="form-container" style={{width: '70%', margin: 'auto', paddingBottom: '14px'}}>
                    <form onSubmit={this.handleSubmit} action="#" method="post" style={{color: 'black', paddingTop: '10px'}}>
                    <input className="text email auth-input" type="email" name="email" 
                    placeholder="Email" required style={{}} value={this.state.email} onChange={this.handleEmailChange}/>
                    <input className="text auth-input" type="password" name="password" 
                    placeholder="Password" required value={this.state.password} onChange={this.handlePasswordChange}/>
                    
                    {errorMessages}
                    {this.state.submitted?
                    <div className="flex-fill center-items" style={{marginTop:20}}>
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={true}
                        />
                    </div>:<input className="login-btn" type="submit" value="Login" />}
                    
                    </form>
                    <p><Link to="/password/reset">Forgot password?</Link></p>

                    <p>Don't have an Account? <Link to="/register" 
                    style={{textDecoration: 'none', backgroundColor: 'transparent', fontWeight: 500}}>Sign Up</Link></p>
                </div>
                </div>
            </div>
            </>
        )
    }
}

export default function Login2(){

    let initialValues = {

    }

    const userContext = useContext(UserContext)
    const [loading,setLoading] = useState(false);

    async function onSubmit(values){
        let errors = {};
        setLoading(true);
        try{
            let uri = '/rest-auth/login/';
            let config = {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer " + localStorage.getItem("token"),
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }
            let response = await axios.post(uri,values,config);
            localStorage.setItem("token",response.data.token);
            setLoading(false);
        }catch(e){
            setLoading(false);
            return e.response.data
        }
        
        return errors;
    }

    return(
        <>
            <Helmet>
                <title>Login - Westeria</title>
                <meta name="description" content="Login to Westeria" />
                <link rel="canonical" href="https://subranch.com/login"/>
            </Helmet>
                <AuthenticationWrapper header="Login to Westeria">
                <div css={theme=>({padding:10})}>
                    <Form onSubmit={onSubmit} initialValues={initialValues}
                    render={({handleSubmit,submitting,submitSucceeded,submitFailed, pristine, submitErrors, errors })=>{

                        if(submitSucceeded || userContext.isAuth){
                            return <Redirect to="/"/>
                        }

                        return(
                            <form id="branchForm" css={{width:'100%',display:'flex',flexFlow:'column',
                            justifyContent:'center',alignItems:'center'}} onSubmit={handleSubmit}>
                                <AuthenticationInput name="email" type="email" placeholder="email@address.com" label="Email"/>
                                <AuthenticationInput name="password" type="password" placeholder="shhh..." label="Password"/>
                                {submitErrors?
                                submitErrors.non_field_errors.map(e=>{
                                    return <div key={e} className="setting-error" css={{margin:'15px 0'}}>{e}</div>
                                }):null}
                                {loading?<MoonLoader
                                sizeUnit={"px"}
                                size={20}
                                color={'#123abc'}
                                loading={true}
                                />:<AuthenicationSave value="Login"/>}
                                
                            </form>
                        )
                    }}/>
                </div>
                <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center',marginTop:20}}>
                    <div css={{fontSize:'1.5rem'}}>
                        <span>Don't have an account? </span>
                        <Link to="/register" css={theme=>css({color:'#4b9be0',textDecoration:'none',
                        })}>Sign up</Link>
                    </div>
                    <div css={{fontSize:'1.5rem',marginTop:5}}>
                        <Link to="/register" css={theme=>css({color:'#4b9be0',textDecoration:'none',
                        })}>Forgot password</Link>
                    </div>
                </div>
            </AuthenticationWrapper>        
        </>
    )
}
