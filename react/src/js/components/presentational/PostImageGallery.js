import React, {useState,useEffect,useRef,useLayoutEffect,useContext} from "react"
import { useSwipeable, Swipeable } from 'react-swipeable'
import {ToggleContent} from './Temporary'
import LazyLoad from 'react-lazy-load';
import ReactPlayer from 'react-player'
import ReactDOM from 'react-dom';

const Modal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);


Number.prototype.roundTo = function(num) {
    var resto = this%num;
    if (resto <= (num/2)) { 
        return this+resto;
    } else {
        return this+num-resto;
    }
}

export function Images(props){
    const [paddTop,setPaddTop] = useState('56%');
    const [left,setLeft] = useState(0);
    const [lastLeft,setLastLeft] = useState(0);
    const [swiping,setSwiping] = useState(false);
    const [index,setIndex] = useState(0);
    const ref = useRef(null);

    let angle = -1;

    function calculateIndex(transformX,dir){
        let indx = index;
        console.log("incalc")
        if (Math.abs(transformX) > props.imageWidth/20) {
            if(dir=="Left"){
                indx++;
            } else if(dir=="Right"){
                indx--;
            }
        }

        if(indx<0){
            indx=0;
        }else if(indx>props.images.length + props.videos.length - 1){
            indx = props.images.length + props.videos.length - 1;
        }

        console.log("index,",indx)
        setIndex(indx);
        return indx;

    }

    function changeIndex(newIndex){
        setLastLeft(-newIndex*props.imageWidth)
        setIndex(newIndex);
        angle = -1;
        ref.current.style.transform = `translateX(${-newIndex*props.imageWidth}px)`;
    }

    const handlers = useSwipeable({

        onSwiped: (e) => {
            setLastLeft(-calculateIndex(e.absX,e.dir)*props.imageWidth)
            angle = -1;
            ref.current.style.transform = `translateX(${-calculateIndex(e.absX,e.dir)*props.imageWidth}px)`;
        },
        onSwiping: (e) => {
            let rads = Math.atan(e.absY/e.absX);
            console.log("angle",angle, e.absY/e.absX)
            if(e.absY>10){
                console.log("in")
                if(angle==-1){
                    console.log("inner")
                    angle = rads;
                }
            }else if(e.absX > 2){
                angle = rads;
            }

            if(angle!=-1 && angle<0.78){
                let newTransform = getBoundTransformX(lastLeft - e.deltaX);
                ref.current.style.transform = `translateX(${newTransform}px)`;   
            }
        },
        preventDefaultTouchmoveEvent: false,
        delta:10,
        trackTouch: true,
        trackMouse:false
    });

    function getBoundTransformX(position){
        console.log("math",position,props.images.length,props.imageWidth,Math.abs(position)>(props.images.length - 1)*props.imageWidth)
        if(position>0){
            return 0;
        }else if(Math.abs(position)>(props.images.length + props.videos.length - 1 )*props.imageWidth){
            return -1*(props.images.length + props.videos.length - 1 )*props.imageWidth
        }else{
            return position;
        }
    }

    let maxHeight=620;
    function getMeta(url){   
        var img = new Image();
        img.addEventListener("load", function(){
            console.log(this.naturalHeight)
            let height = this.naturalHeight;
            let width = this.naturalWidth;
            let ratio = height/width;
            let paddingTop = height!=0 ?
            `${ratio*100}%` : 0;
            setPaddTop(paddingTop);
        });
        img.src = url;
    }

    function calcPadding(image){
        let height = image.height;
        let width = image.width;
        let ratio = height/width;
        let paddingTop = height!=0 ?
        `${ratio*100}%` : 0;
        setPaddTop(paddingTop);
    }

    useEffect(()=>{
        if(props.images.length>0){
            //getMeta(props.images[0].image);
            calcPadding(props.images[0])
        }
    },[])

    return(
        <div onClick={()=>{console.log("clicked")}} style={{margin:'0 -10px',overflow: 'hidden',maxHeight:maxHeight}}>
            <div {...handlers} style={{position:'relative',paddingTop:paddTop}} >
                <div className="flex-fill post-image-wrapper" style={{maxHeight:maxHeight}}>
                    {props.images.length>1?
                    <MediaButtons index={index} changeIndex={changeIndex} count={props.images.length + props.videos.length} 
                    imageWidth={props.imageWidth} left={left} setLeft={setLeft}/>:null}
                    <div ref={ref} className="flex-fill post-image-gallery" style={{
                    transitionProperty:'transform'}}>
                        {props.images.map(img=>{
                            return <div key={img.image}><ImageComponent width={props.imageWidth} key={img} src={img.image} height={img.height}
                                maxHeight={maxHeight} isSwiping={swiping} setLeft={setLeft}
                            /></div>
                        })}
                        {props.videos.map(vid=>{
                            return <div key={vid.id}><VideoComponent width={props.imageWidth} key={vid.id} src={vid.video}
                                thumbnail={vid.thumbnail} maxHeight={maxHeight}
                            /></div>
                        })}
                    </div>
                </div>  
            </div>
        </div>
    )
}

