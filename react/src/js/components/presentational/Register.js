import React, {Component,useContext,useState} from "react";
import {Link, Redirect} from 'react-router-dom'
import {Helmet} from 'react-helmet'
import {Field, Form} from 'react-final-form'
import {css} from "@emotion/core"
import {useMediaQuery} from 'react-responsive'
import {AuthenticationInput,AuthenicationSave,AuthenticationWrapper} from "./Forms"
import MoonLoader from 'react-spinners/MoonLoader';
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'

export class Register extends Component{
    static contextType = UserContext
    constructor(props){
        super(props);
        this.state = {
            name:'',
            email:'',
            password1:'',
            password2:'',
            success:false,
            errors:[],
            submitted:false
        }

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange1 = this.handlePasswordChange1.bind(this);
        this.handlePasswordChange2 = this.handlePasswordChange2.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    
    }

    handleNameChange(e){
        this.setState({name:e.target.value})
    }

    handleEmailChange(e){
        this.setState({email:e.target.value})
    }

    handlePasswordChange1(e){
        this.setState({password1:e.target.value})
    }

    handlePasswordChange2(e){
        this.setState({password2:e.target.value})
    }

    handleSubmit(e){
        var self = this;
        self.setState({submitted:true})

        axios({
            method: 'post',
            url: '/rest-auth/registration/',
            data: {
                name:self.state.name,
                email:self.state.email,
                password1:self.state.password1,
                password2:self.state.password2
            },
            })
            .then(function (response) {
                localStorage.setItem("token",response.data.token);
                localStorage.setItem("justRegistered",'true');
                self.setState({success:true})
            })
            .catch(function (err) {
                let errors = [];
                let email = err.response.data.email;
                let password1 = err.response.data.password1;
                let non_field_errors = err.response.data.non_field_errors;
                if(email){
                    errors=[...email]
                }
                if(password1){
                    errors=[...errors,...password1]
                }
                if(non_field_errors){
                    errors=[...errors, ...non_field_errors]
                }
                self.setState({errors:errors,submitted:false})
        })
        e.preventDefault();
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
                <Redirect to="/register/edit"/>
            )
        }

        let errorMessages = []
        if(this.state.errors){
            errorMessages = this.state.errors.map(er=>{
                return <div className="auth-error">{er}</div>
            })
        }
        
        return(
            <>
            <Helmet>
                <title>Register - Westeria</title>
                <meta name="description" content="Register to Westeria" />
                <link rel="canonical" href="https://subranch.com/register"/>
            </Helmet>
            <div className="main-layout">
                <div className="form-layout" style={{margin: '6em auto', backgroundColor: '#ffffff', textAlign: 'center'}}>
                <div className="form-container" style={{width: '70%', margin: 'auto', paddingBottom: '14px'}}>
                    <form onSubmit={this.handleSubmit} action="#" method="post" style={{color: 'black', paddingTop: '10px'}}>
                    <input className="text auth-input" name="auth-name" placeholder="Name" required value={this.state.name} onChange={this.handleNameChange}/>
                    <input className="text email auth-input" type="email" name="email" placeholder="Email" required value={this.state.email} onChange={this.handleEmailChange}/>
                    <input className="text auth-input" type="password" name="password1" placeholder="Password" required value={this.state.password1} onChange={this.handlePasswordChange1}/>
                    <input className="text auth-input" type="password" name="password2" placeholder="Confirm Password" required value={this.state.password2} onChange={this.handlePasswordChange2}/>
                    <div className="wthree-text" style={{marginTop: '20px'}}>
                        <p style={{margin: '10px', color: 'gray', fontSize: '0.8em'}}>By clicking Signup you are agreeing to our Terms and Conditions</p>
                        <div className="clear"> </div>
                    </div>
                    {errorMessages}
                    {this.state.submitted?
                    <div className="flex-fill center-items" style={{marginTop:20}}>
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={true}
                        />
                    </div>:
                    <input className="submit-btn" type="submit" value="Sign Up"/>}
                    
                    </form>
                    <p>Already have an account? <Link to="/login" style={{textDecoration: 'none', backgroundColor: 'transparent', fontWeight: 500}}>Login</Link></p>
                </div>
                </div>
            </div>
            </>
            
        )
    }
}

export default function Register2(){
    let initialValues = {

    }

    const [loading,setLoading] = useState(false);

    const userContext = useContext(UserContext);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    async function onSubmit(values){
        let errors = {};
        setLoading(true);

        try{
            let uri = '/rest-auth/registration/';
            let config = {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }
            let response = await axios.post(uri,values,config);
            localStorage.setItem("token",response.data.token);
            localStorage.setItem("justRegistered",'true');
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
                <title>Register - Westeria</title>
                <meta name="description" content="Register to Westeria" />
                <link rel="canonical" href="https://subranch.com/register"/>
            </Helmet>
            <AuthenticationWrapper header="Connect with us it's free!" logoSize={isMobile?40:100}>
                <div css={{padding:10}}>
                <Form onSubmit={onSubmit} initialValues={initialValues}
                    render={({handleSubmit,submitting,submitSucceeded,submitFailed, pristine, submitErrors, errors })=>{
                        let errorArr = [];
                        for (let key in submitErrors) {
                            errorArr.push(submitErrors[key]);
                        }

                        if(submitSucceeded || userContext.isAuth){
                            return <Redirect to="/register/edit"/>
                        }

                        return(
                            <>
                            <form id="branchForm" css={{width:'100%',display:'flex',flexFlow:'column',
                            justifyContent:'center',alignItems:'center'}} onSubmit={handleSubmit}>
                                <AuthenticationInput name="name" type="name" placeholder="'John' or whatever" label="Name"/>
                                <AuthenticationInput name="email" type="email" placeholder="email@address.com" label="Email"/>
                                <AuthenticationInput name="password1" type="password" placeholder="shhh..." label="Password"/>
                                <AuthenticationInput name="password2" type="password" 
                                placeholder="Confirm shhh..." label="Confirm Password"/>

                                {submitErrors?
                                    errorArr.map(value => {
                                        return value.map(e=>{
                                            return <div key={e} className="setting-error" 
                                            css={{margin:'15px 0',textAlign:'center'}}>{e}</div>
                                        })
                                    })
                                :null}
                                {loading?
                                    <MoonLoader
                                    sizeUnit={"px"}
                                    size={20}
                                    color={'#123abc'}
                                    loading={true}
                                    />
                                    :<AuthenicationSave value="Sign up"/>
                                    }
                            </form>
                            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center',marginTop:20}}>
                                <div css={{fontSize:'1.5rem'}}>
                                    <span>Already have an account? </span>
                                    <Link to="/login" css={theme=>css({color:'#4b9be0',textDecoration:'none',
                                    })}>Login</Link>
                                </div>
                            </div>
                            </>
                        )
                    }}/>
                </div>
            </AuthenticationWrapper>
        </>
    )
}