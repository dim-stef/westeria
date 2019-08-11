import React, { useEffect } from "react";
import { Link,withRouter,Redirect } from 'react-router-dom'
import { Form, Field } from 'react-final-form'
import axios from 'axios'

export function AuthFormWrapper({children}){
    return(
        <div className="main-layout">
            <div className="form-layout" style={{margin: '6em auto', backgroundColor: '#ffffff', textAlign: 'center'}}>
                <div className="form-container" style={{width: '70%', margin: 'auto', paddingBottom: '14px'}}>
                    {children}
                </div>
            </div>
        </div>
    )
}


export const Error = ({ name }) => (
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

export function Password({name,placeholder,className='setting-input',label}){
    return(
        <div>
            <Field name={name} type="password" 
            placeholder={placeholder}>
                {({ input, meta }) => (
                    <div>
                        {label?<label className="setting-label">{label}</label>:null}
                        <input {...input} className={className}
                        placeholder={placeholder} required/>
                        {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                    </div>
                )}
            </Field>

        </div>
    )
}

export function Save({submitting,pristine,invalid,submitSucceeded,className,value}){
    return(
        <button className={`${className}`} type="submit" disabled={submitting || pristine}>
            {value}
        </button>
    )
}