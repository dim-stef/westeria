import React, {useContext, useEffect, useState} from "react"
import {UserContext} from './ContextContainer';
import axios from 'axios';


export function useMutualFollows(){
    const userContext = useContext(UserContext);
    const [branches,setBranches] = useState([]);

    async function getMutualFollows(){
        let response = await axios.get(`/api/v1/branches/${userContext.currentBranch.uri}/mutual_follows/`);
        setBranches(response.data);
    }

    useEffect(()=>{
        getMutualFollows();
    },[userContext.currentBranch.uri])

    return branches;
}
