import React, {useEffect,useState,useRef} from "react"
import {Link} from "react-router-dom";
import {useMediaQuery} from "react-responsive";
import {MoonLoader} from 'react-spinners';
import {css} from "@emotion/core"
import {useTheme} from "emotion-theming";
import {FadeImage} from "./FadeImage"
import {CircularSkeletonList} from "./SkeletonBranchList"
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
    display:'flex',
    flexFlow:'column',
    justifyContent:'flex-start',
    flex:1
})
const branchRow = isMobile => css({
    display:'inline-flex',
    justifyContent:isMobile?'center':'flex-start',
    alignItems:'center',
    flexFlow:isMobile?'row':'row wrap',
    padding:'10px 0'
})

const skeletonRow = isMobile => css({
    display:'inline-flex',
    justifyContent:'space-evenly',
    alignItems:'center',
    flex:'1 1 auto',
    width:'100%',
    margin:isMobile?0:20
})

const header = theme =>css({
    color:theme.textColor,
    margin:10
})

const topRow = () =>css({
    width:'100%',
    display:'flex',
    flexFlow:'row',
    justifyContent:'space-between',
    alignItems:'center',
    padding:20,
    boxShadow:'0 1px 1px rgba(0,0,0,0.15), 0 2px 2px rgba(0,0,0,0.15), 0 4px 4px rgba(0,0,0,0.15), 0 5px 5px rgba(0,0,0,0.15)'
})

const imageContainer = () =>css({
    display:'flex',
    flexFlow:'column',
    justifyContent:'center',
    alignItems:'center'
})

const name = theme =>css({
   color: theme.textLightColor,
   fontSize:'1.1rem',
   fontWeight:500
})

export function DiscoverBranchesPage({match,branch,endpoint="search",showTop=true}){
    return(
        <ResponsiveBranchRows uri={match.params?match.params.uri : branch.uri} showTop={showTop} endpoint={endpoint}/>
    )
}

function ResponsiveBranchRows({uri,showTop,endpoint}){
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
    },[uri])

    return(
        <div css={container} className="big-main-column" style={{padding:0}}>
            {showTop?
            <div css={topRow}>
                <FadeImage src={branch?branch.branch_image:null} className="round-picture" style={{objectFit:'cover',
                height:80,width:80}}/>
            </div>:null}
            
            <div css={rowContainer}>
                {branch?<>
                    <BranchRow type="parents" branch={branch} key="parents" endpoint={endpoint}/>
                    <BranchRow type="siblings" branch={branch} key="siblings" endpoint={endpoint}/>
                    <BranchRow type="children" branch={branch} key="children" endpoint={endpoint}/>
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
        setBranches(null);
        setNext(null);
        setHasMore(true);
        getBranches();
    },[branch])

    return [branches,next,hasMore,getBranches]
}


function BranchRow({type,branch,endpoint}){
    const ref = useRef(null);
    const [branches,next,hasMore,getBranches] = useBranches(type,branch);
    const theme = useTheme();

    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

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

    return(
        branches?branches.length>0?<><div>
            <h1 css={theme=>header(theme)}>{infoText}</h1>
                
            <InfiniteHorizontalScroll scrollTarget={ref.current?ref.current:window} value={branch}
            next={next} hasMore={hasMore} loadMore={getBranches} dataLength={branches?branches.length:0}>
            
            <div css={()=>branchRow(isMobile)}>
                {branches?branches.map(b=>{
                    return(
                        <Link to={`/${endpoint}/${b.uri}`}>
                            <div css={imageContainer} key={b.id}>
                                <FadeImage className="round-picture branch-profile-setting" style={{height:100,width:100,display:'block',
                                objectFit:'cover',margin:'10px 20px'}}
                                src={b.branch_image}/>
                                <span css={name}>{b.name}</span>
                            </div>
                        </Link>
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
            </InfiniteHorizontalScroll>
            </div>
            </>
            
            
        :null:<div css={()=>skeletonRow(isMobile)}>
            <CircularSkeletonList count={5} dimensions={isMobile?70:100}/>
        </div>
    )
}

function InfiniteHorizontalScroll({hasMore,loadMore,dataLength,children}){
    const ref = useRef(null);
    const [scroll,setScroll] = useState(0);
    const [itemCount,setItemCount] = useState(0);

    function listenHorizontal(e){
        setScroll(e.currentTarget.scrollLeft)
    }

    useEffect(()=>{

        if(scroll > ref.current.scrollWidth - ref.current.clientWidth - 250){
            if(hasMore && (dataLength != itemCount || dataLength == 0)){
                
                loadMore();
                setItemCount(dataLength);
            }
        }
    },[scroll])

    useEffect(()=>{
        if(ref.current){
            ref.current.addEventListener('scroll',listenHorizontal);

            return ()=>{
                ref.current.removeEventListener('scroll',listenHorizontal);
            }
        }
       
    },[ref])

    return (
        <div style={{overflow:'auto'}} ref={ref}>
            {children}
        </div>
        
    )
}