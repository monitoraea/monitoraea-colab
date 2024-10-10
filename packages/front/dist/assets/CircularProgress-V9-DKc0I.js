import{W as N,X as U,aK as D,J as g,an as c,V as o,aL as M,r as w,Y as z,Q as E,j as v,a0 as I,a3 as K}from"./index-B3sBGDZf.js";function W(r){return N("MuiCircularProgress",r)}U("MuiCircularProgress",["root","determinate","indeterminate","colorPrimary","colorSecondary","svg","circle","circleDeterminate","circleIndeterminate","circleDisableShrink"]);const F=["className","color","disableShrink","size","style","thickness","value","variant"];let l=r=>r,P,S,b,$;const a=44,L=D(P||(P=l`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`)),V=D(S||(S=l`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -125px;
  }
`)),B=r=>{const{classes:e,variant:s,color:t,disableShrink:d}=r,u={root:["root",s,`color${c(t)}`],svg:["svg"],circle:["circle",`circle${c(s)}`,d&&"circleDisableShrink"]};return K(u,W,e)},G=g("span",{name:"MuiCircularProgress",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:s}=r;return[e.root,e[s.variant],e[`color${c(s.color)}`]]}})(({ownerState:r,theme:e})=>o({display:"inline-block"},r.variant==="determinate"&&{transition:e.transitions.create("transform")},r.color!=="inherit"&&{color:(e.vars||e).palette[r.color].main}),({ownerState:r})=>r.variant==="indeterminate"&&M(b||(b=l`
      animation: ${0} 1.4s linear infinite;
    `),L)),J=g("svg",{name:"MuiCircularProgress",slot:"Svg",overridesResolver:(r,e)=>e.svg})({display:"block"}),Q=g("circle",{name:"MuiCircularProgress",slot:"Circle",overridesResolver:(r,e)=>{const{ownerState:s}=r;return[e.circle,e[`circle${c(s.variant)}`],s.disableShrink&&e.circleDisableShrink]}})(({ownerState:r,theme:e})=>o({stroke:"currentColor"},r.variant==="determinate"&&{transition:e.transitions.create("stroke-dashoffset")},r.variant==="indeterminate"&&{strokeDasharray:"80px, 200px",strokeDashoffset:0}),({ownerState:r})=>r.variant==="indeterminate"&&!r.disableShrink&&M($||($=l`
      animation: ${0} 1.4s ease-in-out infinite;
    `),V)),Y=w.forwardRef(function(e,s){const t=z({props:e,name:"MuiCircularProgress"}),{className:d,color:u="primary",disableShrink:R=!1,size:m=40,style:_,thickness:i=3.6,value:p=0,variant:k="indeterminate"}=t,j=E(t,F),n=o({},t,{color:u,disableShrink:R,size:m,thickness:i,value:p,variant:k}),f=B(n),h={},x={},y={};if(k==="determinate"){const C=2*Math.PI*((a-i)/2);h.strokeDasharray=C.toFixed(3),y["aria-valuenow"]=Math.round(p),h.strokeDashoffset=`${((100-p)/100*C).toFixed(3)}px`,x.transform="rotate(-90deg)"}return v.jsx(G,o({className:I(f.root,d),style:o({width:m,height:m},x,_),ownerState:n,ref:s,role:"progressbar"},y,j,{children:v.jsx(J,{className:f.svg,ownerState:n,viewBox:`${a/2} ${a/2} ${a} ${a}`,children:v.jsx(Q,{className:f.circle,style:h,ownerState:n,cx:a,cy:a,r:(a-i)/2,fill:"none",strokeWidth:i})})}))});export{Y as C};
