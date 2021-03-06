import React from "react";

let frontPagePostList = {
    content:'feed',
    isProfile:false,
    hasMore:true,
    next:null,
    scroll:0,
    lastVisibleElement:null,
    lastVisibleIndex:0,
    lastScrollPosition:0,
    lastPage:0,
    loadedPosts:[],
    cachedPosts:[],
    uniqueCached:[],
    measuredPosts:[],
    openPosts:[],
    paths:[],
    previousUri:null,
    branchUri:'',
    useDefaultRoute:true,
    params:{
        content: {
            value:'leaves',
            label:'Leaves'
        },
        ordering:{
            value:'-hot_score',
            label:'Hot'
        },
        past:{
            value:'all',
            label:'All time'
        }
    }
}

export const UserContext = React.createContext();
export const NotificationsContext = React.createContext({
    notifications:[],
    messages:[]
});
export const NotificationsProvider= NotificationsContext.Provider
export const NotificationsConsumer= NotificationsContext.Consumer

export const UserActionsContext = React.createContext({
    lastFrontPageTab:'feed',
    lastPostListType:'front'
});
export const RefreshContext = React.createContext({
    refresh:()=>{return},
    setRefresh:()=>{return},
    feedRefresh:()=>{return},
    setFeedRefresh:()=>{return},
    branchPostsRefresh:()=>{return},
    setBranchPostsRefresh:()=>{return},
});

export const CachedBranchesContext = React.createContext({
    following:[],
    mutualFollows:[],
    owned:[],
    trending:[],
    foreign:[],
    topLevel:[]
});
export const SingularPostContext = React.createContext(
    {
        counter:0,
        content:'feed',
        isProfile:false,
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        lastVisibleIndex:0,
        lastScrollPosition:0,
        lastPage:0,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        openPosts:[],
        paths:[],
        previousUri:null,
        branchUri:'',
    }
)
export const PostsContext = React.createContext(
    Object.create(frontPagePostList)
);

export const AllPostsContext = React.createContext(
    Object.create({...frontPagePostList,content:'all'})
);

export const TreePostsContext = React.createContext(
    Object.create({...frontPagePostList,content:'tree'})
);

export const BranchPostsContext = React.createContext(
    Object.create({...frontPagePostList,content:'branch',
    isProfile:true})
);

export const BranchCommunityPostsContext = React.createContext(
    Object.create({...frontPagePostList,content:'branch_community',
    isProfile:true})
);

export const BranchTreePostsContext = React.createContext(
    Object.create({...frontPagePostList,content:'branch_tree',
    isProfile:true})
);

export const ChatRoomsContext = React.createContext({
    rooms:[]
})

export const TourContext = React.createContext({
    seenFrontPageTip:false,
    seenBranchPostListTip:false,
    seenBranchTabs:false,
})

export const RouteTransitionContext = React.createContext({
    exiting:false,
    entered:false
})

export const PathContext = React.createContext([])
export const SwipeablePostGridContext = React.createContext({})
export const ParentBranchDrawerContext = React.createContext({})
export const AppContext = React.createContext({})
export const LandingPageContext = React.createContext({
    setOpen:()=>{}
})