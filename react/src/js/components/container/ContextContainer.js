import React from "react";

export const UserContext = React.createContext();
export const RefreshContext = React.createContext();
export const PostsContext = React.createContext(
    {
        counter:0,
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        loadedPosts:[],
        previousUri:null,
        branchUri:'',
        params:null
    });