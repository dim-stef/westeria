import React from "react";

export const BranchPicture = ({uri,picture,dimensions,type="img",onClick=null}) =>{
    if(type==="img"){
        return (
            <div style={{backgroundImage:`url(${picture})`,
            backgroundRepeat:'no-repeat',
            backgroundSize:'cover',
            backgroundPosition:'center',
            width:dimensions.width,
            height:dimensions.height,
            borderRadius: '50%'}}
            >
            </div>
        )
    }

    if(type==="button"){
        return (
            <button onClick={(e) => onClick(e,uri)} style={{backgroundImage:`url(${picture})`,
            backgroundRepeat:'no-repeat',
            backgroundSize:'cover',
            backgroundPosition:'center',
            width:dimensions.width,
            height:dimensions.height,
            borderRadius: '50%',
            border:0}}>
            </button>
        )
    }
}