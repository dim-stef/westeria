import React from "react";

let frontPagePostList = {
    counter:0,
    content:'feed',
    hasMore:true,
    next:null,
    scroll:0,
    lastVisibleElement:null,
    lastVisibleIndex:0,
    loadedPosts:[],
    cachedPosts:[],
    uniqueCached:[],
    measuredPosts:[],
    openPosts:[],
    previousUri:null,
    branchUri:'',
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
export const NotificationsContext = React.createContext();
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
    owned:[],
    foreign:[]
});
export const SingularPostContext = React.createContext(
    {
        counter:0,
        content:'feed',
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        lastVisibleIndex:0,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        openPosts:[],
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
    {
        content:'branch',
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        lastVisibleIndex:0,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        measuredPosts:[],
        openPosts:[],
        previousUri:null,
        branchUri:'',
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
    }});

