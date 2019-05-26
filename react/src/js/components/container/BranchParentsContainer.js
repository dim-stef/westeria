import React, { Component, useState, useContext, useEffect,useMemo } from "react"
import axios from 'axios'

function BranchPageContainer(props){
    const [branches,setBranches] = useState(null);
    let branchUri = props.match.params.uri ? props.match.params.uri : 'global';

    async function getBranches(branchUri){
        let uri;

        uri = `/api/branches/${branchUri}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        uri = `/api/branches/${branchUri}/children/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let children = data.results.map(c => c)
        let branches = {
            parent:parentData,
            children:children
        }
        setBranches(branches);
    }

    useEffect(() => {
        
        getBranches(branchUri);

    },[branchUri])

    if(branches){
        return <BranchPage branches={branches} match={props.match.params.uri ? props.match.params.uri : 'global'}/>
    }else{
        return null
    }
}