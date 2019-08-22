import React, { Component } from "react";
import { Redirect } from 'react-router'
import { Link } from 'react-router-dom'
import {Helmet} from "react-helmet"
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'

var csrftoken = getCookie('csrftoken');

export default class Login extends Component{
    static contextType = UserContext
    constructor(props){
        super(props);
        this.state = {
            email:'',
            password:'',
            success:false,
            errorMessages:null

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
                    self.setState({errorMessages:error.response.data.non_field_errors})
                   
                }
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
                <title>Login - Subranch</title>
                <meta name="description" content="Login to Subranch" />
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
                    <p><Link to="/password/reset">Forgot password?</Link></p>
                    <input className="login-btn" type="submit" value="LOGIN" />
                    </form>
                    <p>Don't have an Account? <Link to="/register" 
                    style={{textDecoration: 'none', backgroundColor: 'transparent', fontWeight: 500}}>Sign Up</Link></p>
                </div>
                </div>
            </div>
            </>
        )
    }
}
