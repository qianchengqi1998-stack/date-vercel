"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Invite = { to:string; note:string };
type Plan = { date:string; time:string; place:string };
type Reply = { to:string; picked:string[]; plan:Plan };
type Activity = { name:string; icon:string; detail:string; subactivities?:Activity[] };
type ActivityCategory = { id:string; name:string; icon:string; detail:string; activities:Activity[] };
type InstallPrompt = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> };

const activityCategories:ActivityCategory[] = [
  {id:"easy",name:"轻松见面",icon:"☕",detail:"喝点东西，慢慢聊",activities:[
    {name:"喝咖啡",icon:"☕",detail:"找间喜欢的小店"},
    {name:"散步",icon:"🌿",detail:"慢慢走慢慢聊"},
    {name:"吃晚餐",icon:"🍝",detail:"一起尝点好吃的",subactivities:[
      {name:"火锅",icon:"🍲",detail:"热气腾腾地聚一聚"},
      {name:"烤肉",icon:"🥩",detail:"边烤边聊更热闹"},
      {name:"西餐",icon:"🍷",detail:"慢慢享受一顿晚餐"},
      {name:"中餐",icon:"🥢",detail:"一起尝熟悉的味道"},
    ]},
  ]},
  {id:"culture",name:"文化娱乐",icon:"🎞️",detail:"一起分享有趣体验",activities:[
    {name:"看电影",icon:"🎞️",detail:"分享同一个故事"},
    {name:"看展",icon:"🖼️",detail:"逛逛有趣的展览"},
    {name:"唱歌",icon:"🎤",detail:"唱几首喜欢的歌"},
  ]},
  {id:"sport",name:"户外运动",icon:"🥾",detail:"动起来，看看风景",activities:[
    {name:"骑行",icon:"🚲",detail:"吹着风一路向前"},
    {name:"游泳",icon:"🏊",detail:"清凉地动一动"},
    {name:"徒步",icon:"🥾",detail:"去户外看看风景"},
    {name:"打球",icon:"🏸",detail:"一起运动一下"},
  ]},
  {id:"free",name:"自由安排",icon:"✨",detail:"保留一点随性和惊喜",activities:[
    {name:"小惊喜",icon:"✨",detail:"把安排交给我"},
    {name:"其他活动",icon:"＋",detail:"见面后一起决定"},
  ]},
];
const blank:Invite={to:"",note:"最近想和你见个面，一起找点有趣的事做，你愿意吗？"};

function fromUrl():Invite|null{
  const p=new URLSearchParams(location.search);
  if(p.get("invite")!=="1")return null;
  return {to:p.get("to")||"你",note:p.get("note")||"最近想和你见个面，一起找点有趣的事做，你愿意吗？"};
}
function replyFromUrl():Reply|null{
  const p=new URLSearchParams(location.search);
  if(p.get("reply")!=="1")return null;
  const picked=(p.get("activities")||"").split("|").filter(Boolean);
  return {to:p.get("to")||"对方",picked,plan:{date:p.get("date")||"",time:p.get("time")||"",place:p.get("place")||"地点待定"}};
}
function prettyDate(date:string){if(!date)return "日期待定";return new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"short"}).format(new Date(`${date}T12:00:00`))}

function roundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number){
  ctx.beginPath();ctx.moveTo(x+radius,y);ctx.lineTo(x+width-radius,y);ctx.quadraticCurveTo(x+width,y,x+width,y+radius);ctx.lineTo(x+width,y+height-radius);ctx.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);ctx.lineTo(x+radius,y+height);ctx.quadraticCurveTo(x,y+height,x,y+height-radius);ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
}
function wrappedLines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number){
  const lines:string[]=[];let line="";
  for(const char of text){const next=line+char;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=char}else line=next}
  if(line)lines.push(line);return lines;
}
async function createResultImage(invite:Invite,picked:string[],plan:Plan){
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1440;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
  const gradient=ctx.createLinearGradient(0,0,1080,1440);gradient.addColorStop(0,"#fff4ef");gradient.addColorStop(1,"#f6dcdf");ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1440);
  ctx.fillStyle="#d9687a";roundedRect(ctx,450,110,180,180,62);ctx.fill();ctx.fillStyle="#ffffff";ctx.textAlign="center";ctx.font='700 76px Georgia,"PingFang SC",serif';ctx.fillText("✦",540,225);
  ctx.fillStyle="#d9687a";ctx.font='800 26px Arial,"PingFang SC",sans-serif';ctx.letterSpacing="7px";ctx.fillText("SEE YOU SOON",540,355);ctx.letterSpacing="0px";
  ctx.fillStyle="#272223";ctx.font='400 82px Georgia,"Songti SC","PingFang SC",serif';ctx.fillText("安排好啦！",540,470);
  ctx.fillStyle="#81777a";ctx.font='400 30px Arial,"PingFang SC",sans-serif';ctx.fillText(`${invite.to} 已经选好见面安排`,540,530);
  ctx.fillStyle="#ffffff";ctx.shadowColor="rgba(114,47,61,.10)";ctx.shadowBlur=34;roundedRect(ctx,100,610,880,570,48);ctx.fill();ctx.shadowBlur=0;
  const rows=[{label:"日期与时间",value:`${prettyDate(plan.date)} · ${plan.time}`},{label:"见面活动",value:picked.join(" · ")},{label:"见面地点",value:plan.place}];
  let y=690;ctx.textAlign="left";
  for(const row of rows){ctx.fillStyle="#d9687a";ctx.font='800 22px Arial,"PingFang SC",sans-serif';ctx.fillText(row.label,165,y);ctx.fillStyle="#272223";ctx.font='600 35px Arial,"PingFang SC",sans-serif';const lines=wrappedLines(ctx,row.value,750);lines.slice(0,3).forEach((line,index)=>ctx.fillText(line,165,y+55+index*48));y+=155+Math.max(0,lines.slice(0,3).length-1)*48}
  ctx.textAlign="center";ctx.fillStyle="#722f3d";ctx.font='700 28px Georgia,"PingFang SC",serif';ctx.fillText("期待见面 · DATE",540,1300);ctx.fillStyle="#9d9091";ctx.font='400 20px Arial,"PingFang SC",sans-serif';ctx.fillText("把美好的安排，分享给重要的人",540,1345);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Image generation failed")),"image/png"));
  return new File([blob],`DATE-${plan.date||"邀请"}.png`,{type:"image/png"});
}