import SwipeableViews from 'react-swipeable-views';

export function Images2(props){

    function getTallerElement(){
        let heights = props.images.map(im=>{
            return im.height;
        })

        let max = Math.max(...heights);
        return props.images.find(im=>im.height==max);
    }

    function calcPadding(){
        let image = getTallerElement();
        let height = image.height;
        let width = image.width;
        let ratio = height/width;
        let paddingTop = height!=0 ?
        `${ratio*100}%` : 0;
        /*if(props.viewAs=="reply"){
            if(width > ref.current.clientWidth * 75/100){
                style = {...style,width:'75%'};
            }else{
                style = {...style,width:width}
            }
            style = {...style,width:width}
        }*/
        if(props.videos.length>0 && ratio<0.56){
            paddingTop = '56%';
        }
        return paddingTop;
    }

    let initStyle;
    if(props.viewAs=="reply"){
        initStyle = {
            border: '1px solid #e2eaf1',
            borderRadius: 10,
        }
    }else{
        initStyle = {
            margin: '0 -10px'
        }
    }


    const [paddTop,setPaddTop] = useState(props.images.length>0?calcPadding(props.images[0]):'56%');
    const [left,setLeft] = useState(0);
    const [swiping,setSwiping] = useState(false);
    const [style,setStyle] = useState(initStyle);
    const [index,setIndex] = useState(0);
    const ref = useRef(null);

    let isTouchScreen = "ontouchstart" in document.documentElement;
    

    function changeIndex(newIndex){
        setIndex(newIndex);
    }

    function incrementIndex(){
        setIndex(index + 1);
    }

    function decrementIndex(){
        setIndex(index - 1);
    }
    
    let maxHeight=620;

    useEffect(()=>{
        console.log("styleee",style,props.viewAs)
        let newStyle = {};
        if(props.viewAs=="reply"){
            /*if(props.images[0].width > ref.current.clientWidth * 75/100){
                newStyle = {...newStyle,width:'75%'};
            }else{
                newStyle = {...newStyle,width:props.images[0].width}
            }*/
        }
        setStyle(Object.assign(style, newStyle))
    },[])

    function handleChangeIndex(index){
        setIndex(index)
    }

    return(
        <div ref={ref} style={{...style,overflow: 'hidden',maxHeight:maxHeight}}>
            <div style={{position:'relative',paddingTop:paddTop}} >
                <div className="flex-fill post-image-wrapper" style={{maxHeight:maxHeight}}>
                    {props.images.length>1?
                    <MediaButtons index={index} changeIndex={changeIndex} count={props.images.length + props.videos.length} 
                    imageWidth={props.imageWidth} left={left}
                    setLeft={setLeft} incrementIndex={incrementIndex} decrementIndex={decrementIndex}/>:null}

                    <SwipeableViews index={isTouchScreen?0:index} onChangeIndex={handleChangeIndex} disableLazyLoading
                    slideStyle={{position:'relative',overflow:'hidden'}}>
                        {props.images.map(img=>{
                            return <div key={img.image} onTouchStart={event => event.preventDefault()}><ImageComponent width={props.imageWidth} key={img} src={img.image} height={img.height}
                                maxHeight={maxHeight} isSwiping={swiping} setLeft={setLeft}
                            /></div>
                        })}
                        {props.videos.map(vid=>{
                            return <div key={vid.id} onTouchStart={event => event.preventDefault()}><VideoComponent width={props.imageWidth} key={vid.id} src={vid.video}
                                thumbnail={vid.thumbnail} maxHeight={maxHeight}
                            /></div>
                        })}

                        </SwipeableViews>
                </div>  
            </div>
        </div>
    )
}

