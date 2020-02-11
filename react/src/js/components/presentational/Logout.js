import React, {useEffect} from "react";
import {withRouter} from 'react-router-dom'
import {Helmet} from "react-helmet";
import MoonLoader from 'react-spinners/MoonLoader';
import {AuthenicationSave,AuthenticationWrapper} from "./Forms"
import axios from 'axios'


function Logout({history,location,match}){

    async function handleLogout(){
        try{
            let url = '/rest-auth/logout/';
            let response = await axios.post(
                url,
                {},
                {
                    withCredentials: true,
                    headers:{
                        'Content-Type':'application/json',
                        'X-CSRFToken':getCookie('csrftoken')
                    }
                }
            );
             
            document.location.replace('/');
            
        }catch(error){
             
            return
        }
    }

    useEffect(()=>{
        document.body.classList.add('body-auth');

        if(match.params.instant){
            handleLogout();
        }

        return()=>{
            document.body.classList.remove('body-auth');
        }
    },[])

    return(
        <>
        <Helmet>
            <title>Logout - Westeria</title>
            <meta name="description" content="Logout from Westeria" />
        </Helmet>   
        {match.params.instant?null:
            <AuthenticationWrapper header="Are you sure to log out from Westeria?">
                <div css={{display:'flex',justifyContent:'center'}}>
                    <AuthenicationSave className="login-btn" value="Logout" onClick={handleLogout}/>
                </div>
            </AuthenticationWrapper>}
        </>
        
    )
}

export default withRouter(Logout)

