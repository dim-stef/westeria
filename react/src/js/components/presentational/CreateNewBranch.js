import React from "react"
import {Link} from "react-router-dom"
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";

const newBranch = theme => css({
  border:`1px solid ${theme.borderColor}`,
  '&:hover':{
    backgroundColor:theme.hoverColor
  }
})

export function CreateNewBranch({onClick = ()=>{}}){
    const theme = useTheme();
    return(
        <Link to="/settings/branches/new" css={theme=>newBranch(theme)}
        onClick={onClick} className="create-new-branch flex-fill">
            <PlusSvg/>
            <span style={{padding:10}}>Create new branch</span>
        </Link>
    )
}


const PlusSvg = props => (
    <svg
      x="0px"
      y="0px"
      viewBox="0 0 42 42"
      style={{
        height: 15,
        width: 15,
      }}
      xmlSpace="preserve"
      fill="#8f9ca7"
      {...props}
    >
      <path d="M42 19L23 19 23 0 19 0 19 19 0 19 0 23 19 23 19 42 23 42 23 23 42 23z" />
    </svg>
);