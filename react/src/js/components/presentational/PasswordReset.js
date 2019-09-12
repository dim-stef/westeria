import React, { useEffect,useLayoutEffect } from "react";
import { Link,withRouter,Redirect } from 'react-router-dom'
import { Form, Field } from 'react-final-form'
import {Helmet} from "react-helmet"
import {AuthFormWrapper} from "./Forms"
import axios from 'axios'


function PasswordReset(){

    async function handlePasswordReset(values){
        let errors = {};

        try{
            let url = '/rest-auth/password/reset/';
            let response = await axios.post(
                url,
                {...values},
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

    useLayoutEffect(()=>{
        document.body.classList.add('body-auth');

        return()=>{
            document.body.classList.remove('body-auth');
        }
    },[])

    return(
        <>
        <Helmet>
            <title>Password reset - Subranch</title>
            <meta name="description" content="Forgot your password? You can reset it here." />
        </Helmet>
        <AuthFormWrapper>
            <Form onSubmit={handlePasswordReset}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="passwordResetForm" style={{padding:10}} onSubmit={handleSubmit}>
                        <Field name="email" type="email">
                        {({ input, meta }) => (
                            <div>
                                <input {...input} className="text email auth-input" placeholder="Email" required/>
                                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                            </div>
                        )}
                        </Field>
                        <Error name="email"/>
                        {submitSucceeded?<p className="form-succeed-message">An email has been sent to your email address</p>:null}
                        <Save submitting={submitting} submitSucceeded={submitSucceeded} pristine={pristine} invalid={invalid}
                            className="login-btn" value="Send"
                        />
                    </form>
                )
            }}/>
        </AuthFormWrapper>
        </>
        
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

function Save({submitting,pristine,invalid,submitSucceeded,className="form-save-button",value="Save"}){
    return(
        <button className={className} type="submit" disabled={submitting || pristine}>
            {value}
        </button>
    )
}
export default PasswordReset

