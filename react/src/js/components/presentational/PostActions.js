function useReactActions(post){

    const context = useContext(UserContext)
    const [react,setReact] = useState(null);
    const [starCount,setStarCount] = useState(post.stars);
    const [dislikeCount,setDislikeCount] = useState(post.dislikes);
    const [isDisabled,setDisabled] = useState(false);

    useLayoutEffect(()=>{
        if(context.isAuth){
            let reactType = context.currentBranch.reacts.find(x=>x.post===post.id)
            if(reactType){
                setReact(reactType.type);
            }
        }
    },[])

    function changeReact(type){
        setDisabled(true);

        let reactUUID = context.currentBranch.reacts.find(x=>x.post===post.id).id
        let uri = `/api/reacts/${reactUUID}/`;
        let data = {
            type:type,
            branch:context.currentBranch.id,
            post:post.id
        };

        
        if(type=='star'){
            setStarCount(starCount + 1);
            setDislikeCount(dislikeCount-1);
        }else{
            setStarCount(starCount - 1);
            setDislikeCount(dislikeCount + 1);
        }
        
        setReact(type);
        axios.patch(
            uri,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                withCredentials: true
            }).then(r=>{
                // update context
                let index = context.currentBranch.reacts.findIndex(r=>r.post == post.id)
                context.currentBranch.reacts[index] = r.data;
            }).finally(r=>{
                setDisabled(false);
            })
    }

    const createOrDeleteReact = useCallback((type) => {
        setDisabled(true);
        // delete react
        if(type==react){
            react=='star'?setStarCount(starCount - 1):setDislikeCount(dislikeCount - 1);
            setReact(null)
            let reactUUID = context.currentBranch.reacts.find(x=>x.post===post.id).id
            let uri = `/api/reacts/${reactUUID}/`;
            const httpReqHeaders = {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            };

            // check the structure here: https://github.com/axios/axios#request-config
            const axiosConfigObject = {headers: httpReqHeaders};
            axios.delete(uri, axiosConfigObject).then(r=>{
                
                //remove react from context
                context.currentBranch.reacts = context.currentBranch.reacts.filter(r=>{
                    return r.id !== reactUUID;
                })
            }).catch(r=>{
                 
                //setReact(null)
            }).finally(r=>{
                setDisabled(false);
            });
        }else{
            // post react
            
            setReact(type);
            type=='star'?setStarCount(starCount+1):setDislikeCount(dislikeCount+1);
            let uri = `/api/reacts/`;
            let data = {
                type:type,
                branch:context.currentBranch.id,
                post:post.id
            };

            axios.post(
                uri,
                data,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    withCredentials: true
                }).then(r=>{
                    context.currentBranch.reacts.push(r.data);
                    //setReact(type);
                }).catch(r=>{
                    setReact(null);
                    type=='star'?setStarCount(starCount-1):setDislikeCount(dislikeCount-1);
            }).finally(r=>{
                setDisabled(false);
            })
        }
    },[react])


    return [react,starCount,dislikeCount,isDisabled];
}

function Star({post,react,changeReact,createOrDeleteReact,isDisabled}){
    const [reacted,setReacted] = useState(false);
    const [react,starCount,dislikeCount,isDisabled] = useReactActions(post)
    const context = useContext(UserContext);

    const onClick = (e) =>{
        e.stopPropagation();
        if(context.isAuth){
            handleStarClick();
        }else{
            history.push('/login');
        }
    }

    useLayoutEffect(()=>{
        if(react=='star'){
            setReacted(true);
        }else{
            setReacted(false);
        }
    },[react])

    function handleStarClick(){
        if(react && react!='star'){
            changeReact('star');
        }else{
            createOrDeleteReact('star');
        }
    }

    // hard-coded clicked class
    let className = reacted ? 'star-clicked' : '';
    let clickedColor = reacted ? '#fb4c4c' : null;
    return(
        <div className="post-action-container flex-fill star" style={{minWidth:0,width:'100%',
        justifyContent:'flex-start',WebkitJustifyContent:'flex-start'}}>
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0,paddingTop:3}}
            disabled={isDisabled} onClick={e=>onClick(e)}>
                <div className="flex-fill" style={{alignItems:'center'}}>
                    <StarSvg className={className} clickedColor={clickedColor}/>
                </div>
            </button>
        </div>
    )
}