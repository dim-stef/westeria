import React, {useContext, useEffect, useRef, useState} from "react";
import { useTheme } from 'emotion-theming';
import { css } from "@emotion/core";
import {Field,Form} from 'react-final-form'
import RoutedHeadline from "./RoutedHeadline";
import {UserContext} from "../container/ContextContainer";
import {Input, TextArea, Save} from "./Forms";
import axios from 'axios';

const mainColumn = theme => css({
    flexBasis:'100%',
    margin:0,
    border:`1px solid ${theme.borderColor}`
})
export function FeedbackPage(){
    return(
        <FeedbackForm/>
    )
}

export function FeedbackForm(){
    const userContext = useContext(UserContext);

    async function onSubmit(){
        let form = document.getElementById("feedback");
        let details = document.getElementById('details');
        details.value = details.value.replace(/(\r\n|\n|\r)/gm, "");

        var formData = new FormData(form);
        let errors = {};
        let url = `/api/v1/feedback/new/`;

        try{
            let response = await axios.post(
                url,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
        }catch(e){
            console.log(e)
        }
        
        return errors;
    }

    function validate(values){
        const errors = {};
        if (!values.subject) {
          errors.subject = "Required";
        }
        if (!values.details) {
          errors.details = "Required";
        }
        return errors;
    }

    return(
        <div className="main-column" css={theme=>mainColumn(theme)}>
            <RoutedHeadline headline="About"/>
            <Form onSubmit={onSubmit} validate={validate}
            render={({ handleSubmit,submitting,submitSucceeded,submitFailed, pristine, invalid, errors }) => {
                return <form id="feedback" style={{padding:10}} onSubmit={handleSubmit}>
                    {!userContext.isAuth?<div style={{margin:10}}>
                        <Input name="email" placeholder="Email"
                        label="Email"/> 
                    </div>:null}
                    
                    <div style={{margin:10}}>
                        <Input name="subject" placeholder="Subject"
                        label="Subject" required/> 
                    </div>
                    
                    <div style={{margin:10}}>
                        <TextArea name="details" id="details" label="Details" placeholder="Your personal feedback" 
                        maxLength={3000} required/> 
                    </div>
                    <div style={{margin:10,fontSize:'1.5em'}}>
                        <Save value="Submit feedback" className="accept-btn" invalid={invalid}
                        pristine={pristine} submitting={submitting} style={{fontSize:'1.5rem'}}/>
                        {submitSucceeded?<p className="form-succeed-message">Thank you for the feedback</p>:null}
                        {submitFailed && errors.length==0?<p className="form-error-message">An error occured!</p>:null}

                    </div>
                </form>
            }}></Form>
        </div>
    )
}