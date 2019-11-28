import React, {useRef,useState} from "react"
import { css } from "@emotion/core";
import Skeleton, {SkeletonTheme} from 'react-loading-skeleton';
import { useTheme } from 'emotion-theming'


const gridContainer = () =>css({
    height:'100%',
    display:'grid',
    gridTemplateColumns:`repeat(12, minmax(4vmin, 1fr))`,
    gridTemplateRows:`repeat(auto-fit, minmax(4vmin, 1fr))`,
    gridAutoRows:'1fr',
    gridAutoColumns:'1fr',
    gridGap:10,
    gridAutoFlow:'dense',
})


const cell = (size) =>css({
    gridColumn:`span ${size[0]}`,
    gridRow:`span ${size[1]}`,
})

export function SkeletonGrid({sizes,pageType,count}){

    const bigItemTotal = useRef(pageType.bigItemCount);
    const mediumItemTotal = useRef(pageType.mediumItemCount);
    const responsiveItemTotal = useRef(pageType.responsiveItemCount);
    const smallItemTotal = useRef(pageType.smallItemCount);

    function getItems(){
        let itemsWithSize = []
        for(let i=0;i<count;i++){
            if(bigItemTotal.current!=0){
                itemsWithSize.push({
                    size:sizes.big,
                })
                bigItemTotal.current -=1;
            }else if(mediumItemTotal.current!=0){
                itemsWithSize.push({
                    size:sizes.medium,
                })
                mediumItemTotal.current -=1;
            }else if(responsiveItemTotal.current!=0){
                itemsWithSize.push({
                    size:sizes.responsive,
                })
                responsiveItemTotal.current -=1;
            }else{
                itemsWithSize.push({
                    size:sizes.small,
                })
                smallItemTotal.current -=1;
            }
        }
        return shuffle(itemsWithSize);
    }
    

    const [items,setItems] = useState(getItems())
    return(
        <div className="noselect" css={gridContainer}>
            {items.map(o=>{
                return <div css={()=>cell(o.size.defaultDimensions)}>
                </div>
            })}
        </div>
    )
}