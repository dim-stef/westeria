import React, {useLayoutEffect,useState} from "react";
import {Field, Form} from 'react-final-form'
import {Helmet} from "react-helmet"
import {css} from "@emotion/core"
import MoonLoader from 'react-spinners/MoonLoader';
import {AuthFormWrapper,AuthenticationInput,AuthenicationSave,AuthenticationWrapper} from "./Forms"
import axios from 'axios'


function PasswordReset(){

    const [loading,setLoading] = useState(false);
    
    async function handlePasswordReset(values){
        let errors = {};
        setLoading(true)
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
            setLoading(false)
             
        }catch(error){
            if(error.response.data.email){
                errors.email = error.response.data.email[0]
            }
            setLoading(false)
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
            <title>Password reset - Westeria</title>
            <meta name="description" content="Forgot your password? You can reset it here." />
            <link rel="canonical" href="https://subranch.com/password/reset"/>

        </Helmet>
        <AuthenticationWrapper header="Reset your password">
            <Form onSubmit={handlePasswordReset}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="passwordResetForm" css={{padding:10,display:'flex',flexFlow:'column',alignItems:'center'}} onSubmit={handleSubmit}>
                        <AuthenticationInput name="email" type="email" label="Email" placeholder="address@email.com" required/>
                        <Error name="email"/>
                        {submitSucceeded?<p className="form-succeed-message">An email has been sent to your email address</p>:null}
                        {loading?
                            <MoonLoader
                            sizeUnit={"px"}
                            size={20}
                            color={'#123abc'}
                            loading={true}
                            />
                            :<AuthenicationSave submitting={submitting} submitSucceeded={submitSucceeded} pristine={pristine} invalid={invalid}
                            className="login-btn" value="Send"/>
                        }
                    </form>
                )
            }}/>
        </AuthenticationWrapper>
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

