import React, { useEffect } from "react";
import { Link,withRouter,Redirect } from 'react-router-dom'
import {Helmet} from "react-helmet";
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'


function Logout({history,location,match}){

    async function handleLogout(){
        try{
            let url = '/rest-auth/logout/';
            let response = await axios.post(
                url,
                {},
                {
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
            <title>Logout - Subranch</title>
            <meta name="description" content="Logout from Subranch" />
        </Helmet>   
        {match.params.instant?null:<div className="main-layout">
            <div className="form-layout" style={{margin: '6em auto', backgroundColor: '#ffffff', textAlign: 'center'}}>
            <div className="form-container" style={{width: '70%', margin: 'auto', paddingBottom: '14px'}}>
                <button className="login-btn" onClick={handleLogout}>Logout</button>
            </div>
            </div>
        </div>}
        </>
        
    )
}

export default withRouter(Logout)

