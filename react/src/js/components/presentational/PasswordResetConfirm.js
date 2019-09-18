import React, {useEffect} from "react";
import {withRouter} from 'react-router-dom'
import {Form} from 'react-final-form'
import {Helmet} from 'react-helmet'
import {AuthFormWrapper, Password, Save} from "./Forms"
import axios from 'axios'

//"reset/:uid/:token"
function PasswordResetConfirm({match}){
    async function handlePasswordResetConfirm(values){
        let errors = {};

        try{
            let url = '/rest-auth/password/reset/confirm/';
            let response = await axios.post(
                url,
                {
                    ...values,
                    uid:match.params.uid,
                    token:match.params.token
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
             
            if(error.response.data.email){
                errors.email = error.response.data.email[0]
            }
        }

        return errors;
    }

    function validate(values){
        const errors = {};
        if (values.new_password1 != values.new_password2 && values.new_password1!='' && values.new_password2!='') {
            errors.new_password2 = "The passwords don't match";
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
            <title>Password reset confirm - Subranch</title>
            <meta name="description" content="Confirm password reset" />
        </Helmet>
        <AuthFormWrapper>
            <Form onSubmit={handlePasswordResetConfirm} validate={validate}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="passwordResetConfirmForm" style={{padding:10}} onSubmit={handleSubmit}>
                        <Password name="new_password1" className="text password auth-input" placeholder="New password"/>
                        <Password name="new_password2" className="text password auth-input" placeholder="Confirm new password"/>

                        {submitSucceeded?<p className="form-succeed-message">Password successfully changed</p>:null}
                        <Save submitting={submitting} submitSucceeded={submitSucceeded}
                        className="login-btn" value="Change" pristine={pristine} invalid={invalid}/>

                    </form>
                )
            }}/>
        </AuthFormWrapper>
        </>
        
    )
}

export default withRouter(PasswordResetConfirm);