import React, {Component} from "react";
import {Link, Redirect} from 'react-router-dom'
import {Helmet} from "react-helmet"
import MoonLoader from 'react-spinners/MoonLoader';
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
                <title>Login - Subranch</title>
                <meta name="description" content="Login to Subranch" />
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
