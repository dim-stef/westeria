import React, {Component} from "react";
import {Link, Redirect} from 'react-router-dom'
import {Helmet} from 'react-helmet'
import {MoonLoader} from 'react-spinners';
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'

export default class Register extends Component{
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
                <Redirect to="/"/>
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
                <title>Register - Subranch</title>
                <meta name="description" content="Register to Subranch" />
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
