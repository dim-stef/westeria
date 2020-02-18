import React, {useEffect,useState,useRef,useContext} from "react"
import {Link} from "react-router-dom";
import {useMediaQuery} from "react-responsive";
import MoonLoader from 'react-spinners/MoonLoader';
import {css} from "@emotion/core"
import {useTheme} from "emotion-theming";
import {UserContext} from "../container/ContextContainer"
import {FadeImage} from "./FadeImage"
import {CircularSkeletonList} from "./SkeletonBranchList"
import {AddBranch} from "./BranchesPage"
import RoutedHeadline from "./RoutedHeadline"
import {CircularBranch,SquareBranch} from "./Branch"
import history from "../../history";
import axios from "axios";
import axiosRetry from "axios-retry"

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });


const container = (theme) =>css({
    display:'flex',
    flexFlow:'column',
    border:`1px solid ${theme.borderColor}`
})

const rowContainer = () =>css({
    display:'flex',
    flexFlow:'column',
    justifyContent:'space-around',
    flex:1
})
const branchRow = isMobile => css({
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    flexFlow:'row wrap',
    padding:'10px 0',
    a:{
        textDecoration:'none'
    }
})

const skeletonRow = isMobile => css({
    display:'inline-flex',
    justifyContent:'space-evenly',
    alignItems:'center',
    flex:'1 1 auto',
    width:'100%',
    margin:isMobile?0:20
})

const header = (theme,isMobile) =>css({
    color:theme.textHarshColor,
    margin:'5px 0',
    fontSize:isMobile?'1.7rem':'2rem',
    display:'flex',
    justifyContent:'center',
    textAlign:'center'
})

const topRow = () =>css({
    width:'100%',
    display:'flex',
    flexFlow:'row',
    justifyContent:'space-between',
    alignItems:'center',
    boxShadow:'0 1px 1px rgba(0,0,0,0.15), 0 2px 2px rgba(0,0,0,0.15), 0 4px 4px rgba(0,0,0,0.15), 0 5px 5px rgba(0,0,0,0.15)'
})

const loadMore = theme =>css({
    width:'100%',
    boxSizing:'border-box',
    padding:15,
    border:0,
    borderRadius:50,
    backgroundColor:theme.backgroundDarkColor,
    color:theme.textColor,
    fontWeight:'bold'
})

const imageContainer = () =>css({
    display:'flex',
    flexFlow:'column',
    justifyContent:'center',
    alignItems:'center'
})

const name = theme =>css({
    color: theme.textLightColor,
    fontSize:'1.5rem',
    fontWeight:500
})

export function DiscoverBranchesPage({match,branch,endpoint="search",showTop=true,withHeadline=false}){
    return(
        <ResponsiveBranchRows uri={match.params?match.params.uri : branch.uri} showTop={showTop} endpoint={endpoint}
            withHeadline={withHeadline}
        />
    )
}

