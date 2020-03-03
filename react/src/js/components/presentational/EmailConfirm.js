import React, {useEffect} from "react";
import {Redirect, withRouter} from 'react-router-dom'
import {Form} from 'react-final-form'
import {Helmet} from 'react-helmet'
import {AuthFormWrapper, Save,AuthenicationSave,AuthenticationWrapper} from "./Forms"
import axios from 'axios'

//"reset/:uid/:token"
function EmailConfirm({match}){
    async function handleEmailConfirm(values){
        let errors = {};

        try{
            let url = '/rest-auth/registration/verify-email/';
            let response = await axios.post(
                url,
                {
                    key:match.params.token
                },
                    {
                        withCredentials: true,
                        headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                }
            );
             
        }catch(error){  
            if(error.response.data.key){
                errors.key = error.response.data.key[0]
            }
             
        }

        return errors;
    }

    useEffect(()=>{
        document.body.classList.add('body-auth');

        return()=>{
            document.body.classList.remove('body-auth');
        }
    },[])

    return(
        <>
        <Helmet>
            <title>Email confirm - Westeria</title>
            <meta name="description" content="Email confirm." />
        </Helmet>
        <AuthenticationWrapper header="Confirm your email">
            <Form onSubmit={handleEmailConfirm}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="emailConfirmForm" css={{padding:10,display:'flex',flexFlow:'column',
                    alignItems:'center'}} onSubmit={handleSubmit}>

                        {submitSucceeded?<Redirect to="/"/>:null}
                        
                        <AuthenicationSave submitting={submitting} submitSucceeded={submitSucceeded}
                        className="login-btn" value="Confirm" />

                    </form>
                )
            }}/>
        </AuthenticationWrapper>
        </>
        
    )
}

export default withRouter(EmailConfirm);