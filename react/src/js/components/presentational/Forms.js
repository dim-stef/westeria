import React, {useState,useLayoutEffect} from "react";
import { useTheme } from 'emotion-theming'
import {useMediaQuery} from 'react-responsive'
import { css } from "@emotion/core";
import {Field} from 'react-final-form'
import history from "../../history";

const settingLabel = theme =>css({
    fontWeight:600,
    fontSize:'1.5em',
    padding:'20px 0 5px',
    color:theme.textLightColor
})

const settingInput = theme =>css({
    borderRadius:50,
    fontSize:'1.7em',
    padding:'5px 10px',
    color:theme.textColor,
    border:`1px solid ${theme.borderColor}`
})

const authenticationSettingInput = theme =>css({
    borderRadius:50,
    fontSize:'1.7em',
    padding:'13px',
    color:theme.textColor,
    border:`1px solid ${theme.borderColor}`,
    width:'100%',
    boxSizing:'border-box',
    paddingTop:20
})

const authenticationSettingLabel = theme =>css({
    fontWeight:600,
    fontSize:'1.8em',
    padding:'10px 0 12px',
    color:theme.textLightColor
})

const authenticationActionButton = theme =>css({
    border:0,
    padding:'15px 10px',
    width:'60%',
    borderRadius:50,
    color:'white',
    fontWeight:'bold',
    fontSize:'1.6rem',
    marginTop:20,
    background:'linear-gradient(90deg, rgb(0, 150, 218) 0%, rgb(189, 65, 230) 100%)'
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

export function AuthenticationInput({name,placeholder,label="",type="text"}){
    return(
        <div style={{margin:'12px 0',width:'100%'}}>
            <Field name={name} type="text" >
                {({ input, meta })=>(
                <>

                    <div css={{position:'relative'}}>
                        <span css={theme=>({position:'absolute',top:-10,left:20,fontSize:'1.5rem',fontWeight:'bold',
                            backgroundColor:theme.backgroundLightColor,padding:'0 10px'
                        })}>{label}</span>
                        <input {...input} css={authenticationSettingInput}
                        required placeholder={placeholder} type={type}/>
                        {meta.error && meta.touched && <span className="setting-error">{meta.error}</span>}
                    </div>
                </>
                )}
                
            </Field>
        </div>
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

export function AuthenticationWrapper({children,header,showLogo=true,logoSize=100}){
    const isLaptopOrDesktop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })

    useLayoutEffect(()=>{
        // force preload logo
        const img = new Image();
        img.src = 'https://sb-static.s3.eu-west-2.amazonaws.com/static/static/android-chrome-256x256.png';
    },[])

    return(
        <div css={theme=>({minHeight:'100%',width:'100%',display:'flex',flexFlow:'column',alignItems:'center',
        justifyContent:'center',backgroundColor:theme.backgroundLightColor})}>
            <div css={{width:'90%',maxWidth:400,fontSize:isLaptopOrDesktop?'1em':'0.8em'}}>
                <div css={{display:'flex',flexFlow:'column',alignItems:'center'}}>
                    {showLogo?<img src="https://sb-static.s3.eu-west-2.amazonaws.com/static/static/android-chrome-256x256.png"
                        css={{height:logoSize,width:logoSize}} onClick={()=>history.push('/')}
                    />:null}
                    
                    <h1 css={theme=>({color:theme.textColor})}>{header}</h1>
                </div>
                {children}
            </div>
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

export function AuthenicationSave({submitting,pristine,invalid,submitSucceeded,className,style=null,value,onClick=()=>{}}){
    return(
        <button css={authenticationActionButton} type="submit" disabled={submitting || pristine || invalid}
        style={style} onClick={onClick}>
            {value}
        </button>
    )
}