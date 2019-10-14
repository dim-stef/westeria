import React, {useState,useEffect} from 'react'
import axios from 'axios';

export function useGetAllPaths(from,to){
    const [branches,setBranches] = useState(null);

    async function getPaths(){
        const response = await axios.get(`/api/v1/get_paths/?from=${from}&to=${to}`);
        let firstPath = response.data[0]?response.data[0].paths[0]:[];
        setBranches(firstPath);
    }

    useEffect(()=>{
        if(from && to){
            getPaths();
        }else{
            setBranches([]);
        }
    },[])

    return branches;
}