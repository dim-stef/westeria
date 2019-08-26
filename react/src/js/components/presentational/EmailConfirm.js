import React, { useEffect } from "react";
import { Link,withRouter,Redirect } from 'react-router-dom'
import { Form, Field } from 'react-final-form'
import {Helmet} from 'react-helmet'
import {AuthFormWrapper,Error,Password,Save} from "./Forms"
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
                    {headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                }
            );
             
        }catch(error){  
            if(error.response.data.key){
                errors.key = error.response.data.key[0]
            }
            console.log(error.response)
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
            <title>Email confirm - Subranch</title>
            <meta name="description" content="Email confirm." />
        </Helmet>
        <AuthFormWrapper>
            <Form onSubmit={handleEmailConfirm}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="emailConfirmForm" style={{padding:10}} onSubmit={handleSubmit}>

                        {submitSucceeded?<Redirect to="/"/>:null}
                        <Save submitting={submitting} submitSucceeded={submitSucceeded}
                        className="login-btn" value="Confirm email" />

                    </form>
                )
            }}/>
        </AuthFormWrapper>
        </>
        
    )
}

export default withRouter(EmailConfirm);