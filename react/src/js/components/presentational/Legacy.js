export function Post2({post,updateHiddenMode=null,showPostedTo,handleClick,clearEmphasized,emphasized=false,minimized=false,hidden=false}){
    const context = useContext(UserContext);
    const ref = useRef(null);
    const [cls,setClassName] = useState('');
    const [emph,setEmph] = useState(emphasized)
    const [mainPostedBranch,setMainPostedBranch] = useState(getPostedBranch(post,context))
    const [isVisible,setVisible] = useState(true);
    const [isFocused,setFocused] = useState(emphasized);

    useEffect(()=>{
        
        
        if(emphasized || minimized){
            setClassName('main-post');
        }else if(hidden && isVisible){ // if hidden but is visible on screen lower opacity
            setClassName('secondary-post');
        }
    })

    function isScrolledIntoView(el) {
        var rect = el.getBoundingClientRect();
        var elemTop = rect.top;
        var elemBottom = rect.bottom;
    
        // Only completely visible elements return true:
        //var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
        var isVisible = elemTop + 300 < window.innerHeight && elemBottom - 400 >= 0
        return isVisible;
    }

    function isVisibleOnScreen(el) {
        var rect = el.getBoundingClientRect();
        var elemTop = rect.top;
        var elemBottom = rect.bottom;
    
        var isVisible = elemTop < window.innerHeight && elemBottom >= 0
        // Partially visible elements return true:
        setVisible(isVisible);
    }

    useEffect(()=>{
        
        let currentElementListener = function() { // change "hidden mode" in case the emphasized element is scrolled past or over
            if(isScrolledIntoView(ref.current)){
                updateHiddenMode(true);
            }
            else{
                updateHiddenMode(false);
            }
        }

        if(emphasized){
            window.addEventListener("scroll", currentElementListener);
            document.addEventListener('click',outSideClick,false);
        }
        
        return(()=>{
            window.removeEventListener("scroll",currentElementListener)
            document.removeEventListener('click',outSideClick,false);
        })
    },[emphasized])

    useEffect(()=>{
        // opacity is really expensive so it must be set only on the posts
        // which are currently visible on screen. Expect heavy lag otherwise
        let hiddenElementListener = function(){
            isVisibleOnScreen(ref.current)
            
        }

        function windowScroller(){

        }

        if(!emphasized){
            document.addEventListener('scroll',hiddenElementListener);
            console.log("i")
        }

        return ()=>{
            document.removeEventListener('scroll',hiddenElementListener);
            console.log("o")
        }
    },[emphasized])

    function outSideClick(e){
        const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length )

        if(!ref.current.contains(e.target) && isVisible(ref.current)){
            clearEmphasized(e);
        }
    }

    function closePost(e){
        clearEmphasized(e);  // e required to stop propagation
    }

    function openPost(){
        handleClick(post)
    }

    var date = new Date(post.created);
    return(
        <li ref={ref} >
            <div>
                <SmallPostv2 post={post} mainPostedBranch={mainPostedBranch} date={date} cls={cls}
                emphasized={emphasized} showPostedTo openPost={openPost} closePost={closePost}/>
            </div>
        </li>
    )
}

export function DisplayPosts(props){
    const [posts,setPosts] = useState([]);
    const [postedId,setPostedId] = useState(props.postedId);
    const [showPostedTo,setShowPostedTo] = useState(props.showPostedTo);
    const [emphasizedPosts,setEmphasizedPosts] = useState([]);
    const [emphasizedPost,setEmphasizedPost] = useState(null);
    const [hiddenMode,setHiddenMode] = useState(false);
    const context = useContext(RefreshContext);

    useEffect(()=>{
        console.log(props)
        const fetchData = async () =>{
            setPosts([])
            const response = await axios(props.uri);
            setPosts(response.data.results);
        };

        fetchData();
        context.setRefresh(() => fetchData);
    },[props.uri])

    function handleClick(post){
        setEmphasizedPost(post.id);
        setPostedId(post.poster_id)
        //updateHiddenMode(true);
    }

    function updateHiddenMode(mode){
        setHiddenMode(mode);
    }

    function removeFromEmphasized(id){
        let newEmphasizedPosts = emphasizedPosts.splice(emphasizedPosts.indexOf(id), 1 );
        setEmphasizedPosts(newEmphasizedPosts);
    }

    function clearEmphasized(e){
        e.stopPropagation();
        setEmphasizedPost(null);
    }

    function updateFeed(newPosts){
        setPosts(newPosts.concat(posts))
    }


    return(
        <ul style={{padding:0,margin:'0 10px',listStyle:'none',flexBasis:'60%'}}>
            <StatusUpdate updateFeed={updateFeed} postedId={postedId} key={props.postedId}/>
            {posts?(
                    //filter posts
                    posts.filter(p=>
                    {
                        if(p.type==="reply"){ //dont return replies
                            return false
                        }
                        return true
                    }).map(post => {
                            let props = {
                            post:post,
                            key:post.id,
                            updateHiddenMode:updateHiddenMode,
                            removeFromEmphasized:removeFromEmphasized,
                            clearEmphasized:clearEmphasized,
                            handleClick:handleClick,
                            showPostedTo:showPostedTo?true:false};

                            if(!emphasizedPost){ //emphasizedPosts.length==0
                                return <Post {...props} minimized/>
                            }
                            else{
                                if(emphasizedPost==post.id){ //emphasizedPosts.includes(post.id)
                                    return <Post {...props} emphasized/>
                                }else{
                                    if(hiddenMode){
                                        return <Post {...props} hidden/>
                                    }
                                    else{
                                        return <Post {...props} minimized/>
                                    }
                                }
                            }
                        }   
                    )
                ):
                <p>loading</p>
            }
        </ul>
    )
}