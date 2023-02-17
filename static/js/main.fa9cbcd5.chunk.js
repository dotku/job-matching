(this["webpackJsonpreact-job-matching"]=this["webpackJsonpreact-job-matching"]||[]).push([[0],{65:function(e,t,c){},66:function(e,t,c){},76:function(e,t,c){"use strict";c.r(t);var n=c(6),s=c(55),a=c.n(s),r=(c(65),c(7)),i=(c(66),c(24)),l=c(0);function o(e){var t=Object(n.useState)([]),c=Object(r.a)(t,2),s=c[0],a=c[1],o=e.phrase;Object(n.useEffect)((function(){fetch("/data/talents.json").then((function(e){return e.json()})).then((function(e){return a(e)})).catch((function(e){return console.error(e)}))}),[]);var j=s.filter((function(e){return!o||e.name.match(new RegExp(o,"i"))})).map((function(e,t){return Object(l.jsx)("div",{className:"col-sm-6 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title mb-0",children:Object(l.jsxs)("div",{className:"d-flex flex-row",children:[Object(l.jsx)("div",{style:{width:"52px",height:"52px",lineHeight:"52px"},className:"bg-secondary text-light rounded-circle d-inline-block",children:Object(l.jsx)("div",{className:"d-flex justify-content-center align-items-center",children:Object(l.jsx)("i",{className:"bi bi-person-fill h2 mb-0",style:{lineHeight:"52px"}})})}),Object(l.jsxs)("div",{className:"ms-2 flex-grow-1",children:[Object(l.jsxs)("div",{className:"d-flex justify-content-between",children:[Object(l.jsxs)("div",{children:[Object(l.jsx)("span",{className:"h5",children:Object(l.jsx)(i.b,{to:"/resume",className:"mb-0",children:e.name})}),Object(l.jsxs)("span",{title:"Year of Experience",className:"ms-1",children:[e.career_age,"yr(s)"]})]}),e.salary&&Object(l.jsx)("div",{title:"Salary",className:"text-end",children:new Intl.NumberFormat("en",{notation:"compact",style:"currency",currency:"USD"}).format(e.salary)})]}),Object(l.jsxs)("div",{children:[Object(l.jsx)("span",{children:e.highest_position}),e.current_company&&Object(l.jsxs)("span",{children:[" at ",Object(l.jsx)(i.b,{to:"/coperation/".concat(e.current_company),children:e.current_company})]})]})]})]})}),Object(l.jsx)("div",{className:"card-body p-0 pt-3",children:Object(l.jsx)("div",{children:e.looking_for})})]})})},t)}));return j.length?Object(l.jsxs)("div",{children:[Object(l.jsx)(i.b,{to:"talents",children:Object(l.jsx)("h2",{className:"d-inline-block",children:"Candidates"})}),Object(l.jsx)("div",{className:"row mb-3",children:j})]}):null}var j=c(1),d=c(4),b=c(15),h=c(14);function m(e){var t=e.children;return e.error?Object(l.jsx)("div",{className:"alert alert-danger",children:"Something goes wrong, please come back later."}):Object(l.jsx)(l.Fragment,{children:t})}var u=c(18),O=c(43),x=Object(O.a)({apiKey:"AIzaSyCEsb8BLbmH-tyI79fKxvx9irl8VVWgVKU",authDomain:"dk-job.firebaseapp.com",projectId:"dk-job",storageBucket:"dk-job.appspot.com",messagingSenderId:"1039321629261",appId:"1:1039321629261:web:e8b67df5b009d517045204",measurementId:"G-ED7TSVRR8D"},"jobApp"),p=Object(b.f)(x);function f(e){var t=e.phrase,c=Object(n.useState)(!0),s=Object(r.a)(c,2),a=s[0],o=s[1],h=Object(n.useState)(null),O=Object(r.a)(h,2),x=O[0],f=O[1],v=Object(n.useState)([]),g=Object(r.a)(v,2),N=g[0],y=g[1];Object(n.useEffect)((function(){function e(){return(e=Object(d.a)(Object(j.a)().mark((function e(){var t,c;return Object(j.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],c=Object(b.b)(p,"job"),e.prev=2,e.next=5,Object(b.e)(c);case 5:e.sent.forEach((function(e){t.push(Object(u.a)({id:e.id},e.data()))})),e.next=13;break;case 9:e.prev=9,e.t0=e.catch(2),console.error(e.t0),f(e.t0);case 13:y(t),o(!1);case 15:case"end":return e.stop()}}),e,null,[[2,9]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[]);var w=N.filter((function(e){return!t||e.title.match(new RegExp(t,"i"))})).map((function(e,t){var c=e.title,n=e.id,s=e.company,a=e.agent;return Object(l.jsx)("div",{className:"col-sm-6 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title h5",children:Object(l.jsx)(i.b,{to:"/job/".concat(n),children:c})}),Object(l.jsx)("div",{className:"card-text",children:s&&Object(l.jsxs)("div",{className:"text-muted text-capitalize",children:[s,a&&" / ".concat(a)]})})]})})},t)}));return w.length?Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Jobs"}),a?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(m,{error:x,children:Object(l.jsx)("div",{className:"row my-3",children:w.length?w:"empty content"})})]}):null}function v(){var e=Object(h.f)().id,t=Object(n.useState)(null),c=Object(r.a)(t,2),s=c[0],a=c[1],i=Object(n.useState)(!0),o=Object(r.a)(i,2),u=o[0],O=o[1],x=Object(n.useState)(null),f=Object(r.a)(x,2),v=f[0],g=f[1];return Object(n.useEffect)((function(){function t(){return(t=Object(d.a)(Object(j.a)().mark((function t(){var c,n;return Object(j.a)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return c=Object(b.c)(p,"job",e),t.prev=1,t.next=4,Object(b.d)(c);case 4:n=t.sent,g(n.data()),t.next=12;break;case 8:t.prev=8,t.t0=t.catch(1),console.error(t.t0),a(t.t0);case 12:O(!1);case 13:case"end":return t.stop()}}),t,null,[[1,8]])})))).apply(this,arguments)}!function(){t.apply(this,arguments)}()}),[]),u?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(m,{error:s,children:Object(l.jsxs)("div",{className:"mb-5",children:[Object(l.jsx)("h2",{children:v.title}),v.company&&Object(l.jsx)("div",{children:Object(l.jsx)("strong",{children:v.company})}),v.referenceJobID&&Object(l.jsx)("div",{children:Object(l.jsx)("small",{children:v.referenceJobID})}),Object(l.jsx)("div",{dangerouslySetInnerHTML:{__html:v.content},className:"my-3"}),v.contact_name&&Object(l.jsx)("div",{className:"text-center mt-4",children:v.contact_email&&Object(l.jsx)("a",{href:"mailto:".concat(v.contact_email,"?subject=Regarding the job ").concat(v.title,"&body=%0D%0A%0D%0A%0D%0Asent from job-matching"),className:"btn btn-outline-dark",children:"Apply"})})]})})}var g=c(84),N=c(35),y=c.n(N),w=Object(g.a)({root:{background:"#333",border:0,boxShadow:"0 3px 5px 2px rgba(255, 105, 135, .3)",color:"white",padding:"30px","& a":{color:"white"}}});function S(e){var t=e.classNames,c=w();return Object(l.jsx)("footer",{className:y()("footer",c.root,t),children:Object(l.jsxs)("div",{className:"container",children:[Object(l.jsxs)("div",{className:"row",children:[Object(l.jsxs)("div",{className:"col-md-3 col-xs-6",children:[Object(l.jsx)("div",{children:"Job Boards"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://hired.com/x/1cebk",children:"Hired"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://woo.io",children:"Woo.io"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.linkedin.com",children:"LinkedIn"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://angel.co",children:"Angel.co"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.indeed.com/",children:"indeed"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.dice.com/",children:"Dice"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3 col-xs-6",children:[Object(l.jsx)("div",{children:"Interview Preperation"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://interviewcake.com",children:"InterviewCake"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.pramp.com/#/",children:"Pramp"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://leetcode.com",children:"LeetCode"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.hackerrank.com",children:"HackerRank"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3",children:[Object(l.jsx)("div",{children:"Agents"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.teksystems.com/en",children:"TEKSystems"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.modis.com/",children:"modis"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://xoriant.com",children:"xoriant"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://www.collabera.com/",children:"Collabera"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"http://www.infinity-cs.com",children:"Infinity Consulting Solutions"})}),Object(l.jsx)("li",{children:Object(l.jsx)("a",{href:"https://www.ustechsolutions.com/",children:"US Tech Solutions"})})]})]}),Object(l.jsxs)("div",{className:"col-md-3",children:[Object(l.jsx)("div",{children:"Join Us"}),Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:"Welcome to fork and submit pull request."}),Object(l.jsxs)("li",{children:["Email me if you want to join the team ",Object(l.jsx)("a",{href:"mailto:jobmatching2023@gmail.com",children:"jobmatching2023(at)gmail.com"})]})]})]})]}),Object(l.jsx)("small",{className:"d-block small text-center",children:"Copyrights \xa9 2019 - 2023"})]})})}var k=function(e){var t=e.children,c=e.title;return Object(l.jsx)("div",{title:c||"",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:t})};function C(e){var t=e.path,c=Object(n.useState)(!0),s=Object(r.a)(c,2),a=s[0],i=s[1],o=Object(n.useState)(null),h=Object(r.a)(o,2),m=h[0],u=h[1],O=Object(n.useState)(!1),x=Object(r.a)(O,2),p=x[0],f=x[1];if(Object(n.useEffect)((function(){function e(){return(e=Object(d.a)(Object(j.a)().mark((function e(){var c;return Object(j.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(b.d)(t);case 3:c=e.sent,u(c.data()),i(!1),e.next=12;break;case 8:e.prev=8,e.t0=e.catch(0),f(!0),console.error(e.t0);case 12:case"end":return e.stop()}}),e,null,[[0,8]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[t]),p&&console.error(),a)return Object(l.jsx)(l.Fragment,{children:"Loading ..."});var v=m.url,g=m.name;return Object(l.jsxs)(k,{children:["parent: ",Object(l.jsx)("a",{href:v,children:g})]})}function E(e){var t=e.name,c=e.url,n=e.candidatesNumber,s=e.jobsNumber,a=e.corporationNumber,r=e.memberNumber,i=e.revenue,o=e.description,j=e.parent;return Object(l.jsx)("div",{className:"col-sm-6 col-md-4 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title h5",children:c?Object(l.jsx)("a",{href:c,children:t}):t}),Object(l.jsxs)("div",{className:"card-text",children:[r&&Object(l.jsxs)("div",{title:"Member Number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Members:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(r)]}),n&&Object(l.jsxs)("div",{title:"Candidate Number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Candidates:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(n)]}),s&&Object(l.jsxs)("div",{title:"Job Number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Jobs:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(s)]}),a&&Object(l.jsxs)("div",{title:"Corporation Number",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Corporations:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(a)]}),i&&Object(l.jsxs)("div",{title:"Revenue",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:["Revenue:"," ",new Intl.NumberFormat("en",{notation:"compact",style:"currency",currency:"USD"}).format(i)]}),j&&Object(l.jsx)(C,{path:j}),o&&Object(l.jsx)("div",{title:"description",className:"ps-1","data-toggle":"tooltip","data-placement":"top",children:o})]})]})})})}var I="recruiting SAAS",T="candidate pool",A="recruiting",D="job board",R=Object(O.a)({apiKey:"AIzaSyBddjN4Z0RnDW8fu8qwoAZ9oy_pENPm6Fc",authDomain:"dk-corporation.firebaseapp.com",databaseURL:"https://dk-corporation-default-rtdb.firebaseio.com",projectId:"dk-corporation",storageBucket:"dk-corporation.appspot.com",messagingSenderId:"889307756555",appId:"1:889307756555:web:b6a78034f82ed6b9f82f0e",measurementId:"G-BM1VNZNS61"},"app-corporation"),_=Object(b.f)(R),M=Object(b.b)(_,"corporation");function B(e){var t=Object(n.useState)(!0),c=Object(r.a)(t,2),s=c[0],a=c[1],i=Object(n.useState)(null),o=Object(r.a)(i,2),h=o[0],u=o[1],O=Object(n.useState)([]),x=Object(r.a)(O,2),p=x[0],f=x[1],v=e.phrase;Object(n.useEffect)((function(){function e(){return(e=Object(d.a)(Object(j.a)().mark((function e(){var t;return Object(j.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],e.prev=1,e.next=4,Object(b.e)(M);case 4:e.sent.forEach((function(e){var c=e.data().tags;c&&(Array.isArray(c)&&c.includes(T)&&c.includes(I)&&t.push(e.data()),(c[D]||c[T]&&(c[I]||c[A]))&&t.push(e.data()))})),e.next=12;break;case 8:e.prev=8,e.t0=e.catch(1),console.error(e.t0),u(e.t0);case 12:f(t),a(!1);case 14:case"end":return e.stop()}}),e,null,[[1,8]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[]);var g=p.filter((function(e){return!v||e.name.match(new RegExp(v,"i"))})).map((function(e,t){var c=e.name,n=e.url,s=e.candidatesNumber,a=e.jobsNumber,r=e.corporationNumber,i=e.memberNumber,o=e.revenue;return Object(l.jsx)("div",{className:"col-sm-6 col-md-4 my-2",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"card-title h5",children:n?Object(l.jsx)("a",{href:n,children:c}):{name:c}}),Object(l.jsxs)("div",{className:"card-text",children:[i&&Object(l.jsxs)("div",{title:"candidate number","data-toggle":"tooltip","data-placement":"top",children:["Members:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(i)]}),s&&Object(l.jsxs)("div",{title:"candidate number","data-toggle":"tooltip","data-placement":"top",children:["Candidates:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(s)]}),a&&Object(l.jsxs)("div",{title:"candidate number","data-toggle":"tooltip","data-placement":"top",children:["Jobs:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(a)]}),r&&Object(l.jsxs)("div",{title:"candidate number","data-toggle":"tooltip","data-placement":"top",children:["Corporations:"," ",new Intl.NumberFormat("en",{notation:"compact"}).format(r)]}),o&&Object(l.jsxs)("div",{title:"candidate number","data-toggle":"tooltip","data-placement":"top",children:["Revenue:"," ",new Intl.NumberFormat("en",{notation:"compact",style:"currency",currency:"USD"}).format(o)]})]})]})})},t)}));return Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Job Boards"}),s?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(m,{error:h,children:Object(l.jsx)("div",{className:"row my-3",children:g.length?g:"empty content"})})]})}function F(e){var t=e.phrase,c=Object(n.useState)(!0),s=Object(r.a)(c,2),a=s[0],i=s[1],o=Object(n.useState)(null),h=Object(r.a)(o,2),O=h[0],x=h[1],p=Object(n.useState)([]),f=Object(r.a)(p,2),v=f[0],g=f[1],N=Object(n.useState)(!1),w=Object(r.a)(N,2),S=w[0],k=w[1];Object(n.useEffect)((function(){function e(){return(e=Object(d.a)(Object(j.a)().mark((function e(){var t;return Object(j.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],e.prev=1,e.next=4,Object(b.e)(M);case 4:e.sent.forEach((function(e){t.push(e.data())})),e.next=12;break;case 8:e.prev=8,e.t0=e.catch(1),console.error(e.t0),x(e.t0);case 12:g(t),i(!1);case 14:case"end":return e.stop()}}),e,null,[[1,8]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[]);var C=v.filter((function(e){return!t||e.name.match(new RegExp(t,"i"))})),I=Object(n.useMemo)((function(){return S?C.sort((function(e,t){return t.revenue-e.revenue})):C}),[S,C]);return Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Corporations"}),Object(l.jsxs)("div",{children:["Total: ",I.length," | Sort by"," ",Object(l.jsx)("button",{onClick:function(){return k(!S)},className:y()("btn",S?"btn-dark":"btn-outline-dark"),children:"Revenue"})]}),a?Object(l.jsx)("div",{children:"Loading ..."}):Object(l.jsx)(m,{error:O,children:Object(l.jsx)("div",{className:"row my-3",children:I.length?I.map((function(e,t){return Object(n.createElement)(E,Object(u.a)(Object(u.a)({},Object(u.a)({},e)),{},{key:t}))})):"empty content"})}),Object(l.jsx)("div",{className:"text-center",children:Object(l.jsxs)("form",{action:"https://www.paypal.com/cgi-bin/webscr",method:"post",target:"_top",children:[Object(l.jsx)("input",{type:"hidden",name:"cmd",value:"_s-xclick"}),Object(l.jsx)("input",{type:"hidden",name:"hosted_button_id",value:"335K4PZWH5ZHJ"}),Object(l.jsx)("input",{type:"image",src:"https://www.paypalobjects.com/en_US/i/btn/btn_paynowCC_LG.gif",border:"0",name:"submit",alt:"PayPal - The safer, easier way to pay online!"}),Object(l.jsx)("img",{alt:"",border:"0",src:"https://www.paypalobjects.com/en_US/i/scr/pixel.gif",width:"1",height:"1"})]})})]})}function H(e){return Object(l.jsx)("input",{className:"form-control",value:e.phrase,onChange:e.onChange,placeholder:"Search"})}function L(e){var t=e.phrase,c=e.handlePhraseChange;return Object(l.jsxs)("div",{className:"header d-flex justify-content-between align-items-center",children:[Object(l.jsx)(i.b,{to:"/",children:Object(l.jsx)("h1",{className:"my-3",children:"JOB MATCHING"})}),Object(l.jsx)("div",{className:"d-flex h-100",children:Object(l.jsx)(H,{value:t,onChange:c})})]})}var J=c(12),P=c(58),W=c.n(P),$=[{time:(new Date).getTime()-Math.floor(1e6*Math.random()),content:"Lorem ipsum dolor sit amet, consectetur adipiscing elit"},{time:(new Date).getTime()-Math.floor(1e7*Math.random()),content:"consectetur adipiscing elit"}];function U(){var e=Object(n.useState)($),t=Object(r.a)(e,2),c=t[0],s=t[1],a=Object(n.useState)(""),i=Object(r.a)(a,2),o=i[0],j=i[1],d=function(){o&&(s([{time:(new Date).getTime(),content:o}].concat(Object(J.a)(c))),j(""))};return Object(l.jsxs)("div",{children:[Object(l.jsx)("textarea",{required:!0,className:"form-control",autoFocus:!0,value:o,onKeyDown:function(e){13===e.keyCode&&e.metaKey&&d()},onChange:function(e){console.log("handleTextAreaChange"),j(e.target.value)}}),Object(l.jsx)("div",{className:"d-flex justify-content-end",children:Object(l.jsx)("button",{type:"submit",className:"btn mt-2",onClick:d,disabled:!o.length,children:"Post"})}),c.length&&c.filter((function(e,t){return t<100})).map((function(e,t){var c=e.time,n=e.content;return Object(l.jsxs)("div",{className:"mt-3 border-bottom pb-3",children:[Object(l.jsx)("small",{className:"text-muted",children:Object(l.jsx)(W.a,{fromNow:!0,children:c})}),Object(l.jsx)("div",{children:n})]},t)}))]})}function V(){return Object(l.jsx)("button",{type:"button",className:"btn btn-secondary","data-toggle":"tooltip","data-placement":"top",title:"Tooltip on top",children:"Tooltip on top"})}function K(){return Object(l.jsxs)("div",{className:"row",children:[Object(l.jsx)("div",{className:"col-md-4 mr-3 mb-3",children:Object(l.jsx)(q,{})}),Object(l.jsx)("div",{className:"col-md-8 mr-3 mb-3",children:Object(l.jsx)(z,{})})]})}function q(){return Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsxs)("div",{className:"d-flex flex-row",children:[Object(l.jsx)("span",{style:{width:"52px",height:"52px",lineHeight:"52px"},className:"bg-secondary text-light rounded-circle d-inline-block",children:Object(l.jsx)("div",{className:"d-flex justify-content-center align-items-center",children:Object(l.jsx)("i",{className:"bi bi-person-fill h2 mb-0",style:{lineHeight:"52px"}})})}),Object(l.jsx)("span",{className:"d-inline-block ms-2 mb-0",style:{lineHeight:"52px"},children:Object(l.jsx)("strong",{children:"$FIRST_NAME, $LAST_NAME"})})]}),Object(l.jsx)("div",{}),Object(l.jsx)("div",{className:"mt-2",children:Object(l.jsxs)("div",{className:"list-group list-group-flush",children:[Object(l.jsxs)("strong",{className:"font-weight-bold list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Total Years of Experience"}),Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"JavaScript"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"HTML"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"CSS"})," ",Object(l.jsx)("span",{children:"10yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"React"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Machine Learning"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Java"})," ",Object(l.jsx)("span",{children:"1yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"PHP"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Node"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"AWS"})," ",Object(l.jsx)("span",{children:"3yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"MySQL"})," ",Object(l.jsx)("span",{children:"5yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"MongoDB"})," ",Object(l.jsx)("span",{children:"1yrs"})]}),Object(l.jsxs)("div",{className:"list-group-item d-flex justify-content-between",children:[Object(l.jsx)("span",{children:"Firebase"})," ",Object(l.jsx)("span",{children:"3yrs"})]})]})})]})})}function z(){return Object(l.jsx)("div",{className:"card",children:Object(l.jsx)("div",{className:"card-body",children:Object(l.jsxs)("div",{children:[Object(l.jsx)("h3",{children:"Working Experience"}),Object(J.a)(Array(3).keys()).map((function(e,t){return Object(l.jsxs)("div",{className:"my-3",children:[Object(l.jsx)("div",{children:"$POSITION"}),Object(l.jsx)("div",{children:"$COMPANY_NAME"}),Object(l.jsx)("div",{children:"$DATE_START, $DATE_END"}),Object(l.jsx)("div",{children:"$CONTRIBUTIONS"}),Object(l.jsx)("div",{children:"$TECH_STACK"})]},t)})),Object(l.jsx)("h3",{children:"Education"}),Object(J.a)(Array(3).keys()).map((function(e,t){return Object(l.jsxs)("div",{className:"my-3",children:[Object(l.jsx)("div",{children:"$SCHOOL_NAME"}),Object(l.jsx)("div",{children:"$MAJOR"}),Object(l.jsx)("div",{children:"$DATE_START, $DATE_END"})]},t)}))]})})})}function G(){return Object(l.jsxs)("div",{style:{maxWidth:800},children:[Object(l.jsx)("h2",{children:"Career AI"}),Object(l.jsx)("p",{children:"The mission of this project is to build an AI which is aimed on helpping the candidates to achieve their career goals."}),Object(l.jsx)("p",{children:"We will trace all career related resource to find the best way to support your career growth or match your idea on career change."}),Object(l.jsx)("p",{children:"Remember, there is always a cost on career movement or change, but if the candidate can land on the one they passionatd about. We belived all effort might be worth to payoff."}),Object(l.jsx)("p",{children:"Best good luck on the journey of the career life!"})]})}var Z=c(10),Y={get timestamp(){return(new Date).getTime()}};function Q(){var e=Object(n.useState)(Y),t=Object(r.a)(e,2),c=t[0],s=t[1],a=Object(n.useState)(!1),i=Object(r.a)(a,2),o=i[0],h=i[1],O=Object(n.useState)(null),x=Object(r.a)(O,2),p=x[0],f=x[1],v=Object(n.useState)(!1),g=Object(r.a)(v,2),N=g[0],y=g[1],w=function(e){s(Object(u.a)(Object(u.a)({},c),{},Object(Z.a)({},e.target.name,e.target.value)))},S=function(){var e=Object(d.a)(Object(j.a)().mark((function e(t){var n;return Object(j.a)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),console.log(c),h(!0),n=Object(b.b)(_,"corporation_temp"),e.prev=4,e.next=7,Object(b.a)(n,c);case 7:e.sent?(h(!1),y(!0),setTimeout((function(){return y(!1)}),3e3),t.target.reset(),s(Y)):f(!0),e.next=16;break;case 11:e.prev=11,e.t0=e.catch(4),console.error(e.t0),h(!1),f(e.t0);case 16:case"end":return e.stop()}}),e,null,[[4,11]])})));return function(t){return e.apply(this,arguments)}}();return Object(l.jsxs)(l.Fragment,{children:[Object(l.jsxs)("form",{onSubmit:S,children:[Object(l.jsx)("input",{className:"my-2 form-control",name:"companyName",id:"companyName",placeholder:"corperation name",required:!0,onChange:w}),Object(l.jsx)("input",{className:"my-2 form-control",name:"companyTotalRegisteratedMember",placeholder:"total reigistered member number",onChange:w}),Object(l.jsx)("input",{className:"my-2 form-control",name:"companyCandidatePoolNumber",placeholder:"candidate pool number",onChange:w}),Object(l.jsx)("input",{className:"my-2 form-control",name:"companyAvaiableJobNumber",placeholder:"avaiable jobs number",onChange:w}),Object(l.jsx)("input",{className:"my-2 form-control",name:"companyRegisteratedCoperationNumber",placeholder:"registrated corporation number",onChange:w}),Object(l.jsx)("input",{className:"my-2 form-control",name:"companyRevenu",placeholder:"revenue",onChange:w}),["recruiting SAAS","candidate pool"].map((function(e,t){return Object(l.jsxs)("div",{className:"form-check",children:[Object(l.jsx)("input",{className:"form-check-input",type:"checkbox",name:"tags",value:e,id:"tags-".concat(t),onChange:(n=e,function(e){s(Object(u.a)(Object(u.a)({},c),{},{tags:Object(u.a)(Object(u.a)({},c.tags),{},Object(Z.a)({},n,e.target.checked))}))})}),Object(l.jsx)("label",{className:"form-check-label",htmlFor:"tags-".concat(t),children:e})]},t);var n})),Object(l.jsx)("button",{type:"submit",className:"btn btn-outline-dark my-3",disabled:o,children:"Submit"})]}),N&&Object(l.jsx)("div",{className:"alert alert-success fade show",role:"alert",children:"Successfully submited."}),p&&Object(l.jsx)(m,{error:p})]})}function X(e){var t=e.items,c=e.linkClassNames;return t&&t.length?Object(l.jsx)("ul",{children:t.map((function(e,t){return Object(l.jsx)("li",{children:e.url?Object(l.jsx)("a",{href:e.url,className:y()(c),children:e.title}):e.title},t)}))}):null}var ee=[{title:"TEKSystems",url:"https://www.teksystems.com/en"},{title:"modis",url:"https://www.modis.com/"},{title:"xoriant",url:"http://xoriant.com"},{title:"Collabera",url:"http://www.collabera.com/"},{title:"Infinity Consulting Solutions",url:"http://www.infinity-cs.com"},{title:"US Tech Solutions",url:"https://www.ustechsolutions.com/"},{title:"TrustBrain",url:"https://app.usebraintrust.com/r/weijing1/"}];function te(e){var t=e.phrase,c=ee.filter((function(e){return!t||e.title.match(new RegExp(t,"i"))}));return c.length?Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Agent Companies"}),Object(l.jsx)(X,{items:c})]}):null}function ce(){var e=Object(n.useState)([]),t=Object(r.a)(e,2),c=t[0],s=t[1];return Object(n.useEffect)((function(){fetch("/data/events.json").then((function(e){return e.json()})).then((function(e){return s(e)})).catch((function(e){return console.error(e)}))}),[]),c&&c.length?c.filter((function(e,t){return 0===t})).map((function(e,t){return Object(l.jsxs)("div",{className:"card mb-3",id:"event-card",children:[Object(l.jsx)("a",{href:e.url,children:Object(l.jsx)("img",{className:"card-img-top",src:e.imgSrc,alt:e.title})}),Object(l.jsxs)("div",{className:"card-body text-center",children:[Object(l.jsx)("h3",{className:"card-title",children:e.title}),Object(l.jsx)("a",{href:e.url,className:"btn btn-primary",children:"Register"})]})]},t)})):Object(l.jsx)("div",{children:"Empty Content"})}function ne(){return Object(l.jsx)("div",{style:{height:"100%",display:"flex",justifyContent:"center",alignItems:"center"},children:Object(l.jsx)("div",{className:"spinner-border",role:"status",children:Object(l.jsx)("span",{className:"visually-hidden",children:"Loading..."})})})}function se(){var e=Object(n.useState)(),t=Object(r.a)(e,2),c=t[0],s=t[1],a=Object(n.useState)(!0),i=Object(r.a)(a,2),o=i[0],j=i[1];return Object(n.useEffect)((function(){function e(){s(document.querySelector("#event-card").clientHeight),j(!1)}setTimeout((function(){e()}),200),window.addEventListener("resize",e)}),[]),o?Object(l.jsx)(ne,{}):Object(l.jsx)("div",{className:"card mb-3",id:"tips-card",style:{height:c},children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("h3",{className:"card-title",children:"Simple Recruiting Tips"}),Object(l.jsxs)("ol",{style:{overflowY:"scroll",height:c-80},children:[Object(l.jsx)("li",{children:"Encourage employee referrals"}),Object(l.jsx)("li",{children:"Prioritize the candidate experience"}),Object(l.jsx)("li",{children:"Have a great offboarding process"}),Object(l.jsx)("li",{children:"Blind auditions, focusing on candidate performance"}),Object(l.jsx)("li",{children:"Practice collaborative hiring"}),Object(l.jsx)("li",{children:"Write better job descriptions"}),Object(l.jsx)("li",{children:"Value quality over quantity"}),Object(l.jsx)("li",{children:"Communicate a strong Employee Value Proposition"}),Object(l.jsx)("li",{children:"Explore remote work arrangements"}),Object(l.jsx)("li",{children:"Get clear (and realistic) about timelines"}),Object(l.jsx)("li",{children:"Use an interview rubric or scorecard"}),Object(l.jsx)("li",{children:"Don't discount previous candidates"})]})]})})}function ae(e){var t=e.phrase;return Object(l.jsxs)(l.Fragment,{children:[Object(l.jsxs)("div",{className:"row",children:[Object(l.jsx)("div",{className:"col-12 col-sm-6",children:Object(l.jsx)(ce,{})}),Object(l.jsx)("div",{className:"col-12 col-sm-6",children:Object(l.jsx)(se,{})})]}),Object(l.jsx)(o,{phrase:t}),Object(l.jsx)(f,{phrase:t}),Object(l.jsx)(B,{phrase:t}),Object(l.jsx)(te,{phrase:t})]})}function re(){return Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"Immigrants Report 2022"}),Object(l.jsxs)("div",{className:"row my-3",children:[Object(l.jsx)("div",{className:"col col-sm-6",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"h1",children:"211,858"}),Object(l.jsx)("div",{children:"Total Visa"})]})})}),Object(l.jsx)("div",{className:"col col-sm-6",children:Object(l.jsx)("div",{className:"card",children:Object(l.jsxs)("div",{className:"card-body",children:[Object(l.jsx)("div",{className:"h1",children:"55,058"}),Object(l.jsx)("div",{children:"Career Visa"})]})})}),Object(l.jsxs)("div",{className:"col-sm-6 my-3",children:[Object(l.jsx)("h3",{children:"Non Career Based Immigrants"}),Object(l.jsxs)("ul",{className:"list-group list-group-flush",children:[Object(l.jsx)("li",{className:"list-group-item",children:"Mexico 20,316"}),Object(l.jsx)("li",{className:"list-group-item",children:"Dominican Republic 12,918"}),Object(l.jsx)("li",{className:"list-group-item",children:"Vietnam 11,525"}),Object(l.jsx)("li",{className:"list-group-item",children:"Cuba 10,790"}),Object(l.jsx)("li",{className:"list-group-item",children:"El Salvador 10,273"}),Object(l.jsx)("li",{className:"list-group-item",children:"India 9,147"}),Object(l.jsx)("li",{className:"list-group-item",children:"China 7,600"})]})]}),Object(l.jsxs)("div",{className:"col-sm-6 my-3",children:[Object(l.jsx)("h3",{children:"Career Based Immigrants"}),Object(l.jsxs)("ul",{className:"list-group list-group-flush",children:[Object(l.jsx)("li",{className:"list-group-item",children:"EB1 6,674/3,566 (Total/China)"}),Object(l.jsx)("li",{className:"list-group-item",children:"EB2 5,468"}),Object(l.jsx)("li",{className:"list-group-item",children:"EB3 32,466"}),Object(l.jsx)("li",{className:"list-group-item",children:"EB5 6,882/4,060 (Total/China)"})]})]})]}),Object(l.jsxs)("div",{children:[Object(l.jsx)("h5",{children:"Reference"}),Object(l.jsx)("ul",{children:Object(l.jsxs)("li",{children:["Directory of Visa Categories:"," ",Object(l.jsx)("a",{href:"https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/all-visa-categories.html",children:"https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/all-visa-categories.html"})]})})]})]})}var ie=function(){var e=Object(n.useState)(""),t=Object(r.a)(e,2),c=t[0],s=t[1];return Object(l.jsx)(i.a,{children:Object(l.jsxs)("div",{className:"App",children:[Object(l.jsxs)("div",{className:"container",style:{minHeight:"calc(100vh - 239px)"},children:[Object(l.jsx)(L,{phrase:c,handlePhraseChange:function(e){console.log(e.target.value),s(e.target.value)}}),Object(l.jsx)("div",{className:"container",children:Object(l.jsxs)(h.c,{children:[Object(l.jsx)(h.a,{exact:!0,path:"/",children:Object(l.jsx)(ae,{phrase:c})}),Object(l.jsx)(h.a,{path:"/talents",children:Object(l.jsx)(o,{phrase:c})}),Object(l.jsx)(h.a,{path:"/corporations",children:Object(l.jsx)(F,{phrase:c})}),Object(l.jsx)(h.a,{path:"/corporation/create",component:Q}),Object(l.jsx)(h.a,{path:"/job/:id",component:v}),Object(l.jsx)(h.a,{path:"/story/social",component:U}),Object(l.jsx)(h.a,{path:"/resume",component:K}),Object(l.jsx)(h.a,{path:"/careerAI",component:G}),Object(l.jsx)(h.a,{path:"/knowledge-base/visa",component:re}),Object(l.jsx)(h.a,{path:"/bootstrap-lab/tooltip",component:V})]})})]}),Object(l.jsx)(S,{classNames:"mt-3"})]})})};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));a.a.render(Object(l.jsx)(ie,{}),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))}},[[76,1,2]]]);
//# sourceMappingURL=main.fa9cbcd5.chunk.js.map