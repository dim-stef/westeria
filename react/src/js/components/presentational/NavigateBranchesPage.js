import React, {useEffect,useState,useRef} from "react"
import {useMediaQuery} from "react-responsive";
import {MoonLoader} from 'react-spinners';
import {css} from "@emotion/core"
import {useTheme} from "emotion-theming";
import history from "../../history";
import axios from "axios";
import axiosRetry from "axios-retry"

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

    
const container = () =>css({
    height:'100%',
    display:'flex',
    flexFlow:'column'
})

const rowContainer = () =>css({
    height:'100%',
    display:'flex',
    flexFlow:'column',
    justifyContent:'space-evenly'
})
const branchRow = () => css({
    display:'inline-flex',
    justifyContent:'center',
    alignItems:'center',
})

const header = theme =>css({
    color:theme.textColor,
    margin:'20px 10px'
})

const topRow = () =>css({
    height:100,
    display:'flex',
    flexFlow:'row',
    justifyContent:'space-between',
    alignItems:'center',
    margin:20
})

export function DiscoverBranchesPage({match}){
    return(
        <ResponsiveBranchRows uri={match.params.uri}/>
    )
}

function ResponsiveBranchRows({uri}){
    const [branch,setBranch] = useState(null);
    const [siblings,setSiblings] = useState(null);
    const [index,setIndex] = useState(0);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    async function getInitBranch(){
        let response = await axios.get(`/api/v1/branches/${uri}/`);
        setBranch(response.data);
        getSiblings(response.data);
    }

    async function getSiblings(branch){
        let response = await axios.get(`/api/v1/branches/${branch.uri || branch}/siblings/`);
        setSiblings(response.data.results);
    }

    useEffect(()=>{
        getInitBranch();
    },[])

    return(
        <div css={container}>
            <div css={topRow}>
                <img src={branch?branch.branch_image:null} className="round-picture" style={{objectFit:'cover',
                height:80,width:80}}/>
            </div>
            <div css={rowContainer}>
                {isMobile && branch?<>
                    <BranchRow type="parents" branch={branch} key="parents"/>
                    <BranchRow type="siblings" branch={branch} key="siblings"/>
                    <BranchRow type="children" branch={branch} key="children"/>
                </>:null}
            </div>
        </div>
        
    )
}

function useBranches(type="children",branch){

    const [prevBranch,setPrevBranch] = useState(branch);
    const [branches,setBranches] = useState(null);
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);

    async function getBranches(){
        let response = await axios.get(next?next:`/api/branches/${branch.uri || branch}/${type}/`);

        if(!response.data.next){
            setHasMore(false);
        }
        setNext(response.data.next);
        
        // This is needed to prevent stale state
        if(branch!=prevBranch){
            setBranches(response.data.results)
        }else{
            setBranches(branches?[...branches,...response.data.results]:response.data.results)
        }

        setPrevBranch(branch);
    }

    useEffect(()=>{
        setBranches([]);
        setNext(null);
        setHasMore(true);
        getBranches();
    },[branch])

    return [branches,next,hasMore,getBranches]
}

function BranchRow({type,branch}){
    const ref = useRef(null);
    const [branches,next,hasMore,getBranches] = useBranches(type,branch);
    const theme = useTheme();

    let infoText;
    if(type=='children'){
        infoText = `More specific communities than ${branch.name}`
    }else if(type=='parents'){
        infoText = `More generic communities than ${branch.name}`
    }else{
        infoText = `Communities similar to ${branch.name}`
    }

    function handleClick(branch){
        history.push(`/search/${branch.uri}`)
    }

    useEffect(()=>{
        console.log(ref)
    },[ref])

    return(
        branches?branches.length>0?<div style={{height:'100%'}}>
            <h1 css={theme=>header(theme)}>{infoText}</h1>
            <div style={{overflow:'auto'}} ref={ref}>
                {ref.current?<InfiniteHorizontalScroll scrollTarget={ref.current?ref.current:window} value={branch}
                next={next} hasMore={hasMore} loadMore={getBranches} dataLength={branches?branches.length:0}>
                <div css={branchRow}>
                    {branches?branches.map(b=>{
                        return(
                            <div onClick={e=>handleClick(b)} key={b.id}>
                                <img className="round-picture" style={{height:100,width:100,display:'block',
                                objectFit:'cover',margin:'0 20px'}} 
                                src={b.branch_image}/>
                            </div>
                        )
                    }):null}
                    {hasMore && branches && branches.length != 0?
                        <div className="flex-fill load-spinner-wrapper" css={{justifyContent:'center',margin:'0 30px'}}>
                        <MoonLoader
                            sizeUnit={"px"}
                            size={20}
                            color={theme.textLightColor}
                            loading={true}
                        />
                    </div>:null}
                </div>
                
                </InfiniteHorizontalScroll>:null}
                
            </div>
        </div>
        :null:null
    )
}

function InfiniteHorizontalScroll({scrollTarget=window,value=null,hasMore,loadMore,dataLength,children}){

    const [prevValue,setPrevValue] = useState(value)
    const [scroll,setScroll] = useState(0);
    const [itemCount,setItemCount] = useState(0);

    function listenHorizontal(e){
        setScroll(e.currentTarget.scrollLeft)
    }

    useEffect(()=>{

        console.log(scroll,scrollTarget.scrollWidth - scrollTarget.clientWidth - 250,scrollTarget)

        if(scroll > scrollTarget.scrollWidth - scrollTarget.clientWidth - 250){
            if(hasMore && (dataLength != itemCount || dataLength == 0)){
                
                loadMore();
                setItemCount(dataLength);
            }
        }
    },[scroll])

    useEffect(()=>{
        scrollTarget.addEventListener('scroll',listenHorizontal);

        return ()=>{
            scrollTarget.removeEventListener('scroll',listenHorizontal);
        }
    },[scrollTarget])

    return (
        <>
            {children}
        </>
        
    )
}