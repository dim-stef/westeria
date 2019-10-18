import React, {useState,useEffect,useContext} from 'react'
import {PathContext} from "../container/ContextContainer"
import axios from 'axios';

export function useGetAllPaths(from,to){
    const pathContext = useContext(PathContext);
    const [branches,setBranches] = useState(null);

    async function getPaths(){
        let response;
        if(!from){
            response = await axios.get(`/api/v1/get_paths/?to=${to}`);
        }else{
            response = await axios.get(`/api/v1/get_paths/?from=${from}&to=${to}`);
        }
        //let firstPath = response.data[0]?response.data[0].paths[0]:[];
        let paths = response.data[0]?response.data[0].paths:[]

        pathContext.push({
            to:to,
            from:from,
            paths:paths
        })
        setBranches(paths);
    }

    useEffect(()=>{
        let alreadyFound = pathContext.find(path=>{
            if(path.to == to && path.from == from){
                return true;
            }
        })
        if(alreadyFound){
            setBranches(alreadyFound.paths)
        }else{
            if(to){
                getPaths();
            }else{
                setBranches([]);
            }
        }
    },[])

    return branches;
}