import React, {useState} from "react";
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import {Field} from 'react-final-form'

const settingLabel = theme =>css({
    fontWeight:600,
    fontSize:'1.5em',
    padding:'20px 0 5px',
    color:theme.textLightColor
})

const settingInput = theme =>css({
    borderRadius:15,
    fontSize:'1.7em',
    padding:'5px 10px',
    color:theme.textColor,
    border:`1px solid ${theme.borderColor}`
})

export function Input({name,placeholder,label="",required=false}){
    return(
        <Field name={name} type="text" >
            {({ input, meta })=>(
            <>
                <label css={theme=>settingLabel(theme)}>{label}{required?null:<i> - optional</i>}</label>
                <input {...input} css={theme=>settingInput(theme)}
                required={required} placeholder={placeholder}/>
                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
            </>
            )}
            
        </Field>
    )
}

export function TextArea({name,label,placeholder,maxLength,currentLength=null,required=false}){
    const [remainingCharacters,setRemainingCharacters] = useState(currentLength || 0);

    function validateRemainingCharacters(){
        let textarea = document.getElementById(name)
        if(textarea.value>maxLength){
            return `Too many characters (${textarea.value}). Maximum length is ${maxLength} characters`;
        }
        setRemainingCharacters(maxLength - textarea.value.length)
    }

    return(
        <Field name={name} 
        validate={validateRemainingCharacters}>
            {({ input, meta }) => (
            <>
                <label css={theme=>settingLabel(theme)}>{label}</label>
                <textarea {...input} css={theme=>settingInput(theme)} required={required}
                style={{resize:'none',maxHeight:400,minHeight:100,width:'90%'}} 
                placeholder={placeholder} id={name} maxLength={maxLength} />
                {maxLength!=0?<span className="setting-info">{remainingCharacters} characters left.</span>:null}
                {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
            </>
        )}
        </Field>
    )
}

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

export function Save({submitting,pristine,invalid,submitSucceeded,className,style=null,value}){
    return(
        <button className={`${className}`} type="submit" disabled={submitting || pristine || invalid} style={style}>
            {value}
        </button>
    )
}