export default function Home(){
  const [invite,setInvite]=useState<Invite>(blank);
  const [received,setReceived]=useState<Invite|null>(null);
  const [reply,setReply]=useState<Reply|null>(null);
  const [ready,setReady]=useState(false);
  const [step,setStep]=useState(1);
  const [shareUrl,setShareUrl]=useState("");
  const [copied,setCopied]=useState(false);
  const [installPrompt,setInstallPrompt]=useState<InstallPrompt|null>(null);

  useEffect(()=>{
    const initTimer=window.setTimeout(()=>{setReply(replyFromUrl());setReceived(fromUrl());setReady(true)},0);
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>undefined);
    const handler=(e:Event)=>{e.preventDefault();setInstallPrompt(e as InstallPrompt)};
    window.addEventListener("beforeinstallprompt",handler);return()=>{window.clearTimeout(initTimer);window.removeEventListener("beforeinstallprompt",handler)};
  },[]);

  function create(e:FormEvent){e.preventDefault();const p=new URLSearchParams({invite:"1",to:invite.to,note:invite.note});setShareUrl(`${location.origin}${location.pathname}?${p}`);setCopied(false)}
  async function copy(){await navigator.clipboard.writeText(shareUrl);setCopied(true)}
  async function share(){if(navigator.share)await navigator.share({title:`给${invite.to}的见面邀请`,text:`${invite.to}，有一份见面邀请等你回应。`,url:shareUrl});else await copy()}
  async function install(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)}}
  function reset(){history.replaceState({},"",location.pathname);setReceived(null);setReply(null);setStep(1)}

  if(!ready)return <main className="app-loading"><span>✦</span></main>;
  if(reply)return <ReplyPage reply={reply} reset={reset}/>;
  if(received)return <Receiver invite={received} reset={reset}/>;

  return <main className="app-bg"><section className="phone-app">
    <header className="app-top"><div><span className="app-mark">✦</span><div><small>GOOD DAY</small><strong>DATE</strong></div></div>{installPrompt&&<button className="install-chip" onClick={install}>安装 App</button>}</header>
    <div className="progress"><i style={{width:`${step/2*100}%`}}/></div>
    <form className="app-content" onSubmit={create}>
      {step===1&&<section className="step-screen">
        <p className="kicker">STEP 1 · 选择邀请对象</p><h1>这次想邀请<br/><em>谁呢？</em></h1><p className="subcopy">朋友聚会或两人见面都适用。你只需发出邀请，具体安排由对方同意后填写。</p>
        <div className="form-card"><label><span>TA 的名字</span><input autoFocus required value={invite.to} onChange={e=>setInvite({...invite,to:e.target.value})} placeholder="你想邀请的人"/></label></div>
        <div className="sender-explainer"><span>1</span><p><b>你发送邀请</b><small>无需填写日期、地点或活动</small></p><i>→</i><span>2</span><p><b>TA 选择回应</b><small>同意后再填写见面安排</small></p></div>
      </section>}
      {step===2&&<section className="step-screen">
        <p className="kicker">STEP 2 · 写下邀请</p><h1>留一句<br/><em>想说的话</em></h1><p className="subcopy">这段话会和“同意 / 拒绝”按钮一起发给 {invite.to}。</p>
        <div className="form-card"><label><span>邀请留言</span><textarea autoFocus rows={5} maxLength={120} value={invite.note} onChange={e=>setInvite({...invite,note:e.target.value})}/><small className="counter">{invite.note.length}/120</small></label></div>
        <div className="preview-ticket single"><div><small>专属邀请</small><b>给 {invite.to}</b></div><span>✦</span><p>先选择是否愿意<br/>同意后再填写见面安排</p></div>
      </section>}
      <div className="step-actions">{step===2&&<button type="button" className="back-btn" onClick={()=>setStep(1)}>‹ 返回</button>}{step===1?<button type="button" className="primary-btn" disabled={!invite.to.trim()} onClick={()=>setStep(2)}>继续 <span>→</span></button>:<button className="primary-btn">直接发送邀请 <span>↗</span></button>}</div>
    </form>
    <nav className="bottom-nav" aria-label="主导航"><button className="active"><span>✦</span>邀请</button><button disabled><span>◷</span>等待回应</button><button onClick={install}><span>⇩</span>安装</button></nav>
    {shareUrl&&<div className="sheet-backdrop"><section className="share-sheet" role="dialog" aria-modal="true"><i/><button className="sheet-close" onClick={()=>setShareUrl("")} aria-label="关闭">×</button><div className="done-icon">✦</div><h2>可以发送啦</h2><p>把链接发给 {invite.to}。TA 会先选择同意或拒绝，你不需要填写任何见面安排。</p><div className="share-summary"><b>给 {invite.to} 的专属邀请</b><span>等待 TA 回应</span><small>同意后由 TA 选择后续内容</small></div><button className="primary-btn wide" onClick={share}>立即分享 <span>↗</span></button><button className="text-btn" onClick={copy}>{copied?"链接已复制 ✓":"复制邀请链接"}</button></section></div>}
  </section></main>;
}