//disablepictureinpicture controlslist="nodownload"
function VideoComponent({src,thumbnail,width}){
    let height = width / (16/9);

    return(
        <div onClick={e=>{e.stopPropagation()}}>
            <ReactPlayer pip={false} 
             width={width} height={height} url={src} volume={0} muted controls playing light={thumbnail}
             config={{ file: { attributes: { controlsList: 'nodownload',disablepictureinpicture: 'true' } } }}>
            </ReactPlayer>
        </div>
    )
}


function getScrollbarWidth() {

    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);
  
    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);
  
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
  
    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
  
    return scrollbarWidth;
  
  }

function ImageComponent({src,maxHeight,width,height}){

    function handleModalOpen(e,show){
        e.stopPropagation();
        show();
        document.body.style.overflowY = 'hidden';
        document.body.style.paddingRight = `${getScrollbarWidth()}px`
    }

    function handleModalClose(e,hide){
        e.stopPropagation();
        hide();
        document.body.style.overflowY = 'scroll';
        document.body.style.paddingRight = 0;
    }

    return(
        <div>
        <ToggleContent 
            toggle={show=>(
                <div style={{width:width}}>
                    <LazyLoad
                        debounce={false}
                        offsetVertical={500}
                        >
                        <img onClick={e=>{
                            e.preventDefault();
                            handleModalOpen(e,show)}} style={{width:'100%',
                        objectFit:'cover',maxHeight:maxHeight,backgroundColor:'black',position:'absolute',
                        top:'50%',right:'50%',transform:'translate(50%,-50%)'}} src={src}/>
                    </LazyLoad>
                    
                </div>
            )}
            content={hide => (
            <Modal onClick={e=>handleModalClose(e,hide)}>
                    <div style={{height:'100%',display:'flex',overflowY:'scroll'}}>
                        <div style={{maxWidth:'70%',margin:'auto'}}>
                            <img style={{width:'100%',backgroundColor:'#2d2d2d'}} onClick={(e)=>e.stopPropagation()} src={src}/>
                        </div>
                    </div>
            </Modal>    
        )}/>
        </div>
    )
}


function MediaButtons({index,changeIndex,count,imageWidth,setIndex,incrementIndex,decrementIndex}){
    //const [index,setIndex] = useState(0);

    function handleLeftClick(e){
        e.stopPropagation();
        console.log("index,",index)
        decrementIndex();
        if(index!=0){
            
            //changeIndex(index - 1)
            //setIndex(index - 1);
            //setLeft(left + imageWidth);
        }
        
    }

    function handleRightClick(e){
        e.stopPropagation();
        incrementIndex();
        if(index!=count - 1){
            
            //changeIndex(index + 1)
            //setIndex(index + 1);
            //setLeft(left - imageWidth);
        }
    }
    console.log(index,count)

    return(
        <>

            {index!=0?
            <div role="button" className="image-arrow-button" style={{left:0}} onClick={handleLeftClick}>
                <div style={{transform:"rotate(180deg)"}}><ImageArrow/></div>
            </div>:null}
            {index!=count-1?
            <div role="button" className="image-arrow-button" style={{right:0}} onClick={handleRightClick}>
                <div><ImageArrow/></div>
            </div>:null}
            
        </>
    )
}

function ImageArrow(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="451.846px"
            height="451.847px"
            viewBox="0 0 451.846 451.847"
            style={{
                enableBackground: "new 0 0 451.846 451.847",
                height: 15,
                fill: "white",
                width: 15,
            }}
            xmlSpace="preserve"
            >
            <path d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z" />
        </svg>
    )
}

function ImageArrow(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="451.846px"
            height="451.847px"
            viewBox="0 0 451.846 451.847"
            style={{
                enableBackground: "new 0 0 451.846 451.847",
                height: 15,
                fill: "white",
                width: 15,
            }}
            xmlSpace="preserve"
            >
            <path d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z" />
        </svg>
    )
}