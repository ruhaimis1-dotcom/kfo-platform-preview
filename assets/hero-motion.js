(() => {
 const scene=document.getElementById('kfo-hybrid');
 if(!scene)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
 const reset=()=>{scene.style.setProperty('--hx',0);scene.style.setProperty('--hy',0)};
 scene.addEventListener('pointermove',e=>{if(reduce.matches||!fine.matches||e.pointerType!=='mouse')return;const r=scene.getBoundingClientRect();scene.style.setProperty('--hx',(e.clientX-r.left)/r.width*2-1);scene.style.setProperty('--hy',(e.clientY-r.top)/r.height*2-1)});
 scene.addEventListener('pointerleave',reset);reduce.addEventListener('change',reset);fine.addEventListener('change',reset);
})();