function Receiver({invite,reset}:{invite:Invite;reset:()=>void}){
  const [consent,setConsent]=useState<"yes"|null>(null);
  const [declineStep,setDeclineStep]=useState(0);
  const [picked,setPicked]=useState<string[]>([]);
  const [activeCategory,setActiveCategory]=useState<string|null>(null);
  const [plan,setPlan]=useState<Plan>({date:"",time:"19:00",place:""});
  const [confirmed,setConfirmed]=useState(false);
  const [imageStatus,setImageStatus]=useState<"idle"|"generating"|"shared"|"downloaded">("idle");
  const minDate=useMemo(()=>new Date().toISOString().slice(0,10),[]);
  const declinePositions=[
    {left:"50%",top:"76%"},{left:"22%",top:"24%"},{left:"76%",top:"18%"},
    {left:"24%",top:"68%"},{left:"75%",top:"56%"},{left:"50%",top:"40%"},
    {left:"25%",top:"12%"},{left:"76%",top:"80%"},
  ];
  const category=activityCategories.find(item=>item.id===activeCategory);
  function toggle(name:string){
    setPicked(current=>{
      if(name==="吃晚餐"&&current.includes(name)){
        const mealNames=activityCategories.flatMap(item=>item.activities).find(item=>item.name===name)?.subactivities?.map(item=>item.name)??[];
        return current.filter(item=>item!==name&&!mealNames.includes(item));
      }
      return current.includes(name)?current.filter(item=>item!==name):[...current,name];
    });
  }
  function pickedInCategory(item:ActivityCategory){return item.activities.flatMap(activity=>[activity.name,...(activity.subactivities?.map(sub=>sub.name)??[])]).filter(name=>picked.includes(name)).length}
  function moveDecline(){setDeclineStep(v=>(v+1)%declinePositions.length)}
  async function shareResult(){
    setImageStatus("generating");
    try{
      const file=await createResultImage(invite,picked,plan);
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        try{await navigator.share({title:`${invite.to} 的 DATE 安排`,text:"见面安排已经选好啦！",files:[file]});setImageStatus("shared");return}
        catch(error){if(error instanceof DOMException&&error.name==="AbortError"){setImageStatus("idle");return}}
      }
      const url=URL.createObjectURL(file);const link=document.createElement("a");link.href=url;link.download=file.name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setImageStatus("downloaded");
    }catch{setImageStatus("idle")}
  }

  if(consent===null){const pos=declinePositions[declineStep];return <main className="app-bg receiver-bg"><section className="phone-app receiver-app"><header className="mini-top"><span>✦</span><small>一封只给你的邀请</small></header><section className="consent-screen"><div className="floating-heart">✦</div><p className="kicker">A DATE INVITATION</p><h1>{invite.to}，<br/>愿意和我<em>见个面</em>吗？</h1><blockquote>“{invite.note}”</blockquote><div className="consent-actions"><button className="primary-btn wide" onClick={()=>setConsent("yes")}>好呀，一起去</button><button className="decline-btn runaway" style={declineStep?{position:"absolute",left:pos.left,top:pos.top,width:"42%",transform:"translate(-50%,-50%)"}:undefined} onClick={moveDecline}>婉拒一下</button></div></section></section></main>}
  if(confirmed)return <main className="app-bg receiver-bg"><section className="phone-app receiver-app center-state success"><div className="success-rings"><span>✦</span></div><p className="kicker">SEE YOU SOON</p><h1>安排好啦！</h1><p>{prettyDate(plan.date)} · {plan.time}<br/><b>{picked.join(" · ")}</b><br/>{plan.place}</p><div className="note-card">生成一张包含完整安排的图片，直接分享给邀请人</div><button className="result-share-btn" disabled={imageStatus==="generating"} onClick={shareResult}><span>↗</span>{imageStatus==="generating"?"正在生成…":imageStatus==="downloaded"?"图片已下载":imageStatus==="shared"?"已分享":"生成图片并分享"}</button><button className="text-btn" onClick={reset}>制作我的邀请</button></section></main>;
  return <main className="app-bg receiver-bg"><section className="phone-app receiver-app">
    <header className="mini-top"><button onClick={()=>setConsent(null)}>‹</button><small>已同意 · 填写安排</small><span>✦</span></header>
    <section className="choose-screen">
      {!category?<>
        <p className="kicker">太好啦 · 由你决定</p><h1>先选择一个<br/><em>活动大类</em></h1>
        <p className="subcopy">进入大类后选择具体活动，也可以切换分类继续多选。</p>
        <div className="category-grid">{activityCategories.map(item=>{const count=pickedInCategory(item);return <button type="button" className="category-card" key={item.id} onClick={()=>setActiveCategory(item.id)}><span>{item.icon}</span><b>{item.name}</b><small>{item.detail}</small><i>{count?`已选 ${count} 项`:`${item.activities.length} 项 ›`}</i></button>})}</div>
        {picked.length>0&&<div className="category-selection"><strong>已选 {picked.length} 项</strong><span>{picked.join(" · ")}</span></div>}
      </>:<>
        <button type="button" className="category-back" onClick={()=>setActiveCategory(null)}>‹ 返回四个大类</button>
        <p className="kicker category-kicker">{category.icon} {category.name}</p><h1>选择具体的<br/><em>见面活动</em></h1>
        <div className="category-tabs" aria-label="切换活动分类">{activityCategories.map(item=><button type="button" key={item.id} className={item.id===category.id?"on":""} onClick={()=>setActiveCategory(item.id)}>{item.name}{pickedInCategory(item)>0&&` · ${pickedInCategory(item)}`}</button>)}</div>
        {picked.length>0&&<div className="selected-strip"><strong>已选 {picked.length} 项</strong>{picked.map(item=><button type="button" key={item} onClick={()=>toggle(item)}>{item} ×</button>)}</div>}
        <div className="choice-grid receiver-choices">{category.activities.map(({name,icon,detail})=>{const on=picked.includes(name);return <button type="button" key={name} className={on?"on":""} aria-pressed={on} onClick={()=>toggle(name)}><span>{icon}</span><b>{name}</b><small>{detail}</small><i>{on?"✓":"+"}</i></button>})}</div>
        {category.activities.map(activity=>activity.subactivities&&picked.includes(activity.name)&&<section className="subactivity-panel" key={`${activity.name}-options`}><div className="subactivity-title"><span>{activity.icon}</span><p><b>{activity.name}想吃什么？</b><small>可多选</small></p></div><div className="subactivity-grid">{activity.subactivities.map(item=>{const on=picked.includes(item.name);return <button type="button" key={item.name} className={on?"on":""} aria-pressed={on} onClick={()=>toggle(item.name)}><span>{item.icon}</span><b>{item.name}</b><i>{on?"✓":"+"}</i></button>})}</div></section>)}
        <div className="form-card compact"><div className="input-row"><label><span>日期</span><input required type="date" min={minDate} value={plan.date} onChange={e=>setPlan({...plan,date:e.target.value})}/></label><label><span>时间</span><input required type="time" value={plan.time} onChange={e=>setPlan({...plan,time:e.target.value})}/></label></div><label><span>见面地点</span><input required value={plan.place} onChange={e=>setPlan({...plan,place:e.target.value})} placeholder="你希望在哪里见面？"/></label></div>
        <button className="primary-btn wide sticky-confirm" disabled={!picked.length||!plan.date||!plan.place.trim()} onClick={()=>setConfirmed(true)}>确认我的选择 <span>✓</span></button>
      </>}
    </section>
  </section></main>;
}

function ReplyPage({reply,reset}:{reply:Reply;reset:()=>void}){
  return <main className="app-bg receiver-bg"><section className="phone-app receiver-app center-state success"><div className="success-rings"><span>✦</span></div><p className="kicker">DATE · 已收到回应</p><h1>{reply.to} 已经<br/>选好安排啦！</h1><p>{prettyDate(reply.plan.date)} · {reply.plan.time||"时间待定"}<br/><b>{reply.picked.length?reply.picked.join(" · "):"活动待定"}</b><br/>{reply.plan.place}</p><div className="note-card">这就是对方分享回来的最终页面</div><button className="primary-btn wide" onClick={reset}>我也要发起邀请 <span>→</span></button></section></main>;
}