function ResponsiveBranchRows({uri,showTop,endpoint,withHeadline}){
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
        <div css={theme=>container(theme)} className="big-main-column" style={{padding:0,height:'100%'}}>
            {showTop?
            <div css={topRow}>
                <FadeImage src={branch?branch.branch_image:null} className="round-picture" style={{objectFit:'cover',
                height:80,width:80}}/>
            </div>:null}
            {withHeadline?<RoutedHeadline to={`/${branch?branch.uri:null}`}/>:null}
            
            <div css={rowContainer}>
                {branch?<>
                    <BranchRow type="parents" branch={branch} key="parents" endpoint={endpoint}/>
                    <BranchRow type="children" branch={branch} key="children" endpoint={endpoint}/>
                    <BranchRow type="siblings" branch={branch} key="siblings" endpoint={endpoint}/>
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
    const [loading,setLoading] = useState(false);

    async function getBranches(){
        setLoading(true);
        let response = await axios.get(next?next:`/api/branches/${branch.uri || branch}/${type}/`);
        setLoading(false);

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

    return [branches,next,hasMore,getBranches,loading]
}


function BranchRow({type,branch,endpoint}){
    const ref = useRef(null);
    const userContext = useContext(UserContext);
    const [branches,next,hasMore,getBranches,loading] = useBranches(type,branch);
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
        infoText = `Communities probably related to ${branch.name}`
    }

    function handleClick(branch){
        history.push(`/search/${branch.uri}`)
    }

    return(
        branches?
        <div css={theme=>({backgroundColor:theme.backgroundLightColor,margin:5,boxSizing:'border-box',
        borderRadius:25,padding:'5px 0',display:'flex',alignItems:'flex-start',flexFlow:'column'})}>
            <div css={{width:'100%'}}>
                <h1 css={theme=>header(theme,isMobile)}>{infoText}</h1>
                    
                {branches.length > 0?    
                <div css={()=>branchRow(isMobile)}>
                    {type=='siblings' || !userContext.isAuth || branch.uri==userContext.currentBranch.uri?null:
                    <AddBranch branch={branch} branches={branches} type={type}/>}
                    {branches?branches.map(b=>{
                        return(
                            <CircularBranch branch={b} endpoint={endpoint}/>
                        )
                    }):null}
                </div>
                :
                <div css={{display:'flex',flexFlow:'column'}}>
                    <p css={theme=>({color:theme.textColor,fontWeight:'bold',
                    fontSize:'1.4rem',textAlign:'center'})}>
                    {type=='siblings'?
                    'No related communites were found :(':
                    'No one is here yet. Expand your community by connecting with other communities'}</p>
                    {type=='siblings' || !userContext.isAuth || branch.uri==userContext.currentBranch.uri?null:
                    <AddBranch branch={branch} branches={branches} type={type}/>}
                </div>}
            </div>
            {hasMore?
                <div css={{display:'flex',width:'100%',justifyContent:'center',alignItems:'center'}}>
                    {loading?
                        <div className="flex-fill load-spinner-wrapper" css={{justifyContent:'center',margin:'0 30px'}}>
                        <MoonLoader
                            sizeUnit={"px"}
                            size={20}
                            color={theme.textLightColor}
                            loading={true}
                        />
                    </div>:<button css={loadMore} onClick={getBranches}>Load more</button>}
                </div>
            :null}
        </div>

        :<div css={()=>skeletonRow(isMobile)}>
            <CircularSkeletonList count={isMobile?3:5} dimensions={isMobile?70:100}/>
        </div>
    )
}


function BranchRow2({type,branch,endpoint,vertical}){
    const ref = useRef(null);
    const userContext = useContext(UserContext);
    const [branches,next,hasMore,getBranches,loading] = useBranches(type,branch);
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
        infoText = `Communities probably related to ${branch.name}`
    }

    return(
        branches && branches.length > 0?
        <InfiniteScroll hasMore={hasMore} loadMore={getBranches} dataLength={branches.length} vertical={vertical}
        >
            <div>
            <h1 css={theme=>header(theme,isMobile)}>{infoText}</h1>
            <div css={vertical?branchColumn:branchRow}>
                {branches.map(b=>{
                    return(
                        <React.Fragment key={b.uri}><CircularBranch branch={b} endpoint={endpoint}/></React.Fragment>
                    )
                })}
            </div>
            </div>
        </InfiniteScroll>:null
    )
}

function InfiniteScroll({hasMore,loadMore,dataLength,vertical=true,bss=null,children}){
    const ref = useRef(null);
    const [scroll,setScroll] = useState(0);
    const [itemCount,setItemCount] = useState(0);

    function listenHorizontal(e){
        if(vertical){
            setScroll(e.currentTarget.scrollTop)
        }else{
            setScroll(e.currentTarget.scrollLeft)
        }
    }

    useEffect(()=>{

        let trigger = vertical?
        ref.current.scrollTop - ref.current.clientHeight - 250:
        ref.current.scrollWidth - ref.current.clientWidth - 250

        if(scroll > trigger){
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
        <div style={{overflow:'auto'}} css={bss} ref={ref}>
            {children}
        </div>
        
    )
}