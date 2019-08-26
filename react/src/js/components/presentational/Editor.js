import React, {useRef,lazy,Suspense} from 'react'


export function CustomEditor({onInput,onKeyDown,placeholder,className,style,editorRef=null,onBlur}){

    function handleInput(e){

        if (e.target.innerText) {
			e.target.dataset.divPlaceholderContent = 'true';
		}
		else {
			delete(e.target.dataset.divPlaceholderContent);
		}
        onInput(e);
    }

    return(
        <div
        contentEditable
        className={className}
        ref={editorRef}
        onInput={handleInput}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        data-placeholder={placeholder}
        style={style}/>
    )
}