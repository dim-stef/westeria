import React, {useEffect,useState} from "react";
import {withRouter} from 'react-router-dom'
import {Form} from 'react-final-form'
import {Helmet} from 'react-helmet'
import MoonLoader from 'react-spinners/MoonLoader';
import {AuthFormWrapper, Password, Save,AuthenticationInput,AuthenicationSave,AuthenticationWrapper} from "./Forms"
import axios from 'axios'

//"reset/:uid/:token"
function PasswordResetConfirm({match}){
    const [loading,setLoading] = useState(false);

    async function handlePasswordResetConfirm(values){
        let errors = {};
        setLoading(true);
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
            setLoading(false);
             
        }catch(error){
             
            if(error.response.data.email){
                errors.email = error.response.data.email[0]
            }
            setLoading(false);
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
            <title>Password reset confirm - Westeria</title>
            <meta name="description" content="Confirm password reset" />
        </Helmet>
        <AuthenticationWrapper header="Set your new password">
            <Form onSubmit={handlePasswordResetConfirm} validate={validate}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return (
                    <form id="passwordResetConfirmForm" css={{padding:10,display:'flex',flexFlow:'column',alignItems:'center'}} 
                    onSubmit={handleSubmit}>
                        <AuthenticationInput name="new_password1" className="text password auth-input"
                        placeholder="New password" type="password" label="New password"/>
                        <AuthenticationInput name="new_password2" className="text password auth-input" 
                        placeholder="New password" type="password" label="Confirm new password"/>

                        {submitSucceeded?<p className="form-succeed-message">Password successfully changed</p>:null}
                        {loading?
                            <MoonLoader
                            sizeUnit={"px"}
                            size={20}
                            color={'#123abc'}
                            loading={true}
                            />
                            :<AuthenicationSave submitting={submitting} submitSucceeded={submitSucceeded}
                            className="login-btn" value="Change" pristine={pristine} invalid={invalid}/>
                        }
                        

                    </form>
                )
            }}/>
        </AuthenticationWrapper>
        </>
        
    )
}

export default withRouter(PasswordResetConfirm